package com.smartcampus.chatbot.tools;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartcampus.chatbot.client.BookingClient;
import com.smartcampus.chatbot.client.CatalogClient;
import com.smartcampus.chatbot.service.CampusTime;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.contracts.TimeSlot;
import com.smartcampus.shared.exception.BadRequestException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

// FR-B1: "Is Lab 3 free tomorrow at 2?" Reads the same two sources as the gateway's availability
// aggregation (FR-C3): the facility from the catalog and its booked slots from booking-engine.
//
// When the user names a time, the overlap check is done HERE in Java, not by the model: comparing time
// ranges is exactly the kind of arithmetic an LLM gets wrong. The rule is the booking engine's
// (SRS 4.3): two ranges overlap when start < otherEnd AND end > otherStart, so touching edges are free.
@Component
public class CheckAvailabilityTool implements CampusTool<CheckAvailabilityTool.Arguments> {

    private static final int MAX_RANGE_DAYS = 7;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Arguments(Integer facilityId, String date, String toDate, String startTime, String endTime) {}

    // A booked range in Cairo local time, e.g. "Tue 2026-12-01 10:00" .. "Tue 2026-12-01 12:00"
    public record BookedSlot(String start, String end) {}

    // Present only when the user asked about a specific time
    public record RequestedSlot(String start, String end, boolean free, boolean inThePast, List<BookedSlot> conflicts) {}

    public record Result(
            int facilityId,
            String title,
            String building,
            String location,
            Integer capacity,
            String status,
            // Maintenance facilities accept no bookings at all (FR-A2), whatever the calendar says
            boolean bookable,
            LocalDate from,
            LocalDate to,
            List<BookedSlot> bookedSlots,
            RequestedSlot requestedSlot) {}

    private final CatalogClient catalog;
    private final BookingClient booking;

    public CheckAvailabilityTool(CatalogClient catalog, BookingClient booking) {
        this.catalog = catalog;
        this.booking = booking;
    }

    @Override
    public String name() {
        return "check_facility_availability";
    }

    @Override
    public String description() {
        return "Get a facility's booked time slots for a day (or up to 7 days), in Cairo time. "
                + "If startTime and endTime are given, also says whether that exact slot on 'date' is free. "
                + "Needs the facility id from search_facilities. Every time not listed in bookedSlots is free, "
                + "but only if 'bookable' is true.";
    }

    @Override
    public Map<String, Object> parameters() {
        return Schema.object(Schema.properties(
                        "facilityId", Schema.integer("Facility id from search_facilities"),
                        "date", Schema.string("Day to check, YYYY-MM-DD"),
                        "toDate", Schema.string("Optional last day for a range (inclusive, at most 7 days), YYYY-MM-DD"),
                        "startTime", Schema.string("Optional start of the slot the user wants on 'date', HH:mm (24-hour)"),
                        "endTime", Schema.string("Optional end of that slot, HH:mm (24-hour). If the user gives only a start, assume one hour")),
                "facilityId", "date");
    }

    @Override
    public Class<Arguments> argumentsType() {
        return Arguments.class;
    }

    @Override
    public Result run(Arguments args) {
        int facilityId = ToolArguments.required(args.facilityId(), "facilityId");
        LocalDate from = ToolArguments.date(args.date(), "date");
        LocalDate to = ToolArguments.optionalDate(args.toDate(), "toDate");
        if (to == null) {
            to = from;
        }
        // Checked before calling anyone, like the gateway's AvailabilityController
        if (to.isBefore(from)) {
            throw new BadRequestException("toDate must not be before date");
        }
        if (to.isAfter(from.plusDays(MAX_RANGE_DAYS - 1))) {
            throw new BadRequestException("The range can be at most " + MAX_RANGE_DAYS + " days");
        }

        FacilityResponse facility = catalog.getFacility(facilityId);
        List<TimeSlot> slots = booking.bookedSlots(facilityId, from, to).stream()
                .sorted(Comparator.comparing(TimeSlot::startTime))
                .toList();

        return new Result(facility.id(), facility.title(), facility.building(), facility.location(),
                facility.capacity(), facility.status(), "Available".equals(facility.status()),
                from, to, slots.stream().map(CheckAvailabilityTool::local).toList(),
                requestedSlot(args, from, slots));
    }

    private static RequestedSlot requestedSlot(Arguments args, LocalDate date, List<TimeSlot> slots) {
        if (args.startTime() == null || args.startTime().isBlank()) {
            return null;
        }
        LocalTime startTime = ToolArguments.time(args.startTime(), "startTime");
        LocalTime endTime = args.endTime() == null || args.endTime().isBlank()
                ? startTime.plusHours(1)
                : ToolArguments.time(args.endTime(), "endTime");
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("endTime must be after startTime");
        }

        ZonedDateTime start = date.atTime(startTime).atZone(CampusTime.ZONE);
        ZonedDateTime end = date.atTime(endTime).atZone(CampusTime.ZONE);
        List<BookedSlot> conflicts = slots.stream()
                .filter(slot -> start.toInstant().isBefore(slot.endTime().toInstant())
                        && end.toInstant().isAfter(slot.startTime().toInstant()))
                .map(CheckAvailabilityTool::local)
                .toList();

        return new RequestedSlot(CampusTime.dayTime(start), CampusTime.dayTime(end), conflicts.isEmpty(),
                start.isBefore(CampusTime.now()), conflicts);
    }

    private static BookedSlot local(TimeSlot slot) {
        return new BookedSlot(CampusTime.dayTime(slot.startTime()), CampusTime.dayTime(slot.endTime()));
    }
}
