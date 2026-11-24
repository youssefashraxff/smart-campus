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
import lombok.Getter;

// Maps the bookings table (V1__create_booking_tables.sql): one user reserving one facility.
@Getter
@Entity
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

    // Soft delete: the row stays so it still shows in the user's past items
    public void cancel() {
        this.status = BookingStatus.Cancelled;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
