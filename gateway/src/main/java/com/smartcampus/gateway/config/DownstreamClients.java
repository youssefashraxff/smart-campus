package com.smartcampus.gateway.config;

import io.netty.channel.ChannelOption;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

// HTTP clients for the gateway's own aggregated endpoints (FR-C3). The routes in application.yml proxy
// requests; these clients are for the two endpoints that call several services and combine the answers.
//
// WebClient, not RestClient: the gateway runs on WebFlux (non-blocking). A WebClient call returns a Mono
// (a value that arrives later) instead of blocking a thread, so two calls can run at the same time.
@Configuration
public class DownstreamClients {

    // Same budget as the services' RestClients: a hanging service must not hang the dashboard (NFR-3)
    private static final int CONNECT_TIMEOUT_MS = 1_000;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(2);

    @Bean
    WebClient catalogClient(@Value("${services.catalog-url}") String baseUrl) {
        return build(baseUrl);
    }

    @Bean
    WebClient bookingClient(@Value("${services.booking-url}") String baseUrl) {
        return build(baseUrl);
    }

    @Bean
    WebClient notificationClient(@Value("${services.notification-url}") String baseUrl) {
        return build(baseUrl);
    }

    private static WebClient build(String baseUrl) {
        HttpClient http = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .responseTimeout(RESPONSE_TIMEOUT);
        return WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(http))
                .build();
    }
}
