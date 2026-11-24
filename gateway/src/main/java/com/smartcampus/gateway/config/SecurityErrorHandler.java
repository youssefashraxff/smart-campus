package com.smartcampus.gateway.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authorization.ServerAccessDeniedHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import tools.jackson.databind.json.JsonMapper;

// Writes the gateway's 401 and 403 answers as ProblemDetail JSON, the same format the services use.
// Spring Security's default is an empty body. The services' GlobalExceptionHandler cannot be reused:
// it is Spring MVC, and these errors happen in a filter, before any controller.
@Component
public class SecurityErrorHandler implements ServerAuthenticationEntryPoint, ServerAccessDeniedHandler {

    private final JsonMapper jsonMapper;

    public SecurityErrorHandler(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    // Missing, invalid or expired token. One message for all three: the reason is no use to a client
    // except an attacker.
    @Override
    public Mono<Void> commence(ServerWebExchange exchange, AuthenticationException ex) {
        // HTTP requires a 401 to say how to authenticate
        exchange.getResponse().getHeaders().set(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        return write(exchange, HttpStatus.UNAUTHORIZED, "Unauthorized", "Missing, invalid or expired token");
    }

    // Valid token, but the role is not allowed to do this
    @Override
    public Mono<Void> handle(ServerWebExchange exchange, AccessDeniedException ex) {
        return write(exchange, HttpStatus.FORBIDDEN, "Forbidden", "You are not allowed to do this");
    }

    private Mono<Void> write(ServerWebExchange exchange, HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);

        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        byte[] json = jsonMapper.writeValueAsBytes(problem);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(json)));
    }
}
