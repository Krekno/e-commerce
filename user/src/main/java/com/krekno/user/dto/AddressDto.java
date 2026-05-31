package com.krekno.user.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AddressDto {
    private UUID id;
    private String addressType;
    private String street;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private String phone;
    private boolean isDefault;
}
