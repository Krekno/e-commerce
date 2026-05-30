package com.krekno.product.service;

import com.krekno.product.dto.ProductRequest;
import com.krekno.product.entity.Category;
import com.krekno.product.entity.Product;
import com.krekno.product.repository.CategoryRepository;
import com.krekno.product.repository.ProductRepository;
import com.krekno.product.repository.ProductSearchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductSearchRepository productSearchRepository;

    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;

    @InjectMocks
    private ProductService productService;

    private Product product;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        product = Product.builder()
                .id(productId)
                .name("Test Product")
                .stockQuantity(10)
                .price(BigDecimal.valueOf(100.0))
                .build();
    }

    @Test
    void createProduct_SavesProduct() {
        ProductRequest request = new ProductRequest();
        request.setName("Test Product");
        request.setPrice(BigDecimal.valueOf(100.0));
        request.setStockQuantity(10);
        
        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product result = productService.createProduct(request);

        assertNotNull(result);
        assertEquals("Test Product", result.getName());
        verify(productRepository, times(1)).save(any(Product.class));
        verify(kafkaTemplate, times(1)).send(eq("product-events"), eq("PRODUCT_CREATED"), anyString());
    }

    @Test
    void reduceStock_SufficientStock_ReturnsTrue() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        boolean result = productService.reduceStock(productId, 2);

        assertTrue(result);
        assertEquals(8, product.getStockQuantity());
        verify(productRepository, times(1)).save(product);
        verify(kafkaTemplate, times(1)).send(eq("product-events"), eq("STOCK_REDUCED"), eq(productId.toString()));
    }

    @Test
    void reduceStock_InsufficientStock_ReturnsFalse() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        boolean result = productService.reduceStock(productId, 15);

        assertFalse(result);
        assertEquals(10, product.getStockQuantity()); // Should remain unchanged
        verify(productRepository, never()).save(any(Product.class));
    }
}
