package com.krekno.cart.controller;

import com.krekno.cart.entity.Cart;
import com.krekno.cart.entity.CartItem;
import com.krekno.cart.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CartControllerTest {

    @Mock
    private CartService cartService;

    @InjectMocks
    private CartController cartController;

    private Cart cart;
    private String userId;

    @BeforeEach
    void setUp() {
        userId = "test@example.com";
        cart = Cart.builder()
                .userId(userId)
                .items(new ArrayList<>())
                .build();
    }

    @Test
    void getCart_ReturnsCart() {
        when(cartService.getCart(userId)).thenReturn(cart);

        ResponseEntity<Cart> response = cartController.getCart(userId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(userId, response.getBody().getUserId());
    }

    @Test
    void addItem_ReturnsUpdatedCart() {
        CartItem item = new CartItem(UUID.randomUUID(), 2, BigDecimal.valueOf(10.0));
        cart.getItems().add(item);

        when(cartService.addItem(eq(userId), any(CartItem.class))).thenReturn(cart);

        ResponseEntity<Cart> response = cartController.addItem(userId, item);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(2, response.getBody().getItems().get(0).getQuantity());
    }

    @Test
    void removeItem_ReturnsUpdatedCart() {
        UUID productId = UUID.randomUUID();
        when(cartService.removeItem(userId, productId)).thenReturn(cart);

        ResponseEntity<Cart> response = cartController.removeItem(userId, productId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(userId, response.getBody().getUserId());
    }

    @Test
    void clearCart_ReturnsOk() {
        doNothing().when(cartService).clearCart(userId);

        ResponseEntity<Void> response = cartController.clearCart(userId);

        assertEquals(200, response.getStatusCode().value());
    }
}
