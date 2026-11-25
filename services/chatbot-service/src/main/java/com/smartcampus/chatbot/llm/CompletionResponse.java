package com.smartcampus.chatbot.llm;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// The parts of Groq's answer we use. finishReason is "tool_calls" when the model wants tools run,
// "stop" when the message is the final answer.
@JsonIgnoreProperties(ignoreUnknown = true)
public record CompletionResponse(List<Choice> choices) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(LlmMessage message, @JsonProperty("finish_reason") String finishReason) {}
}
