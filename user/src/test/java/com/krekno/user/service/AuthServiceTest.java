package com.krekno.user.service;

import com.krekno.user.dto.LoginRequest;
import com.krekno.user.dto.SignupRequest;
import com.krekno.user.entity.RefreshToken;
import com.krekno.user.entity.User;
import com.krekno.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    @Test
    void registerUser_Success() {
        SignupRequest request = new SignupRequest("John", "Doe", "john@test.com", "password", "img");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encoded_pwd");

        authService.registerUser(request);

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_EmailExists_ThrowsException() {
        SignupRequest request = new SignupRequest("John", "Doe", "john@test.com", "password", "img");

        when(userRepository.existsByEmail("john@test.com")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.registerUser(request));
        assertTrue(ex.getMessage().contains("Email is already in use!"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticateUser_Success() {
        LoginRequest loginRequest = new LoginRequest("john@test.com", "password");
        Authentication authentication = mock(Authentication.class);
        UserDetailsImpl userDetails = new UserDetailsImpl(
            UUID.randomUUID(), 
            "john@test.com", 
            "encoded_pwd", 
            "John", 
            "Doe", 
            java.util.Collections.emptyList()
        );

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);

        ResponseCookie jwtCookie = ResponseCookie.from("krekno", "token123").build();
        when(jwtUtils.generateJwtCookie(anyString())).thenReturn(jwtCookie);

        RefreshToken rToken = new RefreshToken();
        rToken.setToken("refresh123");
        when(refreshTokenService.createRefreshToken(userDetails.getId())).thenReturn(rToken);

        ResponseCookie refreshCookie = ResponseCookie.from("kreknoRefresh", "refresh123").build();
        when(jwtUtils.generateRefreshJwtCookie(anyString())).thenReturn(refreshCookie);

        HttpHeaders headers = authService.authenticateUser(loginRequest);

        assertNotNull(headers);
        assertTrue(headers.get(HttpHeaders.SET_COOKIE) != null);
        assertEquals(2, headers.get(HttpHeaders.SET_COOKIE).size());
    }
}
