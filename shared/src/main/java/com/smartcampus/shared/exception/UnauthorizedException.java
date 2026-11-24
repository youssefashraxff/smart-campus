package com.smartcampus.shared.exception;

// Missing or wrong credentials (e.g. bad email or password) -> 401
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
