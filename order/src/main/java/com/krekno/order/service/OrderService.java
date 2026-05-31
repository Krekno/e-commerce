package com.krekno.order.service;

import com.krekno.order.client.ProductClient;
import com.krekno.order.dto.OrderRequest;
import com.krekno.order.dto.OrderItemRequest;
import com.krekno.order.entity.Order;
import com.krekno.order.entity.OrderItem;
import com.krekno.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final com.krekno.order.repository.OrderItemRepository orderItemRepository;
    private final ProductClient productClient;
    private final com.krekno.order.client.PaymentClient paymentClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order createOrder(String userEmail, OrderRequest request) {
        Order order = Order.builder()
                .userEmail(userEmail)
                .status("CREATED")
                .totalAmount(BigDecimal.ZERO)
                .shippingAddressId(request.getShippingAddressId())
                .billingAddressId(request.getBillingAddressId())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            // Check stock and reduce in Product service via Feign
            boolean stockReduced = productClient.reduceStock(itemReq.getProductId(), itemReq.getQuantity());
            if (!stockReduced) {
                throw new RuntimeException("Insufficient stock for product " + itemReq.getProductId());
            }

            OrderItem orderItem = OrderItem.builder()
                    .productId(itemReq.getProductId())
                    .quantity(itemReq.getQuantity())
                    .price(itemReq.getPrice())
                    .sellerEmail(itemReq.getSellerEmail())
                    .status("PROCESSING")
                    .build();

            order.addItem(orderItem);
            total = total.add(itemReq.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Send order event to Kafka
        kafkaTemplate.send("order-events", "ORDER_PLACED:" + savedOrder.getId() + ":" + savedOrder.getTotalAmount() + ":" + userEmail + ":" + request.getShippingAddressId() + ":" + request.getBillingAddressId());

        return savedOrder;
    }

    public Order getOrderById(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public List<Order> getOrdersByUser(String userEmail) {
        return orderRepository.findByUserEmailOrderByCreatedAtDesc(userEmail);
    }

    public java.util.List<Order> getOrdersForSeller(String sellerEmail) {
        return orderRepository.findDistinctByItemsSellerEmailOrderByCreatedAtDesc(sellerEmail);
    }

    @Transactional
    public boolean updateOrderItemStatus(UUID itemId, String newStatus, String sellerEmail, String token) {
        com.krekno.order.entity.OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        if (!item.getSellerEmail().equals(sellerEmail)) {
            throw new RuntimeException("Not authorized to update this item");
        }
        
        item.setStatus(newStatus);
        orderItemRepository.save(item);
        
        if ("RETURNED".equals(newStatus)) {
            Order order = item.getOrder();
            try {
                // Ideally this should do a partial refund if there are multiple items, 
                // but the current payment service refunds the whole order.
                // We assume 1 item per order for now or trigger the order refund.
                paymentClient.refundPayment(order.getId(), token);
                order.setStatus("REFUNDED");
                for (OrderItem oi : order.getItems()) {
                    oi.setStatus("REFUNDED");
                }
                orderRepository.save(order);
            } catch (Exception e) {
                log.error("Failed to automatically refund order on return: {}", e.getMessage());
                // We can choose to swallow this or throw it so the transaction rolls back
                throw new RuntimeException("Failed to process refund: " + e.getMessage());
            }
        }
        
        return true;
    }

    @Transactional
    public boolean requestReturn(UUID itemId, String userEmail) {
        com.krekno.order.entity.OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        // Verify order belongs to user
        Order order = item.getOrder();
        if (order == null || !order.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to return this item");
        }

        if (!"DELIVERED".equals(item.getStatus())) {
            throw new RuntimeException("Can only request return for delivered items");
        }

        item.setStatus("RETURN_REQUESTED");
        orderItemRepository.save(item);
        return true;
    }

    @Transactional
    public boolean requestOrderRefund(UUID orderId, String userEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to refund this order");
        }

        // Check if all items are delivered
        boolean allDelivered = order.getItems().stream()
                .allMatch(item -> "DELIVERED".equals(item.getStatus()) || "RETURN_REQUESTED".equals(item.getStatus()) || "RETURNED".equals(item.getStatus()));
                
        if (!allDelivered) {
            throw new RuntimeException("Can only request refund after all items are delivered");
        }

        order.setStatus("REFUND_REQUESTED");
        orderRepository.save(order);
        return true;
    }

    @Transactional
    public boolean approveOrderRefund(UUID orderId, String sellerEmail, String token) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"REFUND_REQUESTED".equals(order.getStatus())) {
            throw new RuntimeException("Order is not in REFUND_REQUESTED state");
        }

        // Verify seller is part of this order
        boolean isSellerInOrder = order.getItems().stream()
                .anyMatch(item -> item.getSellerEmail().equals(sellerEmail));
        
        if (!isSellerInOrder) {
            throw new RuntimeException("Not authorized to approve refund for this order");
        }

        // Trigger payment service
        try {
            paymentClient.refundPayment(orderId, token);
        } catch (Exception e) {
            throw new RuntimeException("Failed to process refund with payment gateway: " + e.getMessage());
        }

        order.setStatus("REFUNDED");
        for (OrderItem item : order.getItems()) {
            item.setStatus("REFUNDED");
        }
        orderRepository.save(order);
        return true;
    }

    @KafkaListener(topics = "payment-events", groupId = "order-group")
    public void processPaymentEvent(String message) {
        log.info("Received payment event: {}", message);
        String[] parts = message.split(":");
        if (parts.length < 2) return;

        String status = parts[0];
        try {
            UUID orderId = UUID.fromString(parts[1]);
            orderRepository.findById(orderId).ifPresent(order -> {
                if ("PAYMENT_SUCCEEDED".equals(status)) {
                    order.setStatus("PAID");
                } else if ("PAYMENT_FAILED".equals(status)) {
                    order.setStatus("FAILED");
                }
                orderRepository.save(order);
                log.info("Order {} status updated to {}", orderId, order.getStatus());
            });
        } catch (IllegalArgumentException e) {
            log.error("Invalid order ID format in payment event: {}", message);
        }
    }
}
