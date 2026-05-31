package com.krekno.product.config;

import com.krekno.product.entity.Category;
import com.krekno.product.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        if (categoryRepository.count() == 0) {
            log.info("No categories found. Initializing default categories...");
            
            Category electronics = Category.builder()
                    .name("Electronics")
                    .description("Gadgets, devices, and accessories")
                    .build();
            
            Category clothing = Category.builder()
                    .name("Clothing")
                    .description("Men's, Women's, and Kids' apparel")
                    .build();
            
            Category homeAndKitchen = Category.builder()
                    .name("Home & Kitchen")
                    .description("Furniture, decor, and appliances")
                    .build();
                    
            Category sports = Category.builder()
                    .name("Sports & Outdoors")
                    .description("Equipment, gear, and activewear")
                    .build();
                    
            categoryRepository.saveAll(Arrays.asList(electronics, clothing, homeAndKitchen, sports));
            
            Category mobilePhones = Category.builder()
                    .name("Mobile Phones")
                    .description("Smartphones and accessories")
                    .parent(electronics)
                    .build();
            
            Category laptops = Category.builder()
                    .name("Laptops")
                    .description("Laptops and accessories")
                    .parent(electronics)
                    .build();
            
            Category shirts = Category.builder()
                    .name("Shirts")
                    .description("Men's and Women's shirts")
                    .parent(clothing)
                    .build();
            
            categoryRepository.saveAll(Arrays.asList(mobilePhones, laptops, shirts));
            
            log.info("Default categories initialized successfully.");
        } else {
            log.info("Categories already exist. Skipping initialization.");
        }
    }
}
