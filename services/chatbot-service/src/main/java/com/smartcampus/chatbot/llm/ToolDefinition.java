package com.smartcampus.chatbot.llm;

import java.util.Map;

// Tells the model that a tool exists: its name, when to use it, and its arguments as JSON Schema.
// The model never runs anything itself; it only answers with a ToolCall, and our code runs the tool.
public record ToolDefinition(String type, Function function) {

    public record Function(String name, String description, Map<String, Object> parameters) {}

    public static ToolDefinition function(String name, String description, Map<String, Object> parameters) {
        return new ToolDefinition("function", new Function(name, description, parameters));
    }
}
