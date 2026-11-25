package com.smartcampus.notification;

import com.smartcampus.shared.exception.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableAsync;

// Entry point: starts the web server on the port in application.yml (C#: Program.cs)
@SpringBootApplication
// The error handler lives in shared (outside this package), so it is registered explicitly
@Import(GlobalExceptionHandler.class)
// Lets @Async methods run on a background thread pool: emails are sent after the API has answered
@EnableAsync
public class NotificationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(NotificationServiceApplication.class, args);
    }
}
