package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.client.NotificationClient;
import com.smartcampus.booking.entity.Booking;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// SRS 4.3.6: a reminder a set time (24 h) before each booking starts.
// Spring calls run() on its own every few minutes (@Scheduled, enabled by @EnableScheduling on the
// Application class). Checking often and asking "what starts within the next 24 h and wasn't reminded?"
// is simpler and more robust than scheduling one timer per booking: it survives restarts, and a booking
// made only 3 hours ahead still gets its reminder on the next run.
@Component
public class ReminderJob {

    private static final Logger log = LoggerFactory.getLogger(ReminderJob.class);

    private final BookingTransactions transactions;
    private final CatalogClient catalogClient;
    private final NotificationClient notificationClient;
    private final Duration leadTime;

    public ReminderJob(BookingTransactions transactions, CatalogClient catalogClient,
                       NotificationClient notificationClient,
                       @Value("${reminders.lead-time:PT24H}") Duration leadTime) {
        this.transactions = transactions;
        this.catalogClient = catalogClient;
        this.notificationClient = notificationClient;
        this.leadTime = leadTime;
    }

    // fixedDelay: the next run starts that long after the previous one ENDED, so runs never overlap.
    // initialDelay: wait a little after startup so the service is fully up.
    @Scheduled(initialDelayString = "PT30S", fixedDelayString = "${reminders.check-interval:PT5M}")
    public void run() {
        OffsetDateTime now = OffsetDateTime.now();
        // 1. The transaction: claim the due bookings (stamps reminder_sent_at) and commit
        List<Booking> due = transactions.claimDueReminders(now, now.plus(leadTime));
        if (due.isEmpty()) {
            return;
        }
        log.info("Sending {} booking reminder(s)", due.size());

        // 2. After the commit: one notification per booking (never throws, NFR-4)
        for (Booking booking : due) {
            notificationClient.sendReminder(booking.getUserId(), "Reminder: your booking of "
                    + facilityName(booking.getFacilityId()) + " starts "
                    + CampusTime.format(booking.getStartTime()) + ".");
        }
    }

    // The reminder still goes out if the catalog is down or the facility was deleted, just less specific
    private String facilityName(Integer facilityId) {
        try {
            return catalogClient.getFacility(facilityId).title();
        } catch (RuntimeException ex) {
            return "facility #" + facilityId;
        }
    }
}
