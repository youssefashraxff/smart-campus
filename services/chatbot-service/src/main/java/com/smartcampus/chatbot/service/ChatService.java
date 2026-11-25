package com.smartcampus.chatbot.service;

import com.smartcampus.chatbot.dto.ChatMessage;
import com.smartcampus.chatbot.dto.ChatResponse;
import com.smartcampus.chatbot.llm.GroqClient;
import com.smartcampus.chatbot.llm.LlmMessage;
import com.smartcampus.chatbot.llm.ToolCall;
import com.smartcampus.chatbot.tools.ToolRegistry;
import com.smartcampus.shared.exception.BadRequestException;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

// The tool-calling loop (FR-B1, FR-B2):
//
//   1. Send the conversation + the tool list to the model.
//   2. If the model answers with text, that's the reply. Done.
//   3. If it answers with tool calls, run each tool, append the results, and go back to 1.
//
// Example: "Is Computer Lab 3 free tomorrow at 2?"
//   round 1: model -> search_facilities(q="Lab 3")                 -> [{id: 7, title: "Computer Lab 3 ..."}]
//   round 2: model -> check_facility_availability(7, date, 14:00)  -> {free: false, conflicts: [...]}
//   round 3: model -> "No, it's booked 13:00-15:00. It's free from 15:00."
@Service
public class ChatService {

    // Real questions need 1-3 rounds. The cap stops a confused model from looping (and spending the quota).
    private static final int MAX_TOOL_ROUNDS = 5;
    private static final String NO_ANSWER = "Sorry, I couldn't find an answer to that. Could you rephrase it?";

    private final GroqClient groq;
    private final ToolRegistry tools;

    public ChatService(GroqClient groq, ToolRegistry tools) {
        this.groq = groq;
        this.tools = tools;
    }

    public ChatResponse chat(List<ChatMessage> history) {
        if (!"user".equals(history.getLast().role())) {
            throw new BadRequestException("The last message must be the user's question");
        }

        List<LlmMessage> messages = new ArrayList<>();
        messages.add(LlmMessage.system(SystemPrompt.build(CampusTime.today())));
        for (ChatMessage m : history) {
            messages.add("user".equals(m.role()) ? LlmMessage.user(m.content()) : LlmMessage.assistant(m.content()));
        }

        // A set: the same tool called twice is shown once
        Set<String> toolsUsed = new LinkedHashSet<>();
        for (int round = 0; round < MAX_TOOL_ROUNDS; round++) {
            LlmMessage answer = groq.complete(messages, tools.definitions());
            if (!answer.hasToolCalls()) {
                return new ChatResponse(textOf(answer), List.copyOf(toolsUsed));
            }
            // The assistant message with the tool calls must come before their results, so the model can
            // match each "tool" message to its call by tool_call_id
            messages.add(answer);
            for (ToolCall call : answer.toolCalls()) {
                if (call.function() != null) {
                    toolsUsed.add(call.function().name());
                }
                messages.add(LlmMessage.toolResult(call.id(), tools.execute(call)));
            }
        }

        // Still asking for tools after MAX_TOOL_ROUNDS: one last call without tools forces a text answer
        // from what has been looked up so far
        LlmMessage last = groq.complete(messages, null);
        return new ChatResponse(textOf(last), List.copyOf(toolsUsed));
    }

    private static String textOf(LlmMessage message) {
        return message.content() == null || message.content().isBlank() ? NO_ANSWER : message.content().strip();
    }
}
