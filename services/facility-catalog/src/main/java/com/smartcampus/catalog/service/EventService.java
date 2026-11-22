package com.smartcampus.catalog.service;

import com.smartcampus.catalog.dto.EventRequest;
import com.smartcampus.catalog.entity.Event;
import com.smartcampus.catalog.entity.EventStatus;
import com.smartcampus.catalog.exception.BadRequestException;
import com.smartcampus.catalog.exception.NotFoundException;
import com.smartcampus.catalog.repository.EventRepository;
import com.smartcampus.shared.contracts.EventResponse;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {

    private final EventRepository repository;

    public EventService(EventRepository repository) {
        this.repository = repository;
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
        Event e = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Event " + id + " not found"));
        checkTimes(r.startTime(), r.endTime());

        // Keep the old values: the FR-A5 task needs them to tell users what changed
        OffsetDateTime oldStart = e.getStartTime();
        OffsetDateTime oldEnd = e.getEndTime();
        String oldLocation = e.getLocation();

        boolean scheduleChanged = !oldStart.isEqual(r.startTime())
                || !oldEnd.isEqual(r.endTime())
                || !oldLocation.equals(r.location());

        EventStatus newStatus = r.status();
        if (newStatus != EventStatus.Cancelled && scheduleChanged) {
            newStatus = EventStatus.Changed;
        }

        e.update(r.title(), r.description(), r.category(), r.building(), r.location(),
                r.startTime(), r.endTime(), r.capacity(), newStatus);
        return toResponse(e);
    }

    @Transactional
    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Event " + id + " not found");
        }
        repository.deleteById(id);   // speakers go with it via ON DELETE CASCADE in the DB
    }

    private void checkTimes(OffsetDateTime start, OffsetDateTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("endTime must be after startTime");
        }
    }

    private EventResponse toResponse(Event e) {
        return new EventResponse(e.getId(), e.getTitle(), e.getDescription(), e.getCategory(),
                e.getBuilding(), e.getLocation(), e.getStartTime(), e.getEndTime(),
                e.getCapacity(), e.getStatus().name());
    }
}