package com.krekno.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    @NotNull(message = "Price is required")
    private BigDecimal price; // Passed from frontend for simplicity, real app would verify it against Product Service

    @NotNull(message = "Seller email is required")
    private String sellerEmail;
}
