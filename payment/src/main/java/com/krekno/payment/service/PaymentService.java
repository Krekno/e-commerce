package com.krekno.payment.service;

import com.iyzipay.Options;
import com.iyzipay.model.Address;
import com.iyzipay.model.BasketItem;
import com.iyzipay.model.BasketItemType;
import com.iyzipay.model.Buyer;
import com.iyzipay.model.Currency;
import com.iyzipay.model.Locale;
import com.iyzipay.model.PaymentCard;
import com.iyzipay.model.PaymentChannel;
import com.iyzipay.model.PaymentGroup;
import com.iyzipay.model.Payment;
import com.iyzipay.request.CreatePaymentRequest;
import com.iyzipay.request.CreateThreedsPaymentRequest;
import com.krekno.payment.dto.PaymentRequestDto;
import com.krekno.payment.dto.PaymentResponseDto;
import com.krekno.payment.entity.PaymentTransaction;
import com.krekno.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.krekno.payment.client.UserClient;
import com.krekno.payment.client.AddressDto;

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
    private final UserClient userClient;

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
            UUID shippingAddressId = parts.length > 4 ? UUID.fromString(parts[4]) : null;
            UUID billingAddressId = parts.length > 5 ? UUID.fromString(parts[5]) : null;

            PaymentTransaction transaction = PaymentTransaction.builder()
                    .orderId(orderId)
                    .amount(amount)
                    .userEmail(userEmail)
                    .status("PENDING")
                    .shippingAddressId(shippingAddressId)
                    .billingAddressId(billingAddressId)
                    .build();

            paymentRepository.save(transaction);
            log.info("Saved PENDING transaction for order: {}", orderId);
        }
    }

    public PaymentResponseDto processPayment(UUID orderId, PaymentRequestDto dto) {
        PaymentTransaction transaction = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + orderId));

        if (!"PENDING".equals(transaction.getStatus())) {
            throw new RuntimeException("Transaction is not PENDING. Current status: " + transaction.getStatus());
        }

        com.iyzipay.model.Payment payment = executeIyzicoPayment(transaction, dto);

        if ("success".equalsIgnoreCase(payment.getStatus())) {
            transaction.setStatus("SUCCESS");
            transaction.setIyzicoPaymentId(payment.getPaymentId());
            if (payment.getPaymentItems() != null && !payment.getPaymentItems().isEmpty()) {
                transaction.setPaymentTransactionId(payment.getPaymentItems().get(0).getPaymentTransactionId());
            }
            paymentRepository.save(transaction);
            
            kafkaTemplate.send("payment-events", "PAYMENT_SUCCEEDED:" + orderId + ":" + transaction.getUserEmail());
            
            return PaymentResponseDto.builder()
                    .status("success")
                    .build();
        } else {
            transaction.setStatus("FAILED");
            paymentRepository.save(transaction);
            
            log.error("Payment failed. Error Code: {}, Error Message: {}", 
                payment.getErrorCode(), payment.getErrorMessage());
            kafkaTemplate.send("payment-events", "PAYMENT_FAILED:" + orderId + ":" + transaction.getUserEmail());
            
            return PaymentResponseDto.builder()
                    .status("failure")
                    .errorMessage(payment.getErrorMessage())
                    .build();
        }
    }


    public PaymentResponseDto refundPayment(UUID orderId) {
        PaymentTransaction transaction = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Transaction not found for order: " + orderId));

        if (!"SUCCESS".equals(transaction.getStatus())) {
            throw new RuntimeException("Transaction is not SUCCESS. Current status: " + transaction.getStatus());
        }

        if (transaction.getPaymentTransactionId() == null) {
            throw new RuntimeException("No Iyzico payment transaction ID found for this order");
        }

        log.info("Processing refund via Iyzico for Order: {}, TxId: {}", transaction.getOrderId(), transaction.getPaymentTransactionId());

        com.iyzipay.request.CreateRefundRequest request = new com.iyzipay.request.CreateRefundRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(transaction.getOrderId().toString() + "_REFUND");
        request.setPaymentTransactionId(transaction.getPaymentTransactionId());
        request.setPrice(transaction.getAmount());
        request.setCurrency(Currency.TRY.name());
        request.setIp("85.34.78.112"); // Hardcoded IP for sandbox

        com.iyzipay.model.Refund refund = com.iyzipay.model.Refund.create(request, getOptions());

        if ("success".equalsIgnoreCase(refund.getStatus())) {
            transaction.setStatus("REFUNDED");
            paymentRepository.save(transaction);
            
            kafkaTemplate.send("payment-events", "REFUND_SUCCEEDED:" + orderId + ":" + transaction.getUserEmail());
            
            return PaymentResponseDto.builder()
                    .status("success")
                    .build();
        } else {
            log.error("Refund failed. Error Code: {}, Error Message: {}", 
                refund.getErrorCode(), refund.getErrorMessage());
            
            return PaymentResponseDto.builder()
                    .status("failure")
                    .errorMessage(refund.getErrorMessage())
                    .build();
        }
    }

    private com.iyzipay.model.Payment executeIyzicoPayment(PaymentTransaction transaction, PaymentRequestDto dto) {
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
        paymentCard.setCardHolderName(dto.getFirstName() + " " + dto.getLastName());
        paymentCard.setCardNumber(dto.getCardNumber());
        paymentCard.setExpireMonth(dto.getExpireMonth());
        paymentCard.setExpireYear(dto.getExpireYear());
        paymentCard.setCvc(dto.getCvc());
        paymentCard.setRegisterCard(0);
        request.setPaymentCard(paymentCard);

        AddressDto shipAddrDto = userClient.getAddressById(transaction.getShippingAddressId());
        AddressDto billAddrDto = userClient.getAddressById(transaction.getBillingAddressId());

        Buyer buyer = new Buyer();
        buyer.setId("BY789");
        buyer.setName(dto.getFirstName());
        buyer.setSurname(dto.getLastName());
        buyer.setGsmNumber(billAddrDto.getPhone());
        buyer.setEmail(transaction.getUserEmail());
        buyer.setIdentityNumber("74300864791"); // Still hardcoded, need real TCKN
        buyer.setRegistrationAddress(billAddrDto.getStreet());
        buyer.setIp("85.34.78.112"); // Hardcoded IP
        buyer.setCity(billAddrDto.getCity());
        buyer.setCountry(billAddrDto.getCountry());
        buyer.setZipCode(billAddrDto.getPostalCode());
        request.setBuyer(buyer);

        Address shippingAddress = new Address();
        shippingAddress.setContactName(dto.getFirstName() + " " + dto.getLastName());
        shippingAddress.setCity(shipAddrDto.getCity());
        shippingAddress.setCountry(shipAddrDto.getCountry());
        shippingAddress.setAddress(shipAddrDto.getStreet());
        shippingAddress.setZipCode(shipAddrDto.getPostalCode());
        request.setShippingAddress(shippingAddress);

        Address billingAddress = new Address();
        billingAddress.setContactName(dto.getFirstName() + " " + dto.getLastName());
        billingAddress.setCity(billAddrDto.getCity());
        billingAddress.setCountry(billAddrDto.getCountry());
        billingAddress.setAddress(billAddrDto.getStreet());
        billingAddress.setZipCode(billAddrDto.getPostalCode());
        request.setBillingAddress(billingAddress);

        List<BasketItem> basketItems = new ArrayList<>();
        BasketItem firstBasketItem = new BasketItem();
        firstBasketItem.setId("BI101");
        firstBasketItem.setName("Order Items");
        firstBasketItem.setCategory1("Collectibles");
        firstBasketItem.setItemType(BasketItemType.PHYSICAL.name());
        firstBasketItem.setPrice(transaction.getAmount());
        
        basketItems.add(firstBasketItem);
        request.setBasketItems(basketItems);

        return com.iyzipay.model.Payment.create(request, getOptions());
    }
}
