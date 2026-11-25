package com.smartcampus.chatbot.controller;

import com.smartcampus.chatbot.dto.ChatRequest;
import com.smartcampus.chatbot.dto.ChatResponse;
import com.smartcampus.chatbot.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Bonus: Campus Assistant (FR-B1..B3). Through the gateway: POST /api/chat, any signed-in user.
// The assistant only READS (search, availability, event details), so it needs no user id: it can never
// book, cancel or see anyone's personal data.
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // 200 with the reply · 400 invalid body · 503 when the LLM is down, rate-limited or not configured
    @PostMapping
    public ChatResponse chat(@Valid @RequestBody ChatRequest request) {
        return chatService.chat(request.messages());
    }
}
