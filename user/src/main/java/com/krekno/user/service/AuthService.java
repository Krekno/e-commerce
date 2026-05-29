package com.krekno.user.service;

import com.iyzipay.Options;
import com.iyzipay.model.Currency;
import com.iyzipay.model.Locale;
import com.iyzipay.model.SubMerchant;
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
import org.apache.kafka.common.errors.ResourceNotFoundException;
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

import java.util.HashMap;
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

    public void registerSeller(SellerSignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.email())) {
            throw new IllegalArgumentException("Email is already in use!");
        }

        User user = User.builder()
                .firstName(signupRequest.firstName())
                .lastName(signupRequest.lastName())
                .email(signupRequest.email())
                .password(passwordEncoder.encode(signupRequest.password()))
                .profilePicture(signupRequest.profilePicture())
                .role(UserRole.SELLER)
                .build();
                
        CreateSubMerchantRequest request = new CreateSubMerchantRequest();
        request.setLocale(Locale.TR.getValue());
        request.setConversationId(UUID.randomUUID().toString());
        request.setSubMerchantExternalId(UUID.randomUUID().toString());
        request.setSubMerchantType(signupRequest.companyType());
        request.setAddress(signupRequest.address());
        request.setContactName(signupRequest.firstName());
        request.setContactSurname(signupRequest.lastName());
        request.setEmail(signupRequest.email());
        request.setGsmNumber(signupRequest.gsmNumber());
        request.setIdentityNumber(signupRequest.identityNumber());
        request.setIban(signupRequest.iban());
        request.setCurrency(Currency.TRY.name());

        SubMerchant subMerchant = SubMerchant.create(request, getOptions());

        if (!"success".equalsIgnoreCase(subMerchant.getStatus())) {
            throw new RuntimeException("Failed to register seller with Iyzico: " + subMerchant.getErrorMessage());
        }
                
        Seller seller = Seller.builder()
                .storeName(signupRequest.storeName())
                .storeDescription(signupRequest.storeDescription())
                .subMerchantKey(subMerchant.getSubMerchantKey())
                .user(user)
                .build();
                
        user.setSellerProfile(seller);

        userRepository.save(user);
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

        return getHttpHeaders(userDetails, user.getEmail());
    }

    public HttpHeaders authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        assert userDetails != null;
        return getHttpHeaders(userDetails, userDetails.getEmail());
    }

    @NotNull
    private HttpHeaders getHttpHeaders(UserDetailsImpl userDetails, String email) {
        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(email);

        refreshTokenService.deleteByUserId(userDetails.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());
        ResponseCookie jwtRefreshCookie = jwtUtils.generateRefreshJwtCookie(refreshToken.getToken());

        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE, jwtCookie.toString());
        headers.add(HttpHeaders.SET_COOKIE, jwtRefreshCookie.toString());

        return headers;
    }

    public HttpHeaders refreshToken(HttpServletRequest request) {
        String refreshToken = jwtUtils.getJwtRefreshFromCookies(request);

        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new IllegalArgumentException("Refresh Token is empty!");
        }

        RefreshToken token = refreshTokenService.findByToken(refreshToken)
                .orElseThrow(() -> new ResourceNotFoundException("Refresh token is not in database!"));

        refreshTokenService.verifyExpiration(token);
        User user = token.getUser();

        ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(user.getEmail());

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
