package com.smartcampus.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// Entry point: starts the web server on the port in application.yml (C#: Program.cs)
@SpringBootApplication
public class BookingEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingEngineApplication.class, args);
    }
}
