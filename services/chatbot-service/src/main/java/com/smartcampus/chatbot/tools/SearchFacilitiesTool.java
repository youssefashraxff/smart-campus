package com.smartcampus.chatbot.tools;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.smartcampus.chatbot.client.CatalogClient;
import com.smartcampus.shared.contracts.FacilityResponse;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

// FR-B1, step 1: turn a name the user typed ("lab 3", "a room for 30 people") into facility ids.
// The availability tool needs an id, and the model must never guess one.
@Component
public class SearchFacilitiesTool implements CampusTool<SearchFacilitiesTool.Arguments> {

    // Enough for any answer; keeps the model's input (and the token cost) small
    private static final int MAX_RESULTS = 15;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Arguments(String q, String type, String building) {}

    public record Result(int total, List<FacilityResponse> facilities) {}

    private final CatalogClient catalog;

    public SearchFacilitiesTool(CatalogClient catalog) {
        this.catalog = catalog;
    }

    @Override
    public String name() {
        return "search_facilities";
    }

    @Override
    public String description() {
        return "Find campus facilities (rooms, labs, equipment) by name or keyword, type or building. "
                + "Returns id, title, building, location, capacity, type and status (Available or Maintenance). "
                + "Call this first whenever the user names a facility, to get its id. "
                + "Send no arguments to list every facility.";
    }

    @Override
    public Map<String, Object> parameters() {
        return Schema.object(Schema.properties(
                "q", Schema.string("Words from the facility's title, building or location, e.g. 'Lab 3' or 'study room'"),
                "type", Schema.oneOf("Facility type", "Room", "Lab", "Equipment"),
                "building", Schema.string("Exact building name, e.g. 'FCIS Building B'")));
    }

    @Override
    public Class<Arguments> argumentsType() {
        return Arguments.class;
    }

    @Override
    public Result run(Arguments args) {
        List<FacilityResponse> found = catalog.searchFacilities(args.q(), args.type(), args.building());
        return new Result(found.size(), found.stream().limit(MAX_RESULTS).toList());
    }
}
