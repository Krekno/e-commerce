package com.krekno.user.dto;

import jakarta.validation.constraints.NotBlank;

public record SellerSignupRequest(
        @NotBlank(message = "First name is required")
        String firstName,
        
        @NotBlank(message = "Last name is required")
        String lastName,
        
        @NotBlank(message = "Email is required")
        String email,
        
        @NotBlank(message = "Password is required")
        String password,
        
        @NotBlank(message = "Store name is required")
        String storeName,
        
        String storeDescription
) { }
