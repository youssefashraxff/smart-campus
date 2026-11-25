package com.smartcampus.catalog.service;

import com.smartcampus.catalog.dto.EventDetailResponse;
import com.smartcampus.catalog.dto.EventRequest;
import com.smartcampus.catalog.dto.SpeakerResponse;
import com.smartcampus.catalog.entity.Event;
import com.smartcampus.catalog.entity.EventStatus;
import com.smartcampus.catalog.notify.EventScheduleChanged;
import com.smartcampus.catalog.repository.EventRepository;
import com.smartcampus.catalog.repository.EventSpecifications;
import com.smartcampus.catalog.repository.SpeakerRepository;
import com.smartcampus.shared.contracts.EventResponse;
import com.smartcampus.shared.exception.BadRequestException;
import com.smartcampus.shared.exception.NotFoundException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository repository;
    private final SpeakerRepository speakers;
    // Spring's in-process event bus. Publishing does not send anything yet: EventChangeNotifier
    // only reacts after the transaction commits (FR-A5).
    private final ApplicationEventPublisher publisher;

    public EventService(EventRepository repository, SpeakerRepository speakers,
                        ApplicationEventPublisher publisher) {
        this.repository = repository;
        this.speakers = speakers;
        this.publisher = publisher;
    }

    // FR-U4. Every filter is optional. from/to are Cairo calendar days, both inclusive, and keep the
    // events that OVERLAP [from 00:00, to + 1 day 00:00): a 2-day workshop shows up on both days.
    @Transactional(readOnly = true)
    public List<EventResponse> search(String q, String category, String building, LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("to must not be before from");
        }

        Specification<Event> spec = Specification.unrestricted();
        if (hasText(q)) {
            spec = spec.and(EventSpecifications.matchesKeyword(q));
        }
        if (hasText(category)) {
            spec = spec.and(EventSpecifications.hasCategory(category));
        }
        if (hasText(building)) {
            spec = spec.and(EventSpecifications.inBuilding(building));
        }
        if (from != null) {
            spec = spec.and(EventSpecifications.endsAfter(CampusTime.startOfDay(from)));
        }
        if (to != null) {
            // The end of a day is the start of the next one (not "+ 24 hours": DST days are 23 or 25 hours)
            spec = spec.and(EventSpecifications.startsBefore(CampusTime.startOfDay(to.plusDays(1))));
        }
        return repository.findAll(spec, Sort.by("startTime", "id")).stream().map(this::toResponse).toList();
    }

    // GET /api/events/{id}: the event with its speakers in one answer
    @Transactional(readOnly = true)
    public EventDetailResponse get(Integer id) {
        Event e = find(id);
        List<SpeakerResponse> eventSpeakers = speakers.findByEventIdOrderByNameAsc(id).stream()
                .map(s -> new SpeakerResponse(s.getId(), s.getName(), s.getAffiliation(), s.getBio()))
                .toList();
        return EventDetailResponse.of(toResponse(e), eventSpeakers);
    }

    @Transactional
    public EventResponse create(EventRequest r) {
        checkTimes(r.startTime(), r.endTime());
        // New events always start as Scheduled, whatever status the client sent
        Event saved = repository.save(new Event(
                r.title(), r.description(), r.category(), r.building(), r.location(),
                r.startTime(), r.endTime(), r.capacity(), EventStatus.Scheduled));
        return toResponse(saved);
    }

    @Transactional
    public EventResponse update(Integer id, EventRequest r) {
        Event e = find(id);
        checkTimes(r.startTime(), r.endTime());

        // Keep the old values: the FR-A5 message tells users what changed
        OffsetDateTime oldStart = e.getStartTime();
        OffsetDateTime oldEnd = e.getEndTime();
        String oldLocation = e.getLocation();
        boolean wasCancelled = e.getStatus() == EventStatus.Cancelled;

        boolean scheduleChanged = !oldStart.isEqual(r.startTime())
                || !oldEnd.isEqual(r.endTime())
                || !oldLocation.equals(r.location());

        EventStatus newStatus = r.status();
        if (newStatus != EventStatus.Cancelled && scheduleChanged) {
            newStatus = EventStatus.Changed;
        }

        e.update(r.title(), r.description(), r.category(), r.building(), r.location(),
                r.startTime(), r.endTime(), r.capacity(), newStatus);

        // FR-A5: cancellation wins over a change (no point telling people the new time of a cancelled event)
        if (newStatus == EventStatus.Cancelled && !wasCancelled) {
            publisher.publishEvent(EventScheduleChanged.cancelled(id, "\"" + e.getTitle() + "\" on "
                    + CampusTime.format(oldStart) + " has been cancelled."));
        } else if (newStatus != EventStatus.Cancelled && scheduleChanged) {
            publisher.publishEvent(EventScheduleChanged.changed(id, "\"" + e.getTitle() + "\" has moved to "
                    + CampusTime.format(r.startTime()) + ", " + r.location()
                    + " (was " + CampusTime.format(oldStart) + ", " + oldLocation + ")."));
        }
        return toResponse(e);
    }

    @Transactional
    public void delete(Integer id) {
        Event e = find(id);
        // Deleting an event that people are registered for cancels it for them (FR-A5)
        if (e.getStatus() != EventStatus.Cancelled) {
            publisher.publishEvent(EventScheduleChanged.cancelled(id, "\"" + e.getTitle() + "\" on "
                    + CampusTime.format(e.getStartTime()) + " has been cancelled."));
        }
        repository.delete(e);   // speakers go with it via ON DELETE CASCADE in the DB
    }

    private Event find(Integer id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event " + id + " not found"));
    }

    private void checkTimes(OffsetDateTime start, OffsetDateTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("endTime must be after startTime");
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private EventResponse toResponse(Event e) {
        return new EventResponse(e.getId(), e.getTitle(), e.getDescription(), e.getCategory(),
                e.getBuilding(), e.getLocation(), e.getStartTime(), e.getEndTime(),
                e.getCapacity(), e.getStatus().name());
    }
}
