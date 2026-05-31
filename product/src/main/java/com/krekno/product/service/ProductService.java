package com.krekno.product.service;

import com.krekno.product.dto.ProductRequest;
import com.krekno.product.entity.Category;
import com.krekno.product.entity.Product;
import com.krekno.product.repository.CategoryRepository;
import com.krekno.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final com.krekno.product.repository.ProductSearchRepository productSearchRepository;

    public Product createProduct(String sellerEmail, ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .sellerEmail(sellerEmail)
                .category(category)
                .build();

        Product savedProduct = productRepository.save(product);
        
        // Publish event
        kafkaTemplate.send("product-events", "PRODUCT_CREATED", savedProduct.getId().toString());

        return savedProduct;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public boolean reduceStock(UUID productId, int quantity) {
        Product product = getProductById(productId);
        if (product.getStockQuantity() < quantity) {
            return false;
        }
        product.setStockQuantity(product.getStockQuantity() - quantity);
        productRepository.save(product);
        
        kafkaTemplate.send("product-events", "STOCK_REDUCED", product.getId().toString());
        return true;
    }

    public List<com.krekno.product.entity.ProductDocument> searchProducts(String query) {
        // A simple query by name or description
        return productSearchRepository.findByNameContainingOrDescriptionContaining(query, query);
    }
}
