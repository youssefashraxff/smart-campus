package com.smartcampus.booking.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// Campus time (Cairo), whatever offset the stored or received time uses
final class CampusTime {

    private static final ZoneId ZONE = ZoneId.of("Africa/Cairo");
    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_ONLY = DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH);

    private CampusTime() {
    }

    // The first moment of that day on campus. Usually 00:00, but on the day summer time starts Egypt's
    // clocks jump from 00:00 to 01:00, and atStartOfDay(zone) handles that.
    static OffsetDateTime startOfDay(LocalDate date) {
        return date.atStartOfDay(ZONE).toOffsetDateTime();
    }

    // For notification messages, e.g. "Tue 1 Dec, 11:00"
    static String format(OffsetDateTime time) {
        return time.atZoneSameInstant(ZONE).format(FORMAT);
    }

    // Just the clock time, e.g. "12:30" (for the end of a booking in the same message)
    static String formatTime(OffsetDateTime time) {
        return time.atZoneSameInstant(ZONE).format(TIME_ONLY);
    }
}
