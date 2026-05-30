package com.krekno.payment.controller;

import com.krekno.payment.dto.PaymentRequestDto;
import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.service.PaymentService;
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
public class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    @Test
    void processPayment_ReturnsTransaction() {
        UUID orderId = UUID.randomUUID();
        PaymentRequestDto dto = new PaymentRequestDto();
        
        PaymentTransaction transaction = PaymentTransaction.builder()
                .orderId(orderId)
                .amount(BigDecimal.valueOf(100.0))
                .status("SUCCESS")
                .build();

        when(paymentService.processPayment(eq(orderId), any(PaymentRequestDto.class))).thenReturn(transaction);

        ResponseEntity<PaymentTransaction> response = paymentController.processPayment(orderId, dto);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("SUCCESS", response.getBody().getStatus());
    }
}
