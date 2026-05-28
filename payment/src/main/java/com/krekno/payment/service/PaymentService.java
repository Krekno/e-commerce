package com.krekno.payment.service;

import com.iyzipay.Options;
import com.iyzipay.model.Payment;
import com.iyzipay.request.CreatePaymentRequest;
import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public Options getOptions() {
        Options options = new Options();
        options.setApiKey("mock-api-key");
        options.setSecretKey("mock-secret-key");
        options.setBaseUrl("https://sandbox-api.iyzipay.com");
        return options;
    }

    @KafkaListener(topics = "order-events", groupId = "payment-group")
    public void processOrderEvent(String message) {
        log.info("Received order event: {}", message);
        // Simplification: Expecting orderId and amount delimited by comma
        // e.g. "ORDER_PLACED:uuid:150.00"
        if (message.startsWith("ORDER_PLACED:")) {
            String[] parts = message.split(":");
            UUID orderId = UUID.fromString(parts[1]);
            BigDecimal amount = new BigDecimal(parts[2]);

            boolean success = processMockPayment(orderId, amount);

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .status(success ? "SUCCESS" : "FAILED")
                    .iyzicoPaymentId(success ? UUID.randomUUID().toString() : null)
                    .build();

            paymentRepository.save(transaction);

            if (success) {
                kafkaTemplate.send("payment-events", "PAYMENT_SUCCEEDED:" + orderId);
            } else {
                kafkaTemplate.send("payment-events", "PAYMENT_FAILED:" + orderId);
            }
        }
    }

    private boolean processMockPayment(UUID orderId, BigDecimal amount) {
        // In a real scenario we would build CreatePaymentRequest and call Iyzico
        // Payment payment = Payment.create(request, getOptions());
        // return "success".equalsIgnoreCase(payment.getStatus());
        
        log.info("Processing mock payment via Iyzico for Order: {}, Amount: {}", orderId, amount);
        // Mock successful payment
        return true;
    }
}
