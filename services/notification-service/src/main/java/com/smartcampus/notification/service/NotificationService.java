package com.smartcampus.notification.service;

import com.smartcampus.notification.entity.Notification;
import com.smartcampus.notification.entity.NotificationType;
import com.smartcampus.notification.repository.NotificationRepository;
import com.smartcampus.shared.contracts.NotificationRequest;
import com.smartcampus.shared.contracts.NotificationResponse;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.NotFoundException;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// Dashboard alerts (FR-U9, FR-U10)
@Service
public class NotificationService {

    // Newest first; the id breaks ties between alerts created in the same instant
    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt", "id");

    private final NotificationRepository repository;
    private final EmailSender emailSender;

    public NotificationService(NotificationRepository repository, EmailSender emailSender) {
        this.repository = repository;
        this.emailSender = emailSender;
    }

    // Called by other services. Saves the alert, then hands the email to a background thread.
    // Not @Transactional: save() has its own short transaction, and the email must start only once the
    // alert is really stored.
    public NotificationResponse create(NotificationRequest request) {
        NotificationType type = validate(request);
        Notification saved = repository.save(new Notification(request.userId(), type, request.message()));
        emailSender.send(saved.getUserId(), saved.getType(), saved.getMessage());   // returns at once (@Async)
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listMine(Integer userId, boolean unreadOnly) {
        List<Notification> found = unreadOnly
                ? repository.findUnreadByUserId(userId, NEWEST_FIRST)
                : repository.findByUserId(userId, NEWEST_FIRST);
        return found.stream().map(NotificationService::toResponse).toList();
    }

    // FR-U10. Someone else's alert gives the same 404 as a missing one, so nobody can probe which ids exist
    @Transactional
    public void markRead(Integer userId, Integer id) {
        Notification notification = repository.findById(id)
                .filter(n -> n.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Notification " + id + " not found"));
        notification.markRead();   // dirty checking writes it at commit
    }

    // The body is a shared record without @Valid annotations (shared has no validation library),
    // so the rules are checked here. Any failure is a 400.
    private static NotificationType validate(NotificationRequest r) {
        if (r.userId() == null) {
            throw new BadRequestException("userId is required");
        }
        if (r.message() == null || r.message().isBlank()) {
            throw new BadRequestException("message is required");
        }
        if (r.type() == null) {
            throw new BadRequestException("type is required");
        }
        try {
            return NotificationType.valueOf(r.type());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("type must be Confirmation, Reminder, ScheduleChange or Cancellation");
        }
    }

    private static NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType().name(), n.getMessage(), n.isRead(), n.getCreatedAt());
    }
}
