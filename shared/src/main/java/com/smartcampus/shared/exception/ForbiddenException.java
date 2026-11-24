package com.smartcampus.shared.exception;

// The caller is known but their role may not do this -> 403
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
