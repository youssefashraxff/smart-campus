package com.smartcampus.gateway.aggregation;

import com.smartcampus.shared.contracts.MyItemResponse;
import com.smartcampus.shared.contracts.NotificationResponse;
import java.util.List;

// GET /api/dashboard (FR-C3). Each half has its own status, so the page can show "alerts are unavailable
// right now" next to a working list of bookings instead of failing as a whole (NFR-4).
public record DashboardResponse(
        List<MyItemResponse> upcoming,
        List<NotificationResponse> unreadAlerts,
        int unreadCount,
        String upcomingStatus,
        String alertsStatus) {}
