package com.smartcampus.chatbot.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

// One RestClient (HTTP client) per thing we call. Campus services get the same short timeouts as in the
// other services; the LLM gets a longer read timeout, because generating an answer takes seconds.
@Configuration
public class RestClientConfig {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(1);
    private static final Duration SERVICE_READ_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration LLM_CONNECT_TIMEOUT = Duration.ofSeconds(5);
    private static final Duration LLM_READ_TIMEOUT = Duration.ofSeconds(30);

    @Bean
    RestClient catalogRestClient(@Value("${services.catalog-url}") String baseUrl) {
        return build(baseUrl, CONNECT_TIMEOUT, SERVICE_READ_TIMEOUT).build();
    }

    @Bean
    RestClient bookingRestClient(@Value("${services.booking-url}") String baseUrl) {
        return build(baseUrl, CONNECT_TIMEOUT, SERVICE_READ_TIMEOUT).build();
    }

    // Every Groq request carries "Authorization: Bearer <key>", so it is set once here
    @Bean
    RestClient groqRestClient(@Value("${groq.base-url}") String baseUrl, @Value("${groq.api-key}") String apiKey) {
        return build(baseUrl, LLM_CONNECT_TIMEOUT, LLM_READ_TIMEOUT)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    private static RestClient.Builder build(String baseUrl, Duration connectTimeout, Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory);
    }
}
