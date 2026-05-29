package com.krekno.order.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class ProductClientFallback implements ProductClient {

    @Override
    public boolean reduceStock(UUID id, int quantity) {
        log.error("Circuit Breaker activated: Product service is down or failing. Cannot reduce stock for product {}.", id);
        // Fallback gracefully returns false, which will naturally fail the order
        // and allow the OrderService to throw an exception without crashing abruptly due to timeout
        return false;
    }
}
