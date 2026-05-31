package com.krekno.user.dto;

import jakarta.validation.constraints.NotBlank;

public record SellerSignupRequest(
        @NotBlank(message = "Store name is required")
        String storeName,
        
        String storeDescription,
        
        @NotBlank(message = "Company type is required")
        String companyType,
        
        @NotBlank(message = "Address is required")
        String address,
        
        @NotBlank(message = "GSM number is required")
        String gsmNumber,
        
        @NotBlank(message = "Identity number is required")
        String identityNumber,
        
        @NotBlank(message = "IBAN is required")
        String iban,

        @NotBlank(message = "Card holder name is required")
        String cardHolderName,

        @NotBlank(message = "Card number is required")
        String cardNumber,

        @NotBlank(message = "Expire month is required")
        String expireMonth,

        @NotBlank(message = "Expire year is required")
        String expireYear,

        @NotBlank(message = "CVC is required")
        String cvc
) { }
