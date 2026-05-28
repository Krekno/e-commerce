package com.krekno.user.repository;

import com.krekno.user.entity.RefreshToken;
import com.krekno.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    void deleteByUser(User userNotFound);

    Optional<RefreshToken> findByToken(String refreshToken);
}
