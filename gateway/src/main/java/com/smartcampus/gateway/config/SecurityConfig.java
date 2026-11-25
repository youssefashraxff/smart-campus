package com.smartcampus.gateway.config;

import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.config.GlobalCorsProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtGrantedAuthoritiesConverterAdapter;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

// Decides who may call which path (FR-C4, NFR-5). Runs before the routes in application.yml, so a
// rejected request never reaches a service:
//   no token / bad token -> 401,  valid token but wrong role -> 403,  otherwise -> routed.
// The gateway runs on WebFlux, so this uses the reactive classes (ServerHttpSecurity, not HttpSecurity).
// (C#: AddAuthentication().AddJwtBearer() + AddAuthorization() in Program.cs)
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    // Must be the name AuthService's Role enum produces, because JwtService writes role.name()
    private static final String ADMIN = "Admin";

    @Bean
    SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, SecurityErrorHandler errorHandler,
                                                  ReactiveJwtAuthenticationConverter jwtConverter) {
        return http
                // CSRF attacks rely on the browser sending a cookie by itself. We use an
                // Authorization header, which Angular adds explicitly, so there is nothing to protect.
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                // Spring adds a /logout endpoint by default. Our logout only forgets the token (FR-U2).
                .logout(ServerHttpSecurity.LogoutSpec::disable)
                // Uses the corsConfigurationSource bean below
                .cors(Customizer.withDefaults())

                // SRS 5 access column. The FIRST matching rule wins, so order matters.
                .authorizeExchange(access -> access
                        // Public: you cannot have a token before you log in
                        .pathMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()

                        // Service-to-service endpoints (/internal/** on each service) are never for the
                        // browser. No route forwards them anyway; this makes it explicit.
                        .pathMatchers("/internal/**").denyAll()

                        // Internal: services call the Notification service directly on port 5004.
                        // Without this rule any user could send alerts and emails to other users.
                        .pathMatchers(HttpMethod.POST, "/api/notifications/**").denyAll()

                        // Catalog (FR-A1..A4): reading is for everyone signed in, any other method
                        // (POST, PUT, DELETE, also on /speakers) is for admins
                        .pathMatchers(HttpMethod.GET, "/api/facilities/**", "/api/events/**").authenticated()
                        .pathMatchers("/api/facilities/**", "/api/events/**").hasRole(ADMIN)

                        // All bookings (FR-A6). The exact path only: /api/bookings/mine and
                        // /api/bookings/calendar.ics are for every user.
                        .pathMatchers(HttpMethod.GET, "/api/bookings").hasRole(ADMIN)

                        // Everything else needs a valid token, so a new route is protected by default
                        .anyExchange().authenticated())

                // Reads "Authorization: Bearer <jwt>" and checks it with the jwtDecoder bean
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                        .authenticationEntryPoint(errorHandler))      // bad or expired token -> 401
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(errorHandler)       // no token -> 401
                        .accessDeniedHandler(errorHandler))           // wrong role -> 403
                .build();
    }

    // Verifies the signature and the expiry ("exp") of a token. The secret must be the same one
    // AuthService signs with. Both sides read it as Base64 text, so startup fails while it is still
    // "CHANGE_ME" ('_' is not a Base64 character) instead of rejecting every token later.
    // HS256 is fixed here, so a token cannot choose its own algorithm (e.g. "none").
    @Bean
    ReactiveJwtDecoder jwtDecoder(@Value("${jwt.secret}") String secret) {
        SecretKey key = new SecretKeySpec(Base64.getDecoder().decode(secret), "HmacSHA256");
        return NimbusReactiveJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    // Turns the claim "role": "Admin" into the authority "ROLE_Admin", which is what hasRole("Admin")
    // looks for. Without this, Spring would read the "scope" claim, which our tokens do not have.
    @Bean
    ReactiveJwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter roles = new JwtGrantedAuthoritiesConverter();
        roles.setAuthoritiesClaimName("role");
        roles.setAuthorityPrefix("ROLE_");

        ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new ReactiveJwtGrantedAuthoritiesConverterAdapter(roles));
        return converter;
    }

    // Spring Security runs before the gateway's own CORS handling. Without this bean the browser's
    // preflight (OPTIONS, sent without a token) would get a 401, and 401/403 answers would have no CORS
    // headers, so Angular could not read them. The rules still live in application.yml (globalcors).
    @Bean
    CorsConfigurationSource corsConfigurationSource(GlobalCorsProperties globalCors) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.setCorsConfigurations(globalCors.getCorsConfigurations());
        return source;
    }
}
