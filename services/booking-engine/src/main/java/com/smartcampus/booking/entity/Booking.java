package com.smartcampus.booking.entity;

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

// Maps the bookings table (V1__create_booking_tables.sql, reminder_sent_at from V2): one user reserving
// one facility.
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA needs a no-args constructor
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // userId and facilityId point to rows owned by other services (auth-service, facility-catalog),
    // so they are plain numbers, not @ManyToOne relationships, and have no foreign key.
    // They are validated by calling the owning service over HTTP (SRS 6).
    private Integer userId;

    private Integer facilityId;

    private OffsetDateTime startTime;

    // The database also checks end_time > start_time
    private OffsetDateTime endTime;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private OffsetDateTime createdAt;

    // When the 24-hour reminder went out (SRS 4.3.6); null = not sent yet. ReminderJob uses it so a
    // booking is never reminded twice.
    private OffsetDateTime reminderSentAt;

    // A new booking is always Confirmed; createdAt is filled by onCreate()
    public Booking(Integer userId, Integer facilityId, OffsetDateTime startTime, OffsetDateTime endTime) {
        this.userId = userId;
        this.facilityId = facilityId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = BookingStatus.Confirmed;
    }

    // Soft delete: the row stays so it still shows in the user's past items
    public void cancel() {
        this.status = BookingStatus.Cancelled;
    }

    public void markReminderSent(OffsetDateTime when) {
        this.reminderSentAt = when;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
