package com.krekno.order.controller;

import org.springframework.security.access.prepost.PreAuthorize;

import com.krekno.order.dto.OrderRequest;
import com.krekno.order.entity.Order;
import com.krekno.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<Order> createOrder(
            @RequestHeader("X-User-Email") String userEmail,
            @Valid @RequestBody OrderRequest request) {
        
        return ResponseEntity.ok(orderService.createOrder(userEmail, request));
    }
}
