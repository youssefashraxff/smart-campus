package com.smartcampus.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

// Maps the speakers table (V1__create_catalog_tables.sql).
@Getter
@Entity
@Table(name = "speakers")
public class Speaker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Events and speakers belong to the same service, so this is a real foreign key
    // (speakers.event_id -> events.id) and JPA can map it as a relationship.
    // LAZY: the event is only loaded from the database when getEvent() is used.
    // Deleting an event deletes its speakers through ON DELETE CASCADE in the database.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 160)
    private String affiliation;

    // TEXT column
    private String bio;
}
