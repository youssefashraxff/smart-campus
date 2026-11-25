package com.smartcampus.chatbot.tools;

import com.smartcampus.shared.exception.BadRequestException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

// Checks the values the model filled in. A BadRequestException here is NOT sent to the user as a 400:
// ToolRegistry gives the message back to the model, which usually fixes its call and tries again.
final class ToolArguments {

    private ToolArguments() {
    }

    static LocalDate date(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(field + " is required (YYYY-MM-DD)");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new BadRequestException(field + " must be a date like 2026-12-01, got '" + value + "'");
        }
    }

    // Optional date: null/blank stays null
    static LocalDate optionalDate(String value, String field) {
        return value == null || value.isBlank() ? null : date(value, field);
    }

    static LocalTime time(String value, String field) {
        try {
            return LocalTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new BadRequestException(field + " must be a 24-hour time like 14:00, got '" + value + "'");
        }
    }

    static int required(Integer value, String field) {
        if (value == null) {
            throw new BadRequestException(field + " is required");
        }
        return value;
    }
}
