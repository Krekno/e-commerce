package com.krekno.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import com.krekno.notification.client.OrderClient;
import com.krekno.notification.client.OrderDto;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final org.springframework.mail.javamail.JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final OrderClient orderClient;

    @KafkaListener(topics = "order-events", groupId = "notification-group")
    public void processOrderEvent(String message) {
        log.info("Received order event: {}", message);
        if (message.startsWith("ORDER_PLACED:")) {
            try {
                String[] parts = message.split(":");
                String orderId = parts[1];
                String email = parts.length > 3 ? parts[3] : "unknown@example.com";
                
                OrderDto order = orderClient.getOrderById(java.util.UUID.fromString(orderId));
                
                Context context = new Context();
                context.setVariable("email", email);
                context.setVariable("orderId", orderId);
                context.setVariable("items", order.getItems());
                context.setVariable("total", order.getTotalAmount());
                
                String htmlBody = templateEngine.process("order-placed", context);
                sendHtmlEmail(email, "Order Placed Successfully", htmlBody);
            } catch (Exception e) {
                log.error("Error processing order event: ", e);
            }
        }
    }

    @KafkaListener(topics = "payment-events", groupId = "notification-group")
    public void processPaymentEvent(String message) {
        log.info("Received payment event: {}", message);
        if (message.startsWith("PAYMENT_SUCCEEDED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 2 ? parts[2] : "unknown@example.com";
            
            Context context = new Context();
            context.setVariable("email", email);
            context.setVariable("orderId", orderId);
            String htmlBody = templateEngine.process("payment-success", context);
            sendHtmlEmail(email, "Payment Succeeded", htmlBody);
            
        } else if (message.startsWith("PAYMENT_FAILED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 2 ? parts[2] : "unknown@example.com";
            
            Context context = new Context();
            context.setVariable("email", email);
            context.setVariable("orderId", orderId);
            String htmlBody = templateEngine.process("payment-failed", context);
            sendHtmlEmail(email, "Payment Failed", htmlBody);
        } else if (message.startsWith("REFUND_SUCCEEDED:")) {
            String[] parts = message.split(":");
            String orderId = parts[1];
            String email = parts.length > 2 ? parts[2] : "unknown@example.com";
            
            Context context = new Context();
            context.setVariable("email", email);
            context.setVariable("orderId", orderId);
            // Reusing a template or creating a generic one. Assuming order-placed or a simple string for now.
            // But wait, there might not be a refund template. Let's just send a simple HTML string if no template exists.
            String htmlBody = "<h2>Refund Processed</h2><p>Your refund for order " + orderId + " has been successfully processed.</p>";
            sendHtmlEmail(email, "Refund Processed Successfully", htmlBody);
        }
    }
    
    @KafkaListener(topics = "product-events", groupId = "notification-group")
    public void processProductEvent(String message) {
        log.info("Received product event: {}", message);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true indicates HTML
            helper.setFrom("pazaruygulamasi@gmail.com", "Pazar E-Commerce");
            
            mailSender.send(message);
            log.info("Successfully dispatched HTML email to {}", to);
        } catch (Exception e) {
            log.error("Failed to send HTML email to {}. Error: {}", to, e.getMessage());
        }
    }
}
