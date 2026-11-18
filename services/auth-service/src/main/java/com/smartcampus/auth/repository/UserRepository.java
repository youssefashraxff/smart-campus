package com.smartcampus.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartcampus.auth.entity.User;

// Database access for User. Spring Data writes the implementation at startup;
// JpaRepository<User, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Boolean existsByUniversityId(String universityId);

}
