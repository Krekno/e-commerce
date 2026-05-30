package com.krekno.product.controller;

import com.krekno.product.dto.ProductRequest;
import com.krekno.product.entity.Product;
import com.krekno.product.entity.ProductDocument;
import com.krekno.product.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProductControllerTest {

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    @Test
    void createProduct_ReturnsProduct() {
        ProductRequest request = new ProductRequest();
        Product product = Product.builder().id(UUID.randomUUID()).name("Test").build();

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(product);

        ResponseEntity<Product> response = productController.createProduct(request);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("Test", response.getBody().getName());
    }

    @Test
    void getAllProducts_ReturnsList() {
        when(productService.getAllProducts()).thenReturn(Collections.singletonList(new Product()));

        ResponseEntity<List<Product>> response = productController.getAllProducts();

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void getProductById_ReturnsProduct() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder().id(id).build();
        when(productService.getProductById(id)).thenReturn(product);

        ResponseEntity<Product> response = productController.getProductById(id);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(id, response.getBody().getId());
    }

    @Test
    void reduceStock_Success_ReturnsTrue() {
        UUID id = UUID.randomUUID();
        when(productService.reduceStock(id, 2)).thenReturn(true);

        ResponseEntity<Boolean> response = productController.reduceStock(id, 2);

        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody());
    }

    @Test
    void reduceStock_Failure_ReturnsBadRequest() {
        UUID id = UUID.randomUUID();
        when(productService.reduceStock(id, 2)).thenReturn(false);

        ResponseEntity<Boolean> response = productController.reduceStock(id, 2);

        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void searchProducts_ReturnsList() {
        when(productService.searchProducts(anyString())).thenReturn(Collections.singletonList(new ProductDocument()));

        ResponseEntity<List<ProductDocument>> response = productController.searchProducts("query");

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().size());
    }
}
