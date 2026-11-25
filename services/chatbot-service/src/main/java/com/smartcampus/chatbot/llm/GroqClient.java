package com.smartcampus.chatbot.llm;

import com.smartcampus.shared.exception.ServiceUnavailableException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

// Sends one conversation to Groq and returns the model's next message. Knows nothing about the campus:
// the tools and the system prompt come from ChatService. That keeps the LLM provider swappable.
@Component
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private static final double TEMPERATURE = 0.2;
    private static final int MAX_COMPLETION_TOKENS = 1024;

    private final RestClient restClient;
    private final String model;
    private final boolean configured;

    public GroqClient(@Qualifier("groqRestClient") RestClient restClient,
                      @Value("${groq.model}") String model,
                      @Value("${groq.api-key}") String apiKey) {
        this.restClient = restClient;
        this.model = model;
        // Still the placeholder from application.yml -> answer 503 with a clear message instead of
        // sending a request Groq would reject with 401
        this.configured = apiKey != null && !apiKey.isBlank() && !apiKey.equals("CHANGE_ME");
        if (!configured) {
            log.warn("groq.api-key is not set: POST /api/chat will answer 503 until it is (see application-local.yml.example)");
        }
    }

    // tools: what the model may ask for, or null to force a final text answer
    public LlmMessage complete(List<LlmMessage> messages, List<ToolDefinition> tools) {
        if (!configured) {
            throw new ServiceUnavailableException("The campus assistant isn't configured yet (missing Groq API key)", null);
        }
        CompletionRequest request = new CompletionRequest(model, messages, tools, tools == null ? null : "auto",
                TEMPERATURE, MAX_COMPLETION_TOKENS);
        try {
            CompletionResponse response = restClient.post()
                    .uri("/chat/completions")
                    .body(request)
                    .retrieve()
                    .body(CompletionResponse.class);
            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new ServiceUnavailableException("The assistant gave no answer, please try again", null);
            }
            return response.choices().getFirst().message();
        } catch (HttpClientErrorException.TooManyRequests ex) {
            // The free tier has per-minute limits
            throw new ServiceUnavailableException("The assistant is busy right now, please try again in a minute", ex);
        } catch (HttpClientErrorException ex) {
            // 400 (e.g. the model produced a broken tool call) or 401 (wrong key). The body says which.
            log.warn("Groq rejected the request: {} {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new ServiceUnavailableException("The assistant couldn't handle that question, please rephrase it", ex);
        } catch (RestClientException ex) {
            log.warn("Groq call failed: {}", ex.getMessage());
            throw new ServiceUnavailableException("The assistant is unavailable right now, please try again later", ex);
        }
    }
}
