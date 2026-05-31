package com.krekno.notification.client;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class OrderDto {
    private UUID id;
    private String userEmail;
    private BigDecimal totalAmount;
    private String status;
    private List<OrderItemDto> items;
}
