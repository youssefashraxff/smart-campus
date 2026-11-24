package com.smartcampus.booking.service;

import com.smartcampus.booking.client.NotificationClient;
import com.smartcampus.booking.entity.Booking;
import org.springframework.stereotype.Service;

// Booking rules. Not @Transactional on purpose: notifications are sent after the transaction has committed.
@Service
public class BookingService {

    private final BookingTransactions transactions;
    private final NotificationClient notificationClient;

    public BookingService(BookingTransactions transactions, NotificationClient notificationClient) {
        this.transactions = transactions;
        this.notificationClient = notificationClient;
    }

    // FR-U8. Does not need facility-catalog, so cancelling works even when the catalog is down
    public void cancel(Integer userId, Integer id) {
        Booking cancelled = transactions.cancel(userId, id);
        notificationClient.sendCancellation(userId, "Your booking #" + id + " on "
                + CampusTime.format(cancelled.getStartTime()) + " has been cancelled.");
    }
}
