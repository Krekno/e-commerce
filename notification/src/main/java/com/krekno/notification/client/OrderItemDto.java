package com.krekno.notification.client;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemDto {
    private UUID id;
    private UUID productId;
    private int quantity;
    private BigDecimal price;
    private String sellerEmail;
}
