package com.krekno.payment.dto;

import lombok.Data;

@Data
public class PaymentRequestDto {
    private String firstName;
    private String lastName;
    private String cardNumber;
    private String expireMonth;
    private String expireYear;
    private String cvc;
}
