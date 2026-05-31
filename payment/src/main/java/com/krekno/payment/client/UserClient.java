package com.krekno.payment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "users", path = "/api/users/addresses")
public interface UserClient {

    @GetMapping("/{id}")
    AddressDto getAddressById(@PathVariable UUID id);
}
