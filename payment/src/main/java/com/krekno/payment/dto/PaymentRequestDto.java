package com.krekno.payment.dto;

import lombok.Data;

@Data
public class PaymentRequestDto {
    private String cardHolderName;
    private String cardNumber;
    private String expireMonth;
    private String expireYear;
    private String cvc;
}
