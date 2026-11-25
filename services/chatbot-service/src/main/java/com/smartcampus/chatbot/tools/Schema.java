package com.smartcampus.chatbot.tools;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Small helpers to write the JSON Schema of a tool's arguments, e.g.
//   object(Map.of("q", string("Free text")), "q")
//   -> {"type":"object","properties":{"q":{"type":"string","description":"Free text"}},"required":["q"]}
final class Schema {

    private Schema() {
    }

    static Map<String, Object> object(Map<String, Object> properties, String... required) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("properties", properties);
        schema.put("required", List.of(required));
        return schema;
    }

    static Map<String, Object> string(String description) {
        return Map.of("type", "string", "description", description);
    }

    static Map<String, Object> oneOf(String description, String... values) {
        return Map.of("type", "string", "description", description, "enum", List.of(values));
    }

    static Map<String, Object> integer(String description) {
        return Map.of("type", "integer", "description", description);
    }

    // Keeps the order in which the properties are listed (Map.of has no order)
    static Map<String, Object> properties(Object... nameThenSchema) {
        Map<String, Object> properties = new LinkedHashMap<>();
        for (int i = 0; i < nameThenSchema.length; i += 2) {
            properties.put((String) nameThenSchema[i], nameThenSchema[i + 1]);
        }
        return properties;
    }
}
