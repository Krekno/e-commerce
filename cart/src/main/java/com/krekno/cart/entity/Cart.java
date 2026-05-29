package com.krekno.cart.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@RedisHash(value = "Cart", timeToLive = 604800L) // 7 days
public class Cart {

    @Id
    private String userId;
    
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();
}
