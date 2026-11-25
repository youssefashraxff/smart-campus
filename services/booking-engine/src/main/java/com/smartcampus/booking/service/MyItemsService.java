package com.smartcampus.booking.service;

import com.smartcampus.booking.client.CatalogClient;
import com.smartcampus.booking.entity.Booking;
import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.contracts.FacilityResponse;
import com.smartcampus.shared.contracts.MyItemResponse;
import com.smartcampus.shared.contracts.MyItemResponse.Kind;
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

    // FR-U11: everything that really happens or happened, i.e. all items except cancelled ones,
    // earliest first. A calendar keeps past entries, so past items stay in the export.
    public List<MyItemResponse> listForCalendar(Integer userId) {
        return loadItems(userId).stream()
                .filter(item -> !item.status().equals("Cancelled"))
                .sorted(Comparator.comparing(MyItemResponse::startTime))
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
            items.add(facility == null ? withoutFacility(booking) : fromBooking(booking, facility));
        }
        for (Registration registration : registrations) {
            EventResponse event = events.get(registration.getEventId());
            // Without its event a registration has no times, so it can't be listed
            if (event != null) {
                items.add(fromRegistration(registration, event));
            }
        }
        return items;
    }

    // Entity + catalog record -> the shared MyItemResponse contract. These used to be factory methods on
    // the record; the record moved to shared (the gateway and the .ics reuse it) and shared can't know
    // booking-engine's entities, so the mapping lives here, next to the only code that builds items.

    // A booking has its own times; the facility gives it a name and a place
    private static MyItemResponse fromBooking(Booking booking, FacilityResponse facility) {
        return new MyItemResponse(Kind.BOOKING, booking.getId(),
                facility.title(), facility.building(), facility.location(),
                booking.getStartTime(), booking.getEndTime(), booking.getStatus().name());
    }

    // A facility the catalog no longer has: the booking still has its times, so it can still be listed
    private static MyItemResponse withoutFacility(Booking booking) {
        return new MyItemResponse(Kind.BOOKING, booking.getId(),
                "Facility #" + booking.getFacilityId() + " (no longer listed)", "", "",
                booking.getStartTime(), booking.getEndTime(), booking.getStatus().name());
    }

    // A registration has no times of its own: it starts and ends with its event
    private static MyItemResponse fromRegistration(Registration registration, EventResponse event) {
        return new MyItemResponse(Kind.REGISTRATION, registration.getId(),
                event.title(), event.building(), event.location(),
                event.startTime(), event.endTime(), registration.getStatus().name());
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
