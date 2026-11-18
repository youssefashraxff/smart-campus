package com.smartcampus.auth.exception;

// Thrown when the request clashes with existing data (duplicate email / university ID) -> 409
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }

}