package com.smartcampus.chatbot.service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

// Campus time (Cairo). Each service keeps its own small copy, so it has no code dependency on another one.
// The model gets times already converted to Cairo local text: LLMs are unreliable at time-zone arithmetic.
public final class CampusTime {

    public static final ZoneId ZONE = ZoneId.of("Africa/Cairo");

    // e.g. "Tue 2026-12-01 14:00"
    private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("EEE yyyy-MM-dd HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter TODAY = DateTimeFormatter.ofPattern("EEEE yyyy-MM-dd, HH:mm", Locale.ENGLISH);

    private CampusTime() {
    }

    public static ZonedDateTime now() {
        return ZonedDateTime.now(ZONE);
    }

    public static ZonedDateTime local(OffsetDateTime time) {
        return time.atZoneSameInstant(ZONE);
    }

    public static String dayTime(OffsetDateTime time) {
        return time == null ? null : local(time).format(DAY_TIME);
    }

    public static String dayTime(ZonedDateTime time) {
        return time.format(DAY_TIME);
    }

    // For the system prompt, e.g. "Wednesday 2026-11-25, 20:15"
    public static String today() {
        return now().format(TODAY);
    }
}
