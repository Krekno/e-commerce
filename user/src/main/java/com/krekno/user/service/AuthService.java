package com.krekno.user.service;

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
import com.iyzipay.model.SubMerchant;
import com.iyzipay.request.CreatePaymentRequest;
import com.iyzipay.request.CreateSubMerchantRequest;
import com.krekno.user.dto.LoginRequest;
import com.krekno.user.dto.SellerSignupRequest;
import com.krekno.user.dto.SignupRequest;
import com.krekno.user.entity.RefreshToken;
import com.krekno.user.entity.Seller;
import com.krekno.user.entity.User;
import com.krekno.user.enums.UserRole;
import com.krekno.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    @Value("${iyzico.api-key}")
    private String apiKey;

    @Value("${iyzico.secret-key}")
    private String secretKey;

    @Value("${iyzico.base-url}")
    private String baseUrl;

    private Options getOptions() {
        Options options = new Options();
        options.setApiKey(apiKey);
        options.setSecretKey(secretKey);
        options.setBaseUrl(baseUrl);
        return options;
    }

    public void registerUser(SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.email())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        User user = User.builder()
                .firstName(signupRequest.firstName())
                .lastName(signupRequest.lastName())
                .email(signupRequest.email())
                .password(passwordEncoder.encode(signupRequest.password()))
                .profilePicture(signupRequest.profilePicture())
                .role(UserRole.USER)
                .build();

        userRepository.save(user);
    }

    public HttpHeaders registerSeller(SellerSignupRequest signupRequest, UserDetailsImpl userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found!"));

        if (user.getSellerProfile() != null || user.getRole() == UserRole.SELLER) {
            throw new IllegalArgumentException("User is already a seller!");
        }

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(UUID.randomUUID().toString());
        request.setPrice(new BigDecimal("5000.0"));
        request.setPaidPrice(new BigDecimal("5000.0"));
        request.setCurrency(Currency.TRY.name());
        request.setInstallment(1);
        request.setBasketId("SELLER_SUB_" + user.getId().toString());
        request.setPaymentChannel(PaymentChannel.WEB.name());
        request.setPaymentGroup(PaymentGroup.SUBSCRIPTION.name());

        PaymentCard paymentCard = new PaymentCard();
        paymentCard.setCardHolderName(signupRequest.cardHolderName());
        paymentCard.setCardNumber(signupRequest.cardNumber());
        paymentCard.setExpireMonth(signupRequest.expireMonth());
        paymentCard.setExpireYear(signupRequest.expireYear());
        paymentCard.setCvc(signupRequest.cvc());
        paymentCard.setRegisterCard(0);
        request.setPaymentCard(paymentCard);

        Buyer buyer = new Buyer();
        buyer.setId(user.getId().toString());
        buyer.setName(user.getFirstName());
        buyer.setSurname(user.getLastName());
        buyer.setGsmNumber(signupRequest.gsmNumber());
        buyer.setEmail(user.getEmail());
        buyer.setIdentityNumber(signupRequest.identityNumber());
        buyer.setRegistrationAddress(signupRequest.address());
        buyer.setIp("85.34.78.112");
        buyer.setCity("Istanbul");
        buyer.setCountry("Turkey");
        buyer.setZipCode("34000");
        request.setBuyer(buyer);

        Address billingAddress = new Address();
        billingAddress.setContactName(user.getFirstName() + " " + user.getLastName());
        billingAddress.setCity("Istanbul");
        billingAddress.setCountry("Turkey");
        billingAddress.setAddress(signupRequest.address());
        billingAddress.setZipCode("34000");
        request.setBillingAddress(billingAddress);

        Address shippingAddress = new Address();
        shippingAddress.setContactName(user.getFirstName() + " " + user.getLastName());
        shippingAddress.setCity("Istanbul");
        shippingAddress.setCountry("Turkey");
        shippingAddress.setAddress(signupRequest.address());
        shippingAddress.setZipCode("34000");
        request.setShippingAddress(shippingAddress);

        List<BasketItem> basketItems = new ArrayList<>();
        BasketItem firstBasketItem = new BasketItem();
        firstBasketItem.setId("BI_SELLER");
        firstBasketItem.setName("Seller Registration Fee");
        firstBasketItem.setCategory1("Services");
        firstBasketItem.setItemType(BasketItemType.VIRTUAL.name());
        firstBasketItem.setPrice(new BigDecimal("5000.0"));
        basketItems.add(firstBasketItem);
        request.setBasketItems(basketItems);

        Payment payment = Payment.create(request, getOptions());
        if (!"success".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalArgumentException("Payment failed! " + payment.getErrorMessage());
        }

        String subMerchantKey = "mock_smk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                
        Seller seller = Seller.builder()
                .storeName(signupRequest.storeName())
                .storeDescription(signupRequest.storeDescription())
                .subMerchantKey(subMerchantKey)
                .user(user)
                .build();
                
        user.setSellerProfile(seller);
        user.setRole(UserRole.SELLER);

        userRepository.save(user);
        
        return getHttpHeaders(user.getId(), user.getEmail(), user.getRole().name());
    }

    public HttpHeaders updateUser(SignupRequest updateRequest, UserDetailsImpl userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found!"));

        if (updateRequest.firstName() != null && !updateRequest.firstName().isEmpty() && !updateRequest.firstName().equals(user.getFirstName())) {
            user.setFirstName(updateRequest.firstName());
        }

        if (updateRequest.lastName() != null && !updateRequest.lastName().isEmpty() && !updateRequest.lastName().equals(user.getLastName())) {
            user.setLastName(updateRequest.lastName());
        }

        if (updateRequest.email() != null && !updateRequest.email().isEmpty() && !updateRequest.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(updateRequest.email())) {
                throw new IllegalArgumentException("Email is already in use!");
            }
            user.setEmail(updateRequest.email());
        }
        if (updateRequest.profilePicture() != null && !updateRequest.profilePicture().isEmpty() && !updateRequest.profilePicture().equals(user.getProfilePicture())) {
            user.setProfilePicture(updateRequest.profilePicture());
        }
        if (updateRequest.password() != null && !updateRequest.password().isEmpty())
            user.setPassword(passwordEncoder.encode(updateRequest.password()));

        userRepository.save(user);

        return getHttpHeaders(user.getId(), user.getEmail(), user.getRole().name());
    }

    public HttpHeaders authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        assert userDetails != null;
        String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        return getHttpHeaders(userDetails.getId(), userDetails.getEmail(), role);
    }

    @NotNull
    private HttpHeaders getHttpHeaders(UUID userId, String email, String role) {
        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(email, role);

        refreshTokenService.deleteByUserId(userId);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userId);
        ResponseCookie jwtRefreshCookie = jwtUtils.generateRefreshJwtCookie(refreshToken.getToken());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        headers.add(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString());

        return headers;
    }

    public HttpHeaders refreshToken(HttpServletRequest request) {
        String refreshToken = jwtUtils.getJwtRefreshFromCookies(request);

        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh Token is empty!");
        }

        RefreshToken token = refreshTokenService.findByToken(refreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is not in database!"));

        refreshTokenService.verifyExpiration(token);
        User user = token.getUser();

        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(user.getEmail(), user.getRole().name());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        return headers;
    }

    public HttpHeaders logoutUser() {
        Object principle = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
        assert principle != null;
        if (!Objects.equals(principle.toString(), "anonymousUser")) {
            UUID userId = ((UserDetailsImpl) principle).getId();
            refreshTokenService.deleteByUserId(userId);
        }

        ResponseCookie jwtCookie = jwtUtils.getCleanJwtCookie();
        ResponseCookie jwtRefreshCookie = jwtUtils.getCleanJwtRefreshCookie();

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        headers.add(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString());

        return headers;
    }

    public Map<String, Object> getCurrentUser(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found!"));

        Map<String, Object> res = new HashMap<>();
        res.put("id", user.getId());
        res.put("firstName", user.getFirstName());
        res.put("lastName", user.getLastName());
        res.put("email", user.getEmail());
        res.put("profilePicture", user.getProfilePicture());
        res.put("createdAt", user.getCreatedAt());
        res.put("roles", userDetails.getAuthorities()
                .stream().map(GrantedAuthority::getAuthority).toList());
                
        if (user.getSellerProfile() != null) {
            res.put("storeName", user.getSellerProfile().getStoreName());
            res.put("storeDescription", user.getSellerProfile().getStoreDescription());
        }
        
        return res;
    }
}
