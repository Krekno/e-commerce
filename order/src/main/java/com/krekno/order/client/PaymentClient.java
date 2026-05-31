package com.krekno.order.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "payment")
public interface PaymentClient {

    @PostMapping("/api/payments/{orderId}/refund")
    Object refundPayment(
            @PathVariable("orderId") UUID orderId,
            @RequestHeader("Authorization") String token);
}
