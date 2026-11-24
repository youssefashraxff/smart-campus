package com.smartcampus.booking;

import com.smartcampus.shared.exception.GlobalExceptionHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

// Entry point: starts the web server on the port in application.yml (C#: Program.cs)
@SpringBootApplication
// The error handler lives in shared (outside this package), so it is registered explicitly
@Import(GlobalExceptionHandler.class)
public class BookingEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingEngineApplication.class, args);
    }
}
