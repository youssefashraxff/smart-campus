package com.smartcampus.auth.entity;

// Stored as text in users.role. The constant names must match the database values exactly
// ('Student', 'Faculty', 'Admin'), because @Enumerated(EnumType.STRING) saves name().
public enum Role {
    Student,
    Faculty,
    Admin
}
