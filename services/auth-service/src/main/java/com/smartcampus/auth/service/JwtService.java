package com.smartcampus.auth.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartcampus.auth.entity.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

// Signs the JWT handed out at login. The gateway validates it with the same secret
// and reads the claims "sub" (user id) and "role", so those names must not change.
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration expiration;

    // Spring calls this once at startup with the values from application.yml / application-local.yml
    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration}") Duration expiration) {
        // Base64 text -> raw bytes -> HMAC key. Throws at startup if the secret is shorter
        // than 32 bytes (WeakKeyException) or still "CHANGE_ME" (not valid Base64)
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expiration = expiration;
    }

    public String generate(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))       // "sub": who this token is about
                .claim("role", user.getRole().name())         // "Student" / "Faculty" / "Admin"
                .claim("name", user.getName())                // for display; not a secret
                .issuedAt(Date.from(now))                     // "iat"
                .expiration(Date.from(now.plus(expiration)))  // "exp": the gateway rejects it after this
                .signWith(key, Jwts.SIG.HS256)                // header + payload -> signature
                .compact();                                   // -> "xxxxx.yyyyy.zzzzz"
    }
}