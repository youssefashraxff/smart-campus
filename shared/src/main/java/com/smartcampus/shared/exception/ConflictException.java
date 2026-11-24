package com.smartcampus.shared.exception;

// The request clashes with existing data (e.g. duplicate email) -> 409
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
