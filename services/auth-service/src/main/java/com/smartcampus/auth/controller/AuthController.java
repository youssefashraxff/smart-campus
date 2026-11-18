package com.smartcampus.auth.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;

import com.smartcampus.auth.dto.AuthResponse;
import com.smartcampus.auth.dto.LoginRequest;
import com.smartcampus.auth.dto.RegisterRequest;
import com.smartcampus.auth.dto.UserResponse;
import com.smartcampus.auth.service.AuthService;



@RestController 
@RequestMapping ("/api/auth")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService){
        this.authService = authService;
    }   

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@RequestBody RegisterRequest registerRequest) {
        return this.authService.register(registerRequest);
    }
    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest loginRequest) {
        return this.authService.login(loginRequest);
    }
    @GetMapping("/me")
    public UserResponse profile(@RequestHeader ("X-User-Id") int userId) {
        return this.authService.me(userId);
    }
    
    
}
