package com.smartcampus.chatbot.llm;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// Body of POST {groq.base-url}/chat/completions (OpenAI-compatible).
// tools = null leaves "tools" and "tool_choice" out, which forces a plain text answer.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CompletionRequest(
        String model,
        List<LlmMessage> messages,
        List<ToolDefinition> tools,
        @JsonProperty("tool_choice") String toolChoice,
        // Low temperature: we want factual answers from the tool results, not creative writing
        Double temperature,
        @JsonProperty("max_completion_tokens") Integer maxCompletionTokens) {}
