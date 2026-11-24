package com.smartcampus.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Maps the events table (V1__create_catalog_tables.sql). Events are independent of facilities
// (no foreign key, SRS 6). The speakers of an event are loaded through SpeakerRepository by event id.
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA needs a no-args constructor
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 160)
    private String title;

    // TEXT column: a plain String maps to it, no length needed
    private String description;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 80)
    private String building;

    @Column(nullable = false, length = 120)
    private String location;

    // TIMESTAMPTZ columns: OffsetDateTime keeps the time zone offset (Cairo is +02:00)
    private OffsetDateTime startTime;

    // The database also checks end_time > start_time
    private OffsetDateTime endTime;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    public Event(String title, String description, String category, String building,
                 String location, OffsetDateTime startTime, OffsetDateTime endTime,
                 Integer capacity, EventStatus status) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.building = building;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.capacity = capacity;
        this.status = status;
    }

    public void update(String title, String description, String category, String building,
                       String location, OffsetDateTime startTime, OffsetDateTime endTime,
                       Integer capacity, EventStatus status) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.building = building;
        this.location = location;
        this.startTime = startTime;
        this.endTime = endTime;
        this.capacity = capacity;
        this.status = status;
    }
}
