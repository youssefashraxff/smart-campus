package com.smartcampus.chatbot.tools;

import com.smartcampus.chatbot.llm.ToolDefinition;
import java.util.Map;

// One thing the assistant can look up. Each tool is a Spring bean, and ToolRegistry receives all of them
// as a List<CampusTool<?>>: adding a tool means adding one class, nothing else changes (open/closed).
//
// A is the record the model's JSON arguments are read into, e.g. SearchEventsTool.Arguments.
// run() returns a plain record; ToolRegistry turns it into JSON for the model.
public interface CampusTool<A> {

    // Name the model uses in its tool call, e.g. "search_events"
    String name();

    // Tells the model WHEN to use the tool. The model chooses tools from these texts, so they matter.
    String description();

    // The arguments as JSON Schema (see Schema)
    Map<String, Object> parameters();

    Class<A> argumentsType();

    Object run(A arguments);

    default ToolDefinition definition() {
        return ToolDefinition.function(name(), description(), parameters());
    }
}
