package com.smartcampus.chatbot.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

// POST /api/chat body: the conversation so far, oldest first, ending with the user's new question.
// The service is stateless (no chat table): the browser sends the history each time, so any instance of
// the service can answer and nothing is stored about the user's questions.
// @Size caps the cost of one request, since everything sent here goes to the LLM.
public record ChatRequest(@NotEmpty @Size(max = 20) List<@Valid ChatMessage> messages) {}
