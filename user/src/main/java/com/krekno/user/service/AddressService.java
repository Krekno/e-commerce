package com.krekno.user.service;

import com.krekno.user.dto.AddressDto;
import com.krekno.user.dto.AddressRequestDto;
import com.krekno.user.entity.Address;
import com.krekno.user.entity.User;
import com.krekno.user.repository.AddressRepository;
import com.krekno.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public List<AddressDto> getUserAddresses(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getAddresses().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public AddressDto getAddressById(UUID id) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));
        return mapToDto(address);
    }

    @Transactional
    public AddressDto addAddress(String email, AddressRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = Address.builder()
                .addressType(request.getAddressType())
                .street(request.getStreet())
                .city(request.getCity())
                .province(request.getProvince())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .phone(request.getPhone())
                .isDefault(user.getAddresses().isEmpty()) // First address is default
                .build();

        user.addAddress(address);
        userRepository.save(user); // Cascade saves the address

        // Fetch the saved address to return it (with ID)
        Address savedAddress = user.getAddresses().get(user.getAddresses().size() - 1);
        return mapToDto(savedAddress);
    }

    private AddressDto mapToDto(Address address) {
        return AddressDto.builder()
                .id(address.getId())
                .addressType(address.getAddressType())
                .street(address.getStreet())
                .city(address.getCity())
                .province(address.getProvince())
                .postalCode(address.getPostalCode())
                .country(address.getCountry())
                .phone(address.getPhone())
                .isDefault(address.isDefault())
                .build();
    }
}
