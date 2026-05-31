package com.krekno.notification.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "order", path = "/api/orders")
public interface OrderClient {
    @GetMapping("/{id}")
    OrderDto getOrderById(@PathVariable UUID id);
}
