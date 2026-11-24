package com.smartcampus.shared.exception;

// Another service this request needs is down or too slow -> 503
public class ServiceUnavailableException extends RuntimeException {
    public ServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
