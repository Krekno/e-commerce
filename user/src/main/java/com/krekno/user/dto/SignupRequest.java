package com.krekno.user.dto;

public record SignupRequest(
        String firstName,
        String lastName,
        String email,
        String password
) { }
