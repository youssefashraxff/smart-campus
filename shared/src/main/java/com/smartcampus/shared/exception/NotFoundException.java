package com.smartcampus.shared.exception;

// The id in the URL does not exist -> 404
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
