package com.smartcampus.chatbot.dto;

import java.util.List;

// reply: the assistant's answer (plain text).
// toolsUsed: which lookups produced it, e.g. ["search_facilities", "check_facility_availability"]. The UI
// shows them under the answer, so the user can see the answer comes from live campus data.
public record ChatResponse(String reply, List<String> toolsUsed) {}
