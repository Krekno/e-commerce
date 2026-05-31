package com.krekno.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequestDto {
    @NotBlank(message = "Address type is required")
    private String addressType; // e.g. Home, Work

    @NotBlank(message = "Street is required")
    private String street;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Province/State is required")
    private String province;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    @NotBlank(message = "Country is required")
    private String country;

    @NotBlank(message = "Phone number is required")
    private String phone;
}
