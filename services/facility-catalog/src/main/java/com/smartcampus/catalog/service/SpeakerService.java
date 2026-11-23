package com.smartcampus.catalog.service;

import com.smartcampus.catalog.dto.SpeakerRequest;
import com.smartcampus.catalog.dto.SpeakerResponse;
import com.smartcampus.catalog.entity.Event;
import com.smartcampus.catalog.entity.Speaker;
import com.smartcampus.catalog.exception.NotFoundException;
import com.smartcampus.catalog.repository.EventRepository;
import com.smartcampus.catalog.repository.SpeakerRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SpeakerService {

    private final SpeakerRepository speakers;
    private final EventRepository events;

    public SpeakerService(SpeakerRepository speakers, EventRepository events) {
        this.speakers = speakers;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public List<SpeakerResponse> list(Integer eventId) {
        findEvent(eventId);   // 404 if the event doesn't exist
        return speakers.findByEventIdOrderByNameAsc(eventId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public SpeakerResponse add(Integer eventId, SpeakerRequest r) {
        Event event = findEvent(eventId);
        Speaker saved = speakers.save(new Speaker(event, r.name(), r.affiliation(), r.bio()));
        return toResponse(saved);
    }

    @Transactional
    public SpeakerResponse update(Integer eventId, Integer speakerId, SpeakerRequest r) {
        findEvent(eventId);
        Speaker s = findSpeaker(speakerId, eventId);
        s.update(r.name(), r.affiliation(), r.bio());
        return toResponse(s);
    }

    @Transactional
    public void delete(Integer eventId, Integer speakerId) {
        findEvent(eventId);
        speakers.delete(findSpeaker(speakerId, eventId));
    }

    private Event findEvent(Integer eventId) {
        return events.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event " + eventId + " not found"));
    }

    // Checks the speaker belongs to THIS event, so /events/5/speakers/9 can't touch event 3's speaker
    private Speaker findSpeaker(Integer speakerId, Integer eventId) {
        return speakers.findByIdAndEventId(speakerId, eventId)
                .orElseThrow(() -> new NotFoundException(
                        "Speaker " + speakerId + " not found for event " + eventId));
    }

    private SpeakerResponse toResponse(Speaker s) {
        return new SpeakerResponse(s.getId(), s.getName(), s.getAffiliation(), s.getBio());
    }
}