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
import com.krekno.payment.dto.PaymentRequestDto;
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
        // Expecting "ORDER_PLACED:uuid:amount:email"
        if (message.startsWith("ORDER_PLACED:")) {
            String[] parts = message.split(":");
            UUID orderId = UUID.fromString(parts[1]);
            BigDecimal amount = new BigDecimal(parts[2]);
            String userEmail = parts.length > 3 ? parts[3] : "unknown@example.com";

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .userEmail(userEmail)
                    .status("PENDING")
                    .build();

            paymentRepository.save(transaction);
            log.info("Saved PENDING transaction for order: {}", orderId);
        }
    }

    public PaymentTransaction processPayment(UUID orderId, PaymentRequestDto dto) {
        PaymentTransaction transaction = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + orderId));

        if (!"PENDING".equals(transaction.getStatus())) {
            throw new RuntimeException("Transaction is not PENDING. Current status: " + transaction.getStatus());
        }

        Payment payment = executeIyzicoPayment(transaction, dto);
        boolean success = "success".equalsIgnoreCase(payment.getStatus());

        transaction.setStatus(success ? "SUCCESS" : "FAILED");
        transaction.setIyzicoPaymentId(payment.getPaymentId());
        paymentRepository.save(transaction);

        if (success) {
            kafkaTemplate.send("payment-events", "PAYMENT_SUCCEEDED:" + orderId + ":" + transaction.getUserEmail());
        } else {
            log.error("Payment failed. Error Code: {}, Error Message: {}", payment.getErrorCode(), payment.getErrorMessage());
            kafkaTemplate.send("payment-events", "PAYMENT_FAILED:" + orderId + ":" + transaction.getUserEmail());
        }

        return transaction;
    }

    private Payment executeIyzicoPayment(PaymentTransaction transaction, PaymentRequestDto dto) {
        log.info("Processing actual payment via Iyzico for Order: {}, Amount: {}", transaction.getOrderId(), transaction.getAmount());

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(transaction.getOrderId().toString());
        request.setPrice(transaction.getAmount());
        request.setPaidPrice(transaction.getAmount());
        request.setCurrency(Currency.TRY.name());
        request.setInstallment(1);
        request.setBasketId("B67832");
        request.setPaymentChannel(PaymentChannel.WEB.name());
        request.setPaymentGroup(PaymentGroup.PRODUCT.name());

        PaymentCard paymentCard = new PaymentCard();
        paymentCard.setCardHolderName(dto.getCardHolderName());
        paymentCard.setCardNumber(dto.getCardNumber());
        paymentCard.setExpireMonth(dto.getExpireMonth());
        paymentCard.setExpireYear(dto.getExpireYear());
        paymentCard.setCvc(dto.getCvc());
        paymentCard.setRegisterCard(0);
        request.setPaymentCard(paymentCard);

        Buyer buyer = new Buyer();
        buyer.setId("BY789");
        buyer.setName(dto.getCardHolderName());
        buyer.setSurname("User");
        buyer.setGsmNumber("+905324000000");
        buyer.setEmail(transaction.getUserEmail());
        buyer.setIdentityNumber("74300864791");
        buyer.setRegistrationAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
        buyer.setIp("85.34.78.112");
        buyer.setCity("Istanbul");
        buyer.setCountry("Turkey");
        buyer.setZipCode("34732");
        request.setBuyer(buyer);

        Address shippingAddress = new Address();
        shippingAddress.setContactName(dto.getCardHolderName());
        shippingAddress.setCity("Istanbul");
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress("Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1");
        shippingAddress.setZipCode("34732");
        request.setShippingAddress(shippingAddress);

        Address billingAddress = new Address();
        billingAddress.setContactName(dto.getCardHolderName());
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
        firstBasketItem.setPrice(transaction.getAmount());
        
        // Split revenue: 90% to seller, 10% stays with company
        BigDecimal sellerRevenue = transaction.getAmount().multiply(new BigDecimal("0.90")).setScale(2, java.math.RoundingMode.HALF_UP);
        firstBasketItem.setSubMerchantKey("dummy-sub-merchant-key");
        firstBasketItem.setSubMerchantPrice(sellerRevenue);
        
        basketItems.add(firstBasketItem);
        request.setBasketItems(basketItems);

        return Payment.create(request, getOptions());
    }
}
