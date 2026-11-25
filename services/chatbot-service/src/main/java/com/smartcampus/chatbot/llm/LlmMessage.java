package com.smartcampus.chatbot.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// One message of an OpenAI-style conversation, as Groq sends and receives it. The role decides which
// fields are used:
//   system    -> content (the rules)                      user -> content (the question)
//   assistant -> content (the answer) OR toolCalls (the model asks us to run tools)
//   tool      -> toolCallId + content (the result of one tool call, as JSON text)
// NON_NULL leaves unused fields out of the JSON. ignoreUnknown skips fields we don't need, such as the
// "reasoning" text some models return.
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record LlmMessage(
        String role,
        String content,
        @JsonProperty("tool_calls") List<ToolCall> toolCalls,
        @JsonProperty("tool_call_id") String toolCallId) {

    public static LlmMessage system(String content) {
        return new LlmMessage("system", content, null, null);
    }

    public static LlmMessage user(String content) {
        return new LlmMessage("user", content, null, null);
    }

    public static LlmMessage assistant(String content) {
        return new LlmMessage("assistant", content, null, null);
    }

    public static LlmMessage toolResult(String toolCallId, String json) {
        return new LlmMessage("tool", json, null, toolCallId);
    }

    public boolean hasToolCalls() {
        return toolCalls != null && !toolCalls.isEmpty();
    }
}
