package com.smartcampus.chatbot.tools;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartcampus.chatbot.client.CatalogClient;
import com.smartcampus.chatbot.service.CampusTime;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.exception.BadRequestException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

// FR-B2: "What's on this week?", "Any AI workshops?" Wraps the catalog's event search (FR-U4).
@Component
public class SearchEventsTool implements CampusTool<SearchEventsTool.Arguments> {

    private static final int MAX_RESULTS = 15;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Arguments(String q, String category, String building, String from, String to) {}

    // Times already in Cairo local text, so the model only has to copy them
    public record EventSummary(int id, String title, String category, String building, String location,
                               String start, String end, String status) {}

    public record Result(int total, List<EventSummary> events) {}

    private final CatalogClient catalog;

    public SearchEventsTool(CatalogClient catalog) {
        this.catalog = catalog;
    }

    @Override
    public String name() {
        return "search_events";
    }

    @Override
    public String description() {
        return "Find campus events (workshops, talks, competitions, social events) by keyword, category, "
                + "building and/or date range. Returns id, title, category, place, start and end (Cairo time) and status "
                + "(Scheduled, Changed or Cancelled). Use get_event_details for description, speakers and free places.";
    }

    @Override
    public Map<String, Object> parameters() {
        return Schema.object(Schema.properties(
                "q", Schema.string("Words from the title, description or category, e.g. 'machine learning'"),
                "category", Schema.string("Exact category, e.g. 'Workshop'"),
                "building", Schema.string("Exact building name"),
                "from", Schema.string("First day, YYYY-MM-DD. For 'upcoming' questions use today"),
                "to", Schema.string("Last day (inclusive), YYYY-MM-DD")));
    }

    @Override
    public Class<Arguments> argumentsType() {
        return Arguments.class;
    }

    @Override
    public Result run(Arguments args) {
        // Parsed here so a bad date reaches the model as a clear message, not as the catalog's 400
        LocalDate from = ToolArguments.optionalDate(args.from(), "from");
        LocalDate to = ToolArguments.optionalDate(args.to(), "to");
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("to must not be before from");
        }

        List<EventResponse> found = catalog.searchEvents(args.q(), args.category(), args.building(),
                from == null ? null : from.toString(), to == null ? null : to.toString());
        List<EventSummary> events = found.stream()
                .limit(MAX_RESULTS)
                .map(e -> new EventSummary(e.id(), e.title(), e.category(), e.building(), e.location(),
                        CampusTime.dayTime(e.startTime()), CampusTime.dayTime(e.endTime()), e.status()))
                .toList();
        return new Result(found.size(), events);
    }
}
