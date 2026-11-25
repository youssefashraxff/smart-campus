package com.smartcampus.chatbot.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// The model asking us to run one tool, e.g.
//   { "id": "call_1", "type": "function",
//     "function": { "name": "search_events", "arguments": "{\"q\":\"AI\"}" } }
// The id is echoed back in our "tool" message so the model can match each result to its call.
@JsonIgnoreProperties(ignoreUnknown = true)
public record ToolCall(String id, String type, Function function) {

    // arguments is a JSON object written as a string (that is how the OpenAI format sends it)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Function(String name, String arguments) {}
}
