package com.krekno.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void processOrderEvent(String message) {
        log.info("Received order event: {}", message);
        if (message.startsWith("ORDER_PLACED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts[3];
            sendEmail(email, "Order Placed Successfully", "Your order " + orderId + " has been placed.");
        }
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-group")
    public void processPaymentEvent(String message) {
        log.info("Received payment event: {}", message);
        if (message.startsWith("PAYMENT_SUCCEEDED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            sendEmail("user@example.com", "Payment Succeeded", "Payment for order " + orderId + " was successful.");
        } else if (message.startsWith("PAYMENT_FAILED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            sendEmail("user@example.com", "Payment Failed", "Payment for order " + orderId + " failed. Please try again.");
        }
    }
    
    @KafkaListener(topics = "product-events", groupId = "notification-group")
    public void processProductEvent(String message) {
        log.info("Received product event: {}", message);
    }

    private void sendEmail(String to, String subject, String body) {
        // Mock email sending
        log.info("------------------------------------------------");
        log.info("Sending Email to: {}", to);
        log.info("Subject: {}", subject);
        log.info("Body: {}", body);
        log.info("------------------------------------------------");
    }
}
