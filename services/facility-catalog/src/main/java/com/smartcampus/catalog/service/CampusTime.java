package com.smartcampus.catalog.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// Campus time (Cairo). Same helper as booking-engine's CampusTime: each service keeps its own copy
// so it has no code dependency on another service.
final class CampusTime {

    private static final ZoneId ZONE = ZoneId.of("Africa/Cairo");
    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", Locale.ENGLISH);

    private CampusTime() {
    }

    // The first moment of that day on campus (handles the summer-time day, when 00:00 doesn't exist)
    static OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(ZONE).toOffsetDateTime();
    }

    // For notification messages, e.g. "Tue 1 Dec, 11:00"
    static String format(OffsetDateTime time) {
        return time.atZoneSameInstant(ZONE).format(FORMAT);
    }
}
