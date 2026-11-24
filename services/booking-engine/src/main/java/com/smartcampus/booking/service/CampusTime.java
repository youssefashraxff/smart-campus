package com.smartcampus.booking.service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// Notification messages show campus time, whatever offset the stored or received time uses
final class CampusTime {

    private static final ZoneId ZONE = ZoneId.of("Africa/Cairo");
    private static final DateTimeFormatter FORMAT =
            DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", Locale.ENGLISH);

    private CampusTime() {
    }

    // e.g. "Tue 1 Dec, 11:00"
    static String format(OffsetDateTime time) {
        return time.atZoneSameInstant(ZONE).format(FORMAT);
    }
}
