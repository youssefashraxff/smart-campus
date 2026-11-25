package com.smartcampus.shared.contracts;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// Where to email a user. auth-service owns users, so notification-service asks it through
// GET /internal/users/{id} instead of reading the users table.
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserContact(Integer id, String name, String email) {}
