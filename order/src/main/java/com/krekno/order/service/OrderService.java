package com.krekno.order.service;

import com.krekno.order.client.ProductClient;
import com.krekno.order.dto.OrderRequest;
import com.krekno.order.dto.OrderItemRequest;
import com.krekno.order.entity.Order;
import com.krekno.order.entity.OrderItem;
import com.krekno.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Transactional
    public Order createOrder(String userEmail, OrderRequest request) {
        Order order = Order.builder()
                .userEmail(userEmail)
                .status("CREATED")
                .totalAmount(BigDecimal.ZERO)
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
                    .build();

            order.addItem(orderItem);
            total = total.add(itemReq.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // Publish event to trigger Payment and Notification
        String message = String.format("ORDER_PLACED:%s:%s:%s", savedOrder.getId(), savedOrder.getTotalAmount(), userEmail);
        kafkaTemplate.send("order-events", message);

        return savedOrder;
    }
}
