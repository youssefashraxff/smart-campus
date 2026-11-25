package com.smartcampus.chatbot.tools;

import com.smartcampus.chatbot.llm.ToolCall;
import com.smartcampus.chatbot.llm.ToolDefinition;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.NotFoundException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

// Knows every CampusTool and runs the one the model asked for.
//
// A tool never throws to the caller: every outcome, including errors, becomes JSON text for the model.
// "No facility with id 99" or "date must be like 2026-12-01" lets the model correct itself or explain the
// problem to the user, instead of the whole chat request failing.
@Component
public class ToolRegistry {

    private static final Logger log = LoggerFactory.getLogger(ToolRegistry.class);

    private final Map<String, CampusTool<?>> toolsByName = new LinkedHashMap<>();
    private final JsonMapper jsonMapper;

    // Spring passes every bean that implements CampusTool
    public ToolRegistry(List<CampusTool<?>> tools, JsonMapper jsonMapper) {
        tools.forEach(tool -> toolsByName.put(tool.name(), tool));
        this.jsonMapper = jsonMapper;
    }

    public List<ToolDefinition> definitions() {
        return toolsByName.values().stream().map(CampusTool::definition).toList();
    }

    // Returns the JSON text sent back to the model as the "tool" message
    public String execute(ToolCall call) {
        String name = call.function() == null ? null : call.function().name();
        CampusTool<?> tool = toolsByName.get(name);
        if (tool == null) {
            return error("Unknown tool '" + name + "'. Available: " + toolsByName.keySet());
        }
        String arguments = call.function().arguments();
        log.info("Tool call {} {}", name, arguments);   // NFR-8: shows what the assistant looked up
        try {
            return jsonMapper.writeValueAsString(run(tool, arguments));
        } catch (BadRequestException | NotFoundException ex) {
            return error(ex.getMessage());
        } catch (JacksonException ex) {
            return error("The arguments are not valid for " + name + ": " + ex.getOriginalMessage());
        } catch (HttpClientErrorException.BadRequest ex) {
            // e.g. the catalog rejected a filter value. Its ProblemDetail says why; the model can retry.
            return error("The campus service rejected these arguments: " + ex.getResponseBodyAsString());
        } catch (RestClientException ex) {
            log.warn("Tool {} failed: {}", name, ex.getMessage());
            return error("That campus service is unavailable right now, so this information can't be checked.");
        }
    }

    // A generic helper so the arguments are read into the tool's own record type: for SearchEventsTool,
    // A is SearchEventsTool.Arguments. (Calling tool.run directly on a CampusTool<?> would not compile.)
    private <A> Object run(CampusTool<A> tool, String argumentsJson) {
        String json = argumentsJson == null || argumentsJson.isBlank() ? "{}" : argumentsJson;
        A arguments = jsonMapper.readValue(json, tool.argumentsType());
        if (arguments == null) {        // the model sent the JSON literal null
            arguments = jsonMapper.readValue("{}", tool.argumentsType());
        }
        return tool.run(arguments);
    }

    private String error(String message) {
        return jsonMapper.writeValueAsString(Map.of("error", message));
    }
}
