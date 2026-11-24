package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.client.NotificationClient;
import com.smartcampus.booking.dto.RegistrationResponse;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.ConflictException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

// Event registration rules (FR-U6). Not @Transactional on purpose: the HTTP calls to other services
// happen before and after the transaction, never inside it.
@Service
public class RegistrationService {

    // Messages show campus time, whatever offset the catalog's JSON uses
    private static final ZoneId CAMPUS_ZONE = ZoneId.of("Africa/Cairo");
    private static final DateTimeFormatter START_FORMAT =
            DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", Locale.ENGLISH);

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
                + event.startTime().atZoneSameInstant(CAMPUS_ZONE).format(START_FORMAT)
                + ", " + event.location() + ".");

        return RegistrationResponse.from(saved);
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
