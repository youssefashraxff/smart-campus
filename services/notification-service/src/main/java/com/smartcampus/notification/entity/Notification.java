package com.smartcampus.notification.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Maps the notifications table (V1__create_notifications.sql): one alert for one user.
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA needs a no-args constructor
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Owned by auth-service: plain number, no foreign key
    private Integer userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    // TEXT column
    private String message;

    // Field isRead -> column is_read. New notifications start unread.
    // Lombok names the getter isRead() (it doesn't add a second "is").
    private boolean isRead = false;

    private OffsetDateTime createdAt;

    public Notification(Integer userId, NotificationType type, String message) {
        this.userId = userId;
        this.type = type;
        this.message = message;
    }

    // FR-U10. Marking an already-read alert again changes nothing, so PUT .../read is safe to repeat.
    public void markRead() {
        this.isRead = true;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
