package com.krekno.user.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "addresses")
public class Address {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @NotBlank(message = "address type cannot be empty")
    @Column(nullable = false, name = "address_type")
    private String addressType;

    @NotBlank(message = "Street address is required")
    @Column(nullable = false, name = "street")
    private String street;

    @NotBlank(message = "City is required")
    @Column(nullable = false)
    private String city;

    @NotBlank(message = "Province/State is required")
    @Column(nullable = false)
    private String province;

    @NotBlank(message = "Postal code is required")
    @Column(name = "postal_code", nullable = false)
    private String postalCode;

    @NotBlank(message = "Country is required")
    @Column(nullable = false)
    private String country;

    @Column(name = "is_default")
    private boolean isDefault;

    @NotBlank(message = "phone number cannot be empty")
    @Column(nullable = false, name = "phone_number")
    private String phone;
}
