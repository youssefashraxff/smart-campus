package com.smartcampus.notification.service;

import com.smartcampus.notification.client.AuthClient;
import com.smartcampus.notification.entity.NotificationType;
import com.smartcampus.shared.contracts.UserContact;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

// The email half of FR-U9: the same text as the dashboard alert, sent over SMTP.
//
// @Async: Spring runs send() on a background thread, so POST /api/notifications answers as soon as the
// alert is saved. SMTP servers can take seconds; the booking that triggered the alert must not wait for
// that (and booking-engine gives up after 2 s). Like @Transactional, @Async works through a proxy, so it
// only applies when another bean (NotificationService) calls this method.
@Component
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final AuthClient authClient;
    // ObjectProvider: Spring Boot only creates a JavaMailSender when spring.mail.host is set. Without SMTP
    // settings (the default on a dev laptop) there is none, and the service must still start.
    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String from;

    public EmailSender(AuthClient authClient, ObjectProvider<JavaMailSender> mailSender,
                       @Value("${notifications.email.enabled:false}") boolean enabled,
                       @Value("${notifications.email.from}") String from) {
        this.authClient = authClient;
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.from = from;
    }

    // Never throws: the alert is already saved, an email problem is only logged (NFR-4)
    @Async
    public void send(Integer userId, NotificationType type, String message) {
        try {
            UserContact user = authClient.getContact(userId);
            JavaMailSender sender = mailSender.getIfAvailable();
            if (!enabled || sender == null) {
                log.info("Email disabled, would send to {}: [{}] {}", user.email(), subject(type), message);
                return;
            }

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(from);
            mail.setTo(user.email());
            mail.setSubject(subject(type));
            mail.setText("Hello " + user.name() + ",\n\n" + message
                    + "\n\nYou can see all your alerts on your Smart Campus dashboard.\n\nSmart Campus, FCIS");
            sender.send(mail);
            log.info("Email sent to user {} ({})", userId, type);
        } catch (RuntimeException ex) {
            log.warn("Email for user {} ({}) was not sent: {}", userId, type, ex.getMessage());
        }
    }

    private static String subject(NotificationType type) {
        return switch (type) {
            case Confirmation -> "Smart Campus: confirmed";
            case Reminder -> "Smart Campus: reminder";
            case ScheduleChange -> "Smart Campus: an event you registered for has changed";
            case Cancellation -> "Smart Campus: cancelled";
        };
    }
}
