package com.krekno.payment.repository;

import com.krekno.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentTransaction, UUID> {
}
