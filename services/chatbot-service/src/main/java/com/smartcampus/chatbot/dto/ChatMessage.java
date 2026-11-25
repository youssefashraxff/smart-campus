package com.smartcampus.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// One line of the conversation as the frontend keeps it. Only "user" and "assistant": the system prompt
// and the tool messages are added by the server, so a client can't inject its own rules or fake tool results.
public record ChatMessage(
        @NotBlank @Pattern(regexp = "user|assistant", message = "must be user or assistant") String role,
        @NotBlank @Size(max = 2000) String content) {}
