package com.krekno.order.service;

import com.krekno.order.client.ProductClient;
import com.krekno.order.dto.OrderItemRequest;
import com.krekno.order.dto.OrderRequest;
import com.krekno.order.entity.Order;
import com.krekno.order.repository.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductClient productClient;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private OrderService orderService;

    private String userEmail;
    private OrderRequest orderRequest;
    private UUID productId;

    @BeforeEach
    void setUp() {
        userEmail = "user@example.com";
        productId = UUID.randomUUID();

        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductId(productId);
        itemRequest.setQuantity(2);
        itemRequest.setPrice(BigDecimal.valueOf(50.0));

        orderRequest = new OrderRequest();
        orderRequest.setItems(Collections.singletonList(itemRequest));
    }

    @Test
    void createOrder_Success() {
        when(productClient.reduceStock(productId, 2)).thenReturn(true);
        
        Order savedOrder = Order.builder()
                .id(UUID.randomUUID())
                .userEmail(userEmail)
                .status("CREATED")
                .totalAmount(BigDecimal.valueOf(100.0))
                .build();
                
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        Order result = orderService.createOrder(userEmail, orderRequest);

        assertNotNull(result);
        assertEquals("CREATED", result.getStatus());
        assertEquals(BigDecimal.valueOf(100.0), result.getTotalAmount());
        
        verify(productClient, times(1)).reduceStock(productId, 2);
        verify(orderRepository, times(1)).save(any(Order.class));
        verify(kafkaTemplate, times(1)).send(eq("order-events"), anyString());
    }

    @Test
    void createOrder_InsufficientStock_ThrowsException() {
        when(productClient.reduceStock(productId, 2)).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            orderService.createOrder(userEmail, orderRequest);
        });

        assertTrue(exception.getMessage().contains("Insufficient stock"));
        
        verify(productClient, times(1)).reduceStock(productId, 2);
        verify(orderRepository, never()).save(any(Order.class));
        verify(kafkaTemplate, never()).send(anyString(), anyString());
    }

    @Test
    void processPaymentEvent_PaymentSucceeded_UpdatesStatus() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).status("CREATED").build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        String message = "PAYMENT_SUCCEEDED:" + orderId.toString();
        orderService.processPaymentEvent(message);

        assertEquals("PAID", order.getStatus());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    void processPaymentEvent_PaymentFailed_UpdatesStatus() {
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).status("CREATED").build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        String message = "PAYMENT_FAILED:" + orderId.toString();
        orderService.processPaymentEvent(message);

        assertEquals("FAILED", order.getStatus());
        verify(orderRepository, times(1)).save(order);
    }
}
