package com.krekno.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;

@Data
public class OrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Shipping address is required")
    private UUID shippingAddressId;

    @NotNull(message = "Billing address is required")
    private UUID billingAddressId;
}
