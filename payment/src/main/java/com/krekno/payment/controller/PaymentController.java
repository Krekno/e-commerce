package com.krekno.payment.controller;

import org.springframework.security.access.prepost.PreAuthorize;

import com.krekno.payment.dto.PaymentRequestDto;
import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/{orderId}/process")
    @PreAuthorize("hasRole('USER') or hasRole('SELLER') or hasRole('ADMIN')")
    public ResponseEntity<PaymentTransaction> processPayment(
            @PathVariable UUID orderId,
            @RequestBody PaymentRequestDto requestDto) {
        
        PaymentTransaction transaction = paymentService.processPayment(orderId, requestDto);
        return ResponseEntity.ok(transaction);
    }
}
