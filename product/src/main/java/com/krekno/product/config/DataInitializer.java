package com.krekno.product.config;

import com.krekno.product.entity.Category;
import com.krekno.product.entity.Product;
import com.krekno.product.entity.ProductDocument;
import com.krekno.product.repository.CategoryRepository;
import com.krekno.product.repository.ProductRepository;
import com.krekno.product.repository.ProductSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ProductSearchRepository productSearchRepository;

    @Override
    public void run(String... args) throws Exception {
        Category laptops = null;
        Category electronics = null;
        Category shirts = null;

        if (categoryRepository.count() == 0) {
            electronics = Category.builder()
                    .name("Electronics")
                    .description("Gadgets, devices, and accessories")
                    .build();
            categoryRepository.save(electronics);

            laptops = Category.builder()
                    .name("Laptops")
                    .description("MacBooks and Windows laptops")
                    .parent(electronics)
                    .build();
            categoryRepository.save(laptops);

            Category fashion = Category.builder()
                    .name("Fashion")
                    .description("Clothing, shoes, and accessories")
                    .build();
            categoryRepository.save(fashion);

            shirts = Category.builder()
                    .name("Shirts")
                    .description("T-shirts and dress shirts")
                    .parent(fashion)
                    .build();
            categoryRepository.save(shirts);

            System.out.println("Mock Categories initialized!");
        } else {
            // Fetch categories by name to prevent incorrect category mapping
            electronics = categoryRepository.findAll().stream().filter(c -> "Electronics".equals(c.getName())).findFirst().orElse(null);
            laptops = categoryRepository.findAll().stream().filter(c -> "Laptops".equals(c.getName())).findFirst().orElse(electronics);
            shirts = categoryRepository.findAll().stream().filter(c -> "Shirts".equals(c.getName()) || "Clothing".equals(c.getName())).findFirst().orElse(electronics);
        }

        if (productRepository.count() == 0 && laptops != null) {
                Product product1 = Product.builder()
                        .name("MacBook Pro M3 Max")
                        .description("The ultimate pro laptop. M3 Max chip with 16-core CPU and 40-core GPU.")
                        .price(new BigDecimal("120000.00"))
                        .stockQuantity(15)
                        .imageUrl("https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-spaceblack-select-202310?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1698153656788")
                        .sellerEmail("techstore@example.com")
                        .category(laptops)
                        .build();
                product1 = productRepository.save(product1);
                productSearchRepository.save(mapToDocument(product1));
                kafkaTemplate.send("product-events", "PRODUCT_CREATED", product1.getId().toString());

                Product product2 = Product.builder()
                        .name("AirPods Pro 2")
                        .description("Active Noise Cancellation, Adaptive Audio, and Transparency mode.")
                        .price(new BigDecimal("8500.00"))
                        .stockQuantity(100)
                        .imageUrl("https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MQD83?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1660803972361")
                        .sellerEmail("techstore@example.com")
                        .category(electronics)
                        .build();
                product2 = productRepository.save(product2);
                productSearchRepository.save(mapToDocument(product2));
                kafkaTemplate.send("product-events", "PRODUCT_CREATED", product2.getId().toString());

                Product product3 = Product.builder()
                        .name("Classic White T-Shirt")
                        .description("100% organic cotton, comfortable fit.")
                        .price(new BigDecimal("350.00"))
                        .stockQuantity(200)
                        .imageUrl("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop")
                        .sellerEmail("fashion@example.com")
                        .category(shirts)
                        .build();
                product3 = productRepository.save(product3);
                productSearchRepository.save(mapToDocument(product3));
                kafkaTemplate.send("product-events", "PRODUCT_CREATED", product3.getId().toString());

                System.out.println("Mock Products initialized!");
        }

        if (productSearchRepository.count() == 0 && productRepository.count() > 0) {
            System.out.println("Elasticsearch is empty! Syncing from database...");
            productRepository.findAll().forEach(product -> {
                productSearchRepository.save(mapToDocument(product));
            });
            System.out.println("Sync completed!");
        }
    }

    private ProductDocument mapToDocument(Product product) {
        return ProductDocument.builder()
                .id(product.getId().toString())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .sellerEmail(product.getSellerEmail())
                .build();
    }
}
