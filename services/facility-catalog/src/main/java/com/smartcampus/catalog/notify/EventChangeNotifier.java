package com.smartcampus.catalog.notify;

import com.smartcampus.catalog.client.BookingClient;
import com.smartcampus.catalog.client.NotificationClient;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// FR-A5: tells every registered user that their event moved or was cancelled.
//
// @TransactionalEventListener(AFTER_COMMIT): Spring holds the EventScheduleChanged that EventService
//   published and only calls this method once the transaction has COMMITTED. If the update rolls back,
//   nobody is told about a change that never happened.
// @Async: runs on a background thread (enabled by @EnableAsync on the Application class), so the admin's
//   PUT/DELETE returns at once instead of waiting for one HTTP call per registered user.
@Component
public class EventChangeNotifier {

    private static final Logger log = LoggerFactory.getLogger(EventChangeNotifier.class);

    private final BookingClient bookingClient;
    private final NotificationClient notificationClient;

    public EventChangeNotifier(BookingClient bookingClient, NotificationClient notificationClient) {
        this.bookingClient = bookingClient;
        this.notificationClient = notificationClient;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onScheduleChanged(EventScheduleChanged change) {
        List<Integer> userIds;
        try {
            userIds = bookingClient.registeredUserIds(change.eventId());
        } catch (RuntimeException ex) {
            // Best effort (NFR-4): the event is already saved; we can only log that nobody was told
            log.warn("Could not load registrations of event {}, {} alerts not sent: {}",
                    change.eventId(), change.type(), ex.getMessage());
            return;
        }

        log.info("Sending {} alert for event {} to {} user(s)", change.type(), change.eventId(), userIds.size());
        for (Integer userId : userIds) {
            notificationClient.send(userId, change.type(), change.message());
        }
    }
}
