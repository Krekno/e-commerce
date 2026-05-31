package com.krekno.user.config;

import com.krekno.user.entity.Address;
import com.krekno.user.entity.Seller;
import com.krekno.user.entity.User;
import com.krekno.user.enums.UserRole;
import com.krekno.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByEmail("buyer@example.com").isEmpty()) {
            
            // Create a Buyer
            User buyer = User.builder()
                    .firstName("Test")
                    .lastName("Buyer")
                    .email("buyer@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.USER)
                    .build();

            Address buyerAddress = Address.builder()
                    .addressType("HOME")
                    .city("Istanbul")
                    .country("Turkey")
                    .postalCode("34000")
                    .province("Marmara")
                    .street("Ataturk Caddesi No: 1")
                    .phone("5551234567")
                    .build();
            buyer.addAddress(buyerAddress);
            userRepository.save(buyer);

            // Create a Seller 1
            User seller1 = User.builder()
                    .firstName("Tech")
                    .lastName("Store")
                    .email("techstore@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.SELLER)
                    .build();

            Address seller1Address = Address.builder()
                    .addressType("BUSINESS")
                    .city("Ankara")
                    .country("Turkey")
                    .postalCode("06000")
                    .province("Central Anatolia")
                    .street("Kizilay Meydani No: 42")
                    .phone("5559876543")
                    .build();
            seller1.addAddress(seller1Address);

            Seller sellerProfile1 = Seller.builder()
                    .storeName("Tech Galaxy")
                    .storeDescription("The best electronics store")
                    .subMerchantKey("fake_sub_merchant_key_1")
                    .user(seller1)
                    .build();
            seller1.setSellerProfile(sellerProfile1);

            userRepository.save(seller1);

            // Create a Seller 2
            User seller2 = User.builder()
                    .firstName("Fashion")
                    .lastName("Boutique")
                    .email("fashion@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.SELLER)
                    .build();

            Address seller2Address = Address.builder()
                    .addressType("BUSINESS")
                    .city("Izmir")
                    .country("Turkey")
                    .postalCode("35000")
                    .province("Aegean")
                    .street("Alsancak Kordon No: 99")
                    .phone("5551112233")
                    .build();
            seller2.addAddress(seller2Address);

            Seller sellerProfile2 = Seller.builder()
                    .storeName("Fashion Hub")
                    .storeDescription("Trendy clothes and accessories")
                    .subMerchantKey("fake_sub_merchant_key_2")
                    .user(seller2)
                    .build();
            seller2.setSellerProfile(sellerProfile2);

            userRepository.save(seller2);

            System.out.println("Mock Users and Sellers initialized!");
        }
    }
}
