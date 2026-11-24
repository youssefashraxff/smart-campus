package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.client.NotificationClient;
import com.smartcampus.booking.dto.RegistrationResponse;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import java.time.OffsetDateTime;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

// Event registration (FR-U6) and cancelling it (FR-U8). Not @Transactional on purpose: the HTTP calls
// to other services happen before and after the transaction, never inside it.
@Service
public class RegistrationService {

    private final CatalogClient catalogClient;
    private final RegistrationTransactions transactions;
    private final NotificationClient notificationClient;

    public RegistrationService(CatalogClient catalogClient, RegistrationTransactions transactions,
                               NotificationClient notificationClient) {
        this.catalogClient = catalogClient;
        this.transactions = transactions;
        this.notificationClient = notificationClient;
    }

    public RegistrationResponse register(Integer userId, Integer eventId) {
        // 1. Before the transaction: does the event exist and is it still open? (404 / 503 / 400)
        EventResponse event = catalogClient.getEvent(eventId);
        if ("Cancelled".equals(event.status())) {
            throw new BadRequestException("This event has been cancelled");
        }
        if (!event.startTime().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("This event has already started");
        }

        // 2. The transaction: when this returns, it has committed
        Registration saved = saveOrConflict(userId, eventId, event.capacity());

        // 3. After the commit. Never throws (NFR-4)
        notificationClient.sendConfirmation(userId, "You are registered for \"" + event.title() + "\" on "
                + CampusTime.format(event.startTime())
                + ", " + event.location() + ".");

        return RegistrationResponse.from(saved);
    }

    public void cancel(Integer userId, Integer id) {
        // 1. Exists, is the caller's and is active (404 / 409)
        Registration registration = transactions.findOwnActive(userId, id);

        // 2. A registration has no time of its own: it starts when its event starts
        EventResponse event = catalogClient.getEvent(registration.getEventId());
        if (!event.startTime().isAfter(OffsetDateTime.now())) {
            throw new BadRequestException("Past registrations can't be cancelled");
        }

        // 3. The transaction, then the notification
        transactions.cancel(userId, id);
        notificationClient.sendCancellation(userId,
                "Your registration for \"" + event.title() + "\" has been cancelled.");
    }

    // Turns the ways the database can reject a simultaneous registration into 409 instead of 500.
    // Caught here, outside the transaction, because a serialization failure can appear as late as the commit.
    private Registration saveOrConflict(Integer userId, Integer eventId, int capacity) {
        try {
            return transactions.register(userId, eventId, capacity);
        } catch (DataIntegrityViolationException ex) {
            // Unique index ux_registrations_active: the same user's other request got there first
            throw new ConflictException("You are already registered for this event");
        } catch (ConcurrencyFailureException ex) {
            // SQLSTATE 40001 (Spring: CannotAcquireLockException): lost against a simultaneous transaction
            throw new ConflictException("Another registration happened at the same moment, please try again");
        }
    }
}
