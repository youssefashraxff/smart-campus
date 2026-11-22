package com.smartcampus.catalog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;

// Maps the facilities table (V1__create_catalog_tables.sql): a room, lab or piece of equipment
@Getter
@Entity
@Table(name = "facilities")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 80)
    private String building;

    @Column(nullable = false, length = 120)
    private String location;

    // The database also checks capacity > 0
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    private FacilityType type;

    @Enumerated(EnumType.STRING)
    private FacilityStatus status;
    
protected Facility() {}   // required by JPA

public Facility(String title, String building, String location,
                Integer capacity, FacilityType type, FacilityStatus status) {
    this.title = title;
    this.building = building;
    this.location = location;
    this.capacity = capacity;
    this.type = type;
    this.status = status;
}

public void update(String title, String building, String location,
                   Integer capacity, FacilityType type, FacilityStatus status) {
    this.title = title;
    this.building = building;
    this.location = location;
    this.capacity = capacity;
    this.type = type;
    this.status = status;
}
}
