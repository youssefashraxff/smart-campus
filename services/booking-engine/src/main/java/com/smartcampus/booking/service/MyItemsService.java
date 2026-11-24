package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.dto.MyItemResponse;
import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.NotFoundException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// The user's own bookings and registrations in one list (FR-U7). Not @Transactional: it only reads,
// and the catalog calls must not keep a database transaction open.
@Service
public class MyItemsService {

    private static final Logger log = LoggerFactory.getLogger(MyItemsService.class);

    private final BookingRepository bookingRepository;
    private final RegistrationRepository registrationRepository;
    private final CatalogClient catalogClient;

    public MyItemsService(BookingRepository bookingRepository, RegistrationRepository registrationRepository,
                          CatalogClient catalogClient) {
        this.bookingRepository = bookingRepository;
        this.registrationRepository = registrationRepository;
        this.catalogClient = catalogClient;
    }

    public List<MyItemResponse> listMine(Integer userId, String status) {
        if (!status.equals("active") && !status.equals("past")) {
            throw new BadRequestException("status must be active or past");
        }
        boolean wantActive = status.equals("active");

        // One "now" for the whole request, so an item can't change sides halfway through
        OffsetDateTime now = OffsetDateTime.now();
        Comparator<MyItemResponse> byStart = Comparator.comparing(MyItemResponse::startTime);

        // Every item is either active or not, so "past" is simply everything that isn't active:
        // ended or Cancelled
        return loadItems(userId).stream()
                .filter(item -> isActive(item, now) == wantActive)
                .sorted(wantActive ? byStart : byStart.reversed())
                .toList();
    }

    private static boolean isActive(MyItemResponse item, OffsetDateTime now) {
        return !item.status().equals("Cancelled") && item.endTime().isAfter(now);
    }

    private List<MyItemResponse> loadItems(Integer userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        List<Registration> registrations = registrationRepository.findByUserId(userId);

        // Collecting into a Set leaves each id once, so each facility or event is fetched once per request
        Set<Integer> facilityIds = bookings.stream().map(Booking::getFacilityId).collect(Collectors.toSet());
        Set<Integer> eventIds = registrations.stream().map(Registration::getEventId).collect(Collectors.toSet());
        Map<Integer, FacilityResponse> facilities = fetchAll(facilityIds, catalogClient::getFacility);
        Map<Integer, EventResponse> events = fetchAll(eventIds, catalogClient::getEvent);

        List<MyItemResponse> items = new ArrayList<>();
        for (Booking booking : bookings) {
            FacilityResponse facility = facilities.get(booking.getFacilityId());
            items.add(facility == null
                    ? MyItemResponse.withoutFacility(booking)
                    : MyItemResponse.from(booking, facility));
        }
        for (Registration registration : registrations) {
            EventResponse event = events.get(registration.getEventId());
            // Without its event a registration has no times, so it can't be listed
            if (event != null) {
                items.add(MyItemResponse.from(registration, event));
            }
        }
        return items;
    }

    // id -> catalog record. An id the catalog no longer has (an admin deleted it) is left out of the map,
    // so one deleted event doesn't turn the user's whole list into a 404. A catalog that is down still
    // gives 503, because ServiceUnavailableException is not caught here.
    private static <T> Map<Integer, T> fetchAll(Set<Integer> ids, Function<Integer, T> fetch) {
        Map<Integer, T> found = new HashMap<>();
        for (Integer id : ids) {
            try {
                found.put(id, fetch.apply(id));
            } catch (NotFoundException ex) {
                log.warn("Listed item points to a deleted record: {}", ex.getMessage());
            }
        }
        return found;
    }
}
