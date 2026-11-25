package com.smartcampus.chatbot.tools;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartcampus.chatbot.client.BookingClient;
import com.smartcampus.chatbot.client.CatalogClient;
import com.smartcampus.chatbot.client.EventDetail;
import com.smartcampus.chatbot.service.CampusTime;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;

// FR-B2: event FAQs: "Who's speaking?", "Where is it?", "Are there places left?"
@Component
public class EventDetailsTool implements CampusTool<EventDetailsTool.Arguments> {

    private static final Logger log = LoggerFactory.getLogger(EventDetailsTool.class);

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Arguments(Integer eventId) {}

    public record Result(
            int id,
            String title,
            String description,
            String category,
            String building,
            String location,
            String start,
            String end,
            String status,
            Integer capacity,
            // null when booking-engine can't be reached: the rest of the answer is still useful
            Integer registered,
            Integer placesLeft,
            List<EventDetail.Speaker> speakers) {}

    private final CatalogClient catalog;
    private final BookingClient booking;

    public EventDetailsTool(CatalogClient catalog, BookingClient booking) {
        this.catalog = catalog;
        this.booking = booking;
    }

    @Override
    public String name() {
        return "get_event_details";
    }

    @Override
    public String description() {
        return "Get one event's full details: description, place, start and end (Cairo time), status, "
                + "capacity, how many are registered, places left, and its speakers. Needs the event id from search_events.";
    }

    @Override
    public Map<String, Object> parameters() {
        return Schema.object(Schema.properties(
                "eventId", Schema.integer("Event id from search_events")), "eventId");
    }

    @Override
    public Class<Arguments> argumentsType() {
        return Arguments.class;
    }

    @Override
    public Result run(Arguments args) {
        int eventId = ToolArguments.required(args.eventId(), "eventId");
        EventDetail event = catalog.getEvent(eventId);
        Integer registered = registeredOrNull(eventId);
        Integer placesLeft = registered == null || event.capacity() == null
                ? null
                : Math.max(0, event.capacity() - registered);

        return new Result(event.id(), event.title(), event.description(), event.category(), event.building(),
                event.location(), CampusTime.dayTime(event.startTime()), CampusTime.dayTime(event.endTime()),
                event.status(), event.capacity(), registered, placesLeft,
                event.speakers() == null ? List.of() : event.speakers());
    }

    // Partial answer instead of no answer (same idea as the dashboard's per-section fallback, NFR-4)
    private Integer registeredOrNull(int eventId) {
        try {
            return booking.registeredCount(eventId);
        } catch (RestClientException ex) {
            log.warn("Could not read registrations for event {}: {}", eventId, ex.getMessage());
            return null;
        }
    }
}
