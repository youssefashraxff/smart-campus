package com.smartcampus.booking.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

// One RestClient (HTTP client) per service we call (C#: services.AddHttpClient(...)).
// Short timeouts: a service that hangs must not hang our own request with it.
@Configuration
public class RestClientConfig {

    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(1);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(2);

    @Bean
    RestClient catalogRestClient(@Value("${services.catalog-url}") String baseUrl) {
        return build(baseUrl);
    }

    @Bean
    RestClient notificationRestClient(@Value("${services.notification-url}") String baseUrl) {
        return build(baseUrl);
    }

    private static RestClient build(String baseUrl) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(CONNECT_TIMEOUT);
        requestFactory.setReadTimeout(READ_TIMEOUT);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}
