package com.smartcampus.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

// Tells the service behind the route who is calling. Runs on every routed request, after SecurityConfig
// has verified the token: copies the claims "sub" and "role" into X-User-Id and X-User-Role, so the
// services never have to parse a JWT themselves.
@Component
public class UserHeadersFilter implements GlobalFilter, Ordered {

    private static final String USER_ID = "X-User-Id";
    private static final String USER_ROLE = "X-User-Role";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Always drop what the client sent. The services trust these headers, so otherwise anyone
        // could send "X-User-Id: 1" and act as another user. Also applies to the public endpoints.
        ServerWebExchange cleaned = exchange.mutate()
                .request(request -> request.headers(headers -> {
                    headers.remove(USER_ID);
                    headers.remove(USER_ROLE);
                }))
                .build();

        // getPrincipal() is the user Spring Security authenticated. It is empty on login and register,
        // where defaultIfEmpty passes the request on without user headers.
        return exchange.getPrincipal()
                .ofType(JwtAuthenticationToken.class)
                .map(authentication -> withUser(cleaned, authentication.getToken()))
                .defaultIfEmpty(cleaned)
                .flatMap(chain::filter);
    }

    private static ServerWebExchange withUser(ServerWebExchange exchange, Jwt jwt) {
        return exchange.mutate()
                .request(request -> request
                        .header(USER_ID, jwt.getSubject())
                        .header(USER_ROLE, jwt.getClaimAsString("role")))
                .build();
    }

    // The filter that sends the request to the service has the lowest precedence, so anything earlier
    // works. Without an order we would tie with it and might run after the request was already sent.
    @Override
    public int getOrder() {
        return 0;
    }
}
