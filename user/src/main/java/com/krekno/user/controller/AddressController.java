package com.krekno.user.controller;

import com.krekno.user.dto.AddressDto;
import com.krekno.user.dto.AddressRequestDto;
import com.krekno.user.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER')")
    public ResponseEntity<List<AddressDto>> getAddresses(@RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(addressService.getUserAddresses(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AddressDto> getAddressById(@PathVariable UUID id) {
        // Internal/public access for payment service or user. In a real app, restrict this.
        return ResponseEntity.ok(addressService.getAddressById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('SELLER')")
    public ResponseEntity<AddressDto> addAddress(
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody AddressRequestDto request) {
        return ResponseEntity.ok(addressService.addAddress(email, request));
    }
}
