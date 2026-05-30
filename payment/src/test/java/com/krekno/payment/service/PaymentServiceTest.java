package com.krekno.payment.service;

import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void processOrderEvent_CreatesPendingTransaction() {
        UUID orderId = UUID.randomUUID();
        String email = "test@example.com";
        String message = String.format("ORDER_PLACED:%s:150.0:%s", orderId, email);

        paymentService.processOrderEvent(message);

        ArgumentCaptor<PaymentTransaction> captor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentRepository, times(1)).save(captor.capture());

        PaymentTransaction savedTx = captor.getValue();
        assertEquals(orderId, savedTx.getOrderId());
        assertEquals(new BigDecimal("150.0"), savedTx.getAmount());
        assertEquals(email, savedTx.getUserEmail());
        assertEquals("PENDING", savedTx.getStatus());
    }
}
