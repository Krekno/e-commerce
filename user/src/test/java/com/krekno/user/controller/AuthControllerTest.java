package com.krekno.user.controller;

import com.krekno.user.dto.LoginRequest;
import com.krekno.user.dto.SignupRequest;
import com.krekno.user.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthControllerTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @Test
    void register_ReturnsOk() {
        SignupRequest request = new SignupRequest("John", "Doe", "j@test.com", "pwd", "img");
        
        doNothing().when(authService).registerUser(any(SignupRequest.class));

        ResponseEntity<Void> response = authController.register(request);

        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    void login_ReturnsHeaders() {
        LoginRequest request = new LoginRequest("j@test.com", "pwd");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Set-Cookie", "token123");

        when(authService.authenticateUser(any(LoginRequest.class))).thenReturn(headers);

        ResponseEntity<Void> response = authController.login(request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("token123", response.getHeaders().getFirst("Set-Cookie"));
    }
}
