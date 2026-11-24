package com.smartcampus.shared.exception;

// A rule on the request was broken (e.g. endTime before startTime) -> 400
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
