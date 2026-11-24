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

// Maps the registrations table (V1__create_booking_tables.sql): one user registered for one event.
// "One active registration per user per event" is enforced by the unique index
// ux_registrations_active in the migration. JPA cannot describe a filtered index
// (WHERE status = 'Registered'), so it lives only in the SQL.
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA needs a no-args constructor
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // userId (auth-service) and eventId (facility-catalog) cross service boundaries:
    // plain numbers, no foreign key, validated over HTTP.
    private Integer userId;

    private Integer eventId;

    @Enumerated(EnumType.STRING)
    private RegistrationStatus status;

    private OffsetDateTime createdAt;

    // A new registration is always active; createdAt is filled by onCreate()
    public Registration(Integer userId, Integer eventId) {
        this.userId = userId;
        this.eventId = eventId;
        this.status = RegistrationStatus.Registered;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
