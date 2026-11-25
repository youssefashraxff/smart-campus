package com.smartcampus.booking.service;

import com.smartcampus.shared.contracts.MyItemResponse;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

// FR-U11: the user's bookings and registrations as an iCalendar file (RFC 5545), the format Apple
// Calendar, Google Calendar and Outlook import. Written by hand: the format is plain text and the rules
// we need are few, so a library would be more to explain than the code it saves.
@Service
public class CalendarService {

    // RFC 5545 requires CRLF ("\r\n") at the end of every line, not just "\n"
    private static final String CRLF = "\r\n";
    // A line may be at most 75 octets (bytes) long; longer lines are "folded" (see fold())
    private static final int MAX_LINE_OCTETS = 75;
    // UTC "basic" format, e.g. 20261201T080000Z. UTC needs no VTIMEZONE block, and every
    // calendar app shows it in the viewer's own time zone.
    private static final DateTimeFormatter UTC_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'");

    private final MyItemsService myItemsService;

    public CalendarService(MyItemsService myItemsService) {
        this.myItemsService = myItemsService;
    }

    public String exportFor(Integer userId) {
        return build(myItemsService.listForCalendar(userId), OffsetDateTime.now());
    }

    String build(List<MyItemResponse> items, OffsetDateTime now) {
        StringBuilder ics = new StringBuilder();
        line(ics, "BEGIN:VCALENDAR");
        line(ics, "VERSION:2.0");
        line(ics, "PRODID:-//Smart Campus//Booking Engine//EN");
        line(ics, "CALSCALE:GREGORIAN");
        line(ics, "METHOD:PUBLISH");
        line(ics, "X-WR-CALNAME:Smart Campus");

        for (MyItemResponse item : items) {
            boolean booking = item.kind() == MyItemResponse.Kind.BOOKING;
            line(ics, "BEGIN:VEVENT");
            // UID must never change for the same item, so importing the file again UPDATES the entries
            // instead of creating duplicates
            line(ics, "UID:" + (booking ? "booking-" : "registration-") + item.id() + "@smartcampus");
            line(ics, "DTSTAMP:" + utc(now));
            line(ics, "DTSTART:" + utc(item.startTime()));
            line(ics, "DTEND:" + utc(item.endTime()));
            line(ics, "SUMMARY:" + escape((booking ? "Booking: " : "Event: ") + item.title()));
            line(ics, "LOCATION:" + escape(place(item)));
            line(ics, "DESCRIPTION:" + escape(booking
                    ? "Facility booking #" + item.id() + " (Smart Campus)"
                    : "Event registration #" + item.id() + " (Smart Campus)"));
            line(ics, "STATUS:CONFIRMED");
            line(ics, "END:VEVENT");
        }

        line(ics, "END:VCALENDAR");
        return ics.toString();
    }

    private static String place(MyItemResponse item) {
        if (item.building().isBlank()) {
            return item.location();
        }
        return item.location().isBlank() ? item.building() : item.location() + ", " + item.building();
    }

    private static String utc(OffsetDateTime time) {
        return time.withOffsetSameInstant(ZoneOffset.UTC).format(UTC_FORMAT);
    }

    // In TEXT values \ ; , and newlines have a meaning, so they are written as \\ \; \, \n
    static String escape(String text) {
        return text.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\r\n", "\\n")
                .replace("\n", "\\n");
    }

    private static void line(StringBuilder ics, String content) {
        ics.append(fold(content)).append(CRLF);
    }

    // Folding: after 75 bytes, break the line and start the next one with a space; readers join them back.
    // Counted in UTF-8 bytes (an Arabic letter is 2 bytes), and never inside one character.
    static String fold(String content) {
        StringBuilder out = new StringBuilder();
        int octets = 0;
        // Continuation lines begin with a space, which counts toward their 75
        int limit = MAX_LINE_OCTETS;
        for (int i = 0; i < content.length(); ) {
            int codePoint = content.codePointAt(i);
            String ch = new String(Character.toChars(codePoint));
            int size = ch.getBytes(StandardCharsets.UTF_8).length;
            if (octets + size > limit) {
                out.append(CRLF).append(' ');
                octets = 0;
                limit = MAX_LINE_OCTETS - 1;
            }
            out.append(ch);
            octets += size;
            i += Character.charCount(codePoint);
        }
        return out.toString();
    }
}
