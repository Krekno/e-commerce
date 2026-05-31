package com.krekno.cart.service;

import com.krekno.cart.entity.Cart;
import com.krekno.cart.entity.CartItem;
import com.krekno.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    public Cart getCart(String userId) {
        return cartRepository.findById(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().userId(userId).build();
            return cartRepository.save(newCart);
        });
    }

    public Cart addItem(String userId, CartItem item) {
        Cart cart = getCart(userId);
        
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(item.getProductId()))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + item.getQuantity());
        } else {
            cart.getItems().add(item);
        }

        return cartRepository.save(cart);
    }

    public Cart removeItem(String userId, UUID productId) {
        Cart cart = getCart(userId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return cartRepository.save(cart);
    }

    public Cart updateItemQuantity(String userId, UUID productId, int quantity) {
        Cart cart = getCart(userId);
        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(i -> i.getProductId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            if (quantity <= 0) {
                cart.getItems().remove(existingItem.get());
            } else {
                existingItem.get().setQuantity(quantity);
            }
        }
        return cartRepository.save(cart);
    }

    public void clearCart(String userId) {
        cartRepository.deleteById(userId);
    }
}
