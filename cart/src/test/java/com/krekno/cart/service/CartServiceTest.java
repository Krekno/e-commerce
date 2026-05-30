package com.krekno.cart.service;

import com.krekno.cart.entity.Cart;
import com.krekno.cart.entity.CartItem;
import com.krekno.cart.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @InjectMocks
    private CartService cartService;

    private String userId;
    private Cart cart;

    @BeforeEach
    void setUp() {
        userId = "test@example.com";
        cart = Cart.builder()
                .userId(userId)
                .items(new ArrayList<>())
                .build();
    }

    @Test
    void getCart_ReturnsExistingCart() {
        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));

        Cart result = cartService.getCart(userId);

        assertEquals(userId, result.getUserId());
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    void getCart_CreatesNewCartIfNotFound() {
        when(cartRepository.findById(userId)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.getCart(userId);

        assertEquals(userId, result.getUserId());
        verify(cartRepository, times(1)).save(any(Cart.class));
    }

    @Test
    void addItem_AddsNewItem() {
        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem item = new CartItem(UUID.randomUUID(), 2, BigDecimal.valueOf(10.0));
        Cart result = cartService.addItem(userId, item);

        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getItems().get(0).getQuantity());
        verify(cartRepository, times(1)).save(cart);
    }

    @Test
    void addItem_UpdatesQuantityIfItemExists() {
        UUID productId = UUID.randomUUID();
        cart.getItems().add(new CartItem(productId, 2, BigDecimal.valueOf(10.0)));

        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        CartItem item = new CartItem(productId, 3, BigDecimal.valueOf(10.0));
        Cart result = cartService.addItem(userId, item);

        assertEquals(1, result.getItems().size());
        assertEquals(5, result.getItems().get(0).getQuantity());
        verify(cartRepository, times(1)).save(cart);
    }

    @Test
    void removeItem_RemovesItem() {
        UUID productId = UUID.randomUUID();
        cart.getItems().add(new CartItem(productId, 2, BigDecimal.valueOf(10.0)));

        when(cartRepository.findById(userId)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        Cart result = cartService.removeItem(userId, productId);

        assertTrue(result.getItems().isEmpty());
        verify(cartRepository, times(1)).save(cart);
    }

    @Test
    void clearCart_DeletesCart() {
        cartService.clearCart(userId);
        verify(cartRepository, times(1)).deleteById(userId);
    }
}
