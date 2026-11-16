package com.smartcampus.notification.repository;

import com.smartcampus.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

// Database access for Notification. Spring Data writes the implementation at startup;
// JpaRepository<Notification, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
}
