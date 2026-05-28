package com.krekno.user.dto;

public record LoginRequest(
        String email,
        String password
) {
}
