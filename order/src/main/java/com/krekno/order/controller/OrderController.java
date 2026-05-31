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

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable java.util.UUID id) {
        // Internal lookup
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<java.util.List<Order>> getMyOrders(@RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userEmail));
    }

    @GetMapping("/seller")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<java.util.List<Order>> getSellerOrders(@RequestHeader("X-User-Email") String sellerEmail) {
        return ResponseEntity.ok(orderService.getOrdersForSeller(sellerEmail));
    }

    @PutMapping("/items/{itemId}/status")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Boolean> updateOrderItemStatus(
            @RequestHeader("X-User-Email") String sellerEmail,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(value = "jwt-access", required = false) String cookieToken,
            @PathVariable java.util.UUID itemId,
            @RequestParam String status) {
        
        String token = authHeader;
        if (token == null && cookieToken != null) {
            token = "Bearer " + cookieToken;
        }
        
        return ResponseEntity.ok(orderService.updateOrderItemStatus(itemId, status, sellerEmail, token));
    }

    @PutMapping("/items/{itemId}/return")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> requestReturn(
            @RequestHeader("X-User-Email") String userEmail,
            @PathVariable java.util.UUID itemId) {
        return ResponseEntity.ok(orderService.requestReturn(itemId, userEmail));
    }

    @PostMapping("/{orderId}/refund-request")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> requestOrderRefund(
            @RequestHeader("X-User-Email") String userEmail,
            @PathVariable java.util.UUID orderId) {
        return ResponseEntity.ok(orderService.requestOrderRefund(orderId, userEmail));
    }

    @PostMapping("/{orderId}/refund-approve")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<Boolean> approveOrderRefund(
            @RequestHeader("X-User-Email") String sellerEmail,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(value = "jwt-access", required = false) String cookieToken,
            @PathVariable java.util.UUID orderId) {
        
        String token = authHeader;
        if (token == null && cookieToken != null) {
            token = "Bearer " + cookieToken;
        }
        
        return ResponseEntity.ok(orderService.approveOrderRefund(orderId, sellerEmail, token));
    }
}
