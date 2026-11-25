package com.smartcampus.chatbot;

import com.smartcampus.shared.exception.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

// Entry point of the Campus Assistant (bonus, FR-B3): its own process on port 5005, reached through the
// gateway at POST /api/chat. It has no database, so Spring Boot configures no DataSource.
@SpringBootApplication
// The error handler lives in shared (outside this package), so it is registered explicitly
@Import(GlobalExceptionHandler.class)
public class ChatbotServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatbotServiceApplication.class, args);
    }
}
