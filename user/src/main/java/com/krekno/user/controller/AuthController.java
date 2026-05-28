package com.krekno.user.controller;

import com.krekno.user.dto.LoginRequest;
import com.krekno.user.dto.SellerSignupRequest;
import com.krekno.user.dto.SignupRequest;
import com.krekno.user.service.AuthService;
import com.krekno.user.service.UserDetailsImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody SignupRequest request) {
        authService.registerUser(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register-seller")
    public ResponseEntity<Void> registerSeller(@Valid @RequestBody SellerSignupRequest request) {
        authService.registerSeller(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginRequest request) {
        HttpHeaders headers = authService.authenticateUser(request);
        return ResponseEntity.ok().headers(headers).build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request) {
        HttpHeaders headers = authService.refreshToken(request);
        return ResponseEntity.ok().headers(headers).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        HttpHeaders headers = authService.logoutUser();
        return ResponseEntity.ok().headers(headers).build();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails));
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateUser(@Valid @RequestBody SignupRequest request, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        HttpHeaders headers = authService.updateUser(request, userDetails);
        return ResponseEntity.ok().headers(headers).build();
    }
}
