package com.krekno.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final JavaMailSender mailSender;

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void processOrderEvent(String message) {
        log.info("Received order event: {}", message);
        if (message.startsWith("ORDER_PLACED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 3 ? parts[3] : "unknown@example.com";
            sendEmail(email, "Order Placed Successfully", "Your order " + orderId + " has been placed.");
        }
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-group")
    public void processPaymentEvent(String message) {
        log.info("Received payment event: {}", message);
        if (message.startsWith("PAYMENT_SUCCEEDED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 2 ? parts[2] : "unknown@example.com";
            sendEmail(email, "Payment Succeeded", "Payment for order " + orderId + " was successful.");
        } else if (message.startsWith("PAYMENT_FAILED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 2 ? parts[2] : "unknown@example.com";
            sendEmail(email, "Payment Failed", "Payment for order " + orderId + " failed. Please try again.");
        }
    }
    
    @KafkaListener(topics = "product-events", groupId = "notification-group")
    public void processProductEvent(String message) {
        log.info("Received product event: {}", message);
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(to);
            mailMessage.setSubject(subject);
            mailMessage.setText(body);
            mailMessage.setFrom("noreply@pazar.com");
            
            mailSender.send(mailMessage);
            log.info("Successfully dispatched email to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Error: {}", to, e.getMessage());
        }
    }
}
