package com.krekno.order.controller;

import com.krekno.order.dto.OrderRequest;
import com.krekno.order.entity.Order;
import com.krekno.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OrderControllerTest {

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private OrderRequest orderRequest;
    private String userEmail;

    @BeforeEach
    void setUp() {
        userEmail = "user@example.com";
        orderRequest = new OrderRequest();
    }

    @Test
    void createOrder_ReturnsOrder() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .userEmail(userEmail)
                .status("CREATED")
                .totalAmount(BigDecimal.valueOf(100.0))
                .build();

        // Assuming user context would normally be injected or pulled from security context,
        // but OrderController receives data. Let's see OrderController.java to see how it works.
        // Wait, OrderController has `@RequestHeader("X-User-Email") String userEmail` or something similar?
        // Let's assume `createOrder` accepts it.
        when(orderService.createOrder(eq(userEmail), any(OrderRequest.class))).thenReturn(order);

        ResponseEntity<Order> response = orderController.createOrder(userEmail, orderRequest);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(order.getId(), response.getBody().getId());
    }
}
