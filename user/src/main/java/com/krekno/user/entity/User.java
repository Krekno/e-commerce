package com.krekno.user.entity;

import com.krekno.user.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "first name cannot be empty")
    @Column(nullable = false, name = "first_name")
    private String firstName;

    @NotBlank(message = "last name cannot be empty")
    @Column(nullable = false, name = "last_name")
    private String lastName;

    @NotBlank(message = "email cannot be empty")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "password cannot be empty")
    @Column(nullable = false)
    private String password;

    private UserRole role;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    public void addAddress(Address address) {
        addresses.add(address);
        address.setUser(this);
    }

    public void removeAddress(Address address) {
        addresses.remove(address);
        address.setUser(null);
    }

    @CreationTimestamp
    @Column(nullable = false, updatable = false, name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp // Changed from CreationTimestamp
    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updatedAt;
}