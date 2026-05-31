package com.krekno.order.repository;

import com.krekno.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<Order> findDistinctByItemsSellerEmailOrderByCreatedAtDesc(String sellerEmail);
}
