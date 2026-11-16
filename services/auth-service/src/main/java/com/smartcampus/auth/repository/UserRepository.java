package com.smartcampus.auth.repository;

import com.smartcampus.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for User. Spring Data writes the implementation at startup;
// JpaRepository<User, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface UserRepository extends JpaRepository<User, Integer> {
}
