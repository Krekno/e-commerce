package com.krekno.payment.service;

import com.iyzipay.Options;
import com.iyzipay.model.Address;
import com.iyzipay.model.BasketItem;
import com.iyzipay.model.BasketItemType;
import com.iyzipay.model.Buyer;
import com.iyzipay.model.Currency;
import com.iyzipay.model.Locale;
import com.iyzipay.model.Payment;
import com.iyzipay.model.PaymentCard;
import com.iyzipay.model.PaymentChannel;
import com.iyzipay.model.PaymentGroup;
import com.iyzipay.request.CreatePaymentRequest;
import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${iyzico.api-key}")
    private String apiKey;

    @Value("${iyzico.secret-key}")
    private String secretKey;

    @Value("${iyzico.base-url}")
    private String baseUrl;

    public Options getOptions() {
        Options options = new Options();
        options.setApiKey(apiKey);
        options.setSecretKey(secretKey);
        options.setBaseUrl(baseUrl);
        return options;
    }

    @KafkaListener(topics = "order-events", groupId = "payment-group")
    public void processOrderEvent(String message) {
        log.info("Received order event: {}", message);
        // Simplification: Expecting orderId and amount delimited by comma
        // e.g. "ORDER_PLACED:uuid:150.00"
        if (message.startsWith("ORDER_PLACED:")) {
            String[] parts = message.split(":");
            UUID orderId = UUID.fromString(parts[1]);
            BigDecimal amount = new BigDecimal(parts[2]);

            Payment payment = processIyzicoPayment(orderId, amount);
            boolean success = "success".equalsIgnoreCase(payment.getStatus());

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .status(success ? "SUCCESS" : "FAILED")
                    .iyzicoPaymentId(payment.getPaymentId())
                    .build();

            paymentRepository.save(transaction);

            if (success) {
                kafkaTemplate.send("payment-events", "PAYMENT_SUCCEEDED:" + orderId);
            } else {
                log.error("Payment failed. Error Code: {}, Error Message: {}", payment.getErrorCode(), payment.getErrorMessage());
                kafkaTemplate.send("payment-events", "PAYMENT_FAILED:" + orderId);
            }
        }
    }

    private Payment processIyzicoPayment(UUID orderId, BigDecimal amount) {
        log.info("Processing actual payment via Iyzico for Order: {}, Amount: {}", orderId, amount);

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(orderId.toString());
        request.setPrice(amount);
        request.setPaidPrice(amount);
        request.setCurrency(Currency.TRY.name());
        request.setInstallment(1);
        request.setBasketId("B67832");
        request.setPaymentChannel(PaymentChannel.WEB.name());
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());

        PaymentCard paymentCard = new PaymentCard();
        paymentCard.setCardHolderName("John Doe");
        paymentCard.setCardNumber("5528790000000008"); // standard mock test card
        paymentCard.setExpireMonth("12");
        paymentCard.setExpireYear("2026");
        paymentCard.setCvc("123");
        paymentCard.setRegisterCard(0);
        request.setPaymentCard(paymentCard);

        Buyer buyer = new Buyer();
        buyer.setId("BY789");
        buyer.setName("John");
        buyer.setSurname("Doe");
        buyer.setGsmNumber("+905324000000");
        buyer.setEmail("email@email.com");
        buyer.setIdentityNumber("74300864791");
        buyer.setLastLoginDate("2024-01-01 12:43:35");
        buyer.setRegistrationDate("2024-01-01 12:43:35");
        buyer.setRegistrationAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
        buyer.setIp("85.34.78.112");
        buyer.setCity("Istanbul");
        buyer.setCountry("Turkey");
        buyer.setZipCode("34732");
        request.setBuyer(buyer);

        Address shippingAddress = new Address();
        shippingAddress.setContactName("Jane Doe");
        shippingAddress.setCity("Istanbul");
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
        shippingAddress.setZipCode("34732");
        request.setShippingAddress(shippingAddress);

        Address billingAddress = new Address();
        billingAddress.setContactName("Jane Doe");
        billingAddress.setCity("Istanbul");
        billingAddress.setCountry("Turkey");
        billingAddress.setAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
        billingAddress.setZipCode("34732");
        request.setBillingAddress(billingAddress);

        List<BasketItem> basketItems = new ArrayList<>();
        BasketItem firstBasketItem = new BasketItem();
        firstBasketItem.setId("BI101");
        firstBasketItem.setName("Order Items");
        firstBasketItem.setCategory1("Collectibles");
        firstBasketItem.setItemType(BasketItemType.PHYSICAL.name());
        firstBasketItem.setPrice(amount);
        
        // Split revenue: 90% to seller, 10% stays with company
        BigDecimal sellerRevenue = amount.multiply(new BigDecimal("0.90")).setScale(2, java.math.RoundingMode.HALF_UP);
        firstBasketItem.setSubMerchantKey("dummy-sub-merchant-key");
        firstBasketItem.setSubMerchantPrice(sellerRevenue);
        
        basketItems.add(firstBasketItem);
        request.setBasketItems(basketItems);

        return Payment.create(request, getOptions());
    }
}
