package com.smartcampus.booking.service;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.shared.exception.ConflictException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

// The database part of registering. It is a separate bean because @Transactional works through a proxy:
// Spring wraps this object and opens/commits the transaction around calls coming from OTHER beans.
// Called from inside the same class, the proxy is skipped and there would be no transaction at all.
@Service
public class RegistrationTransactions {

    private final RegistrationRepository repository;

    public RegistrationTransactions(RegistrationRepository repository) {
        this.repository = repository;
    }

    // SERIALIZABLE: count + insert behave as if no other transaction ran at the same time, so two
    // users cannot both take the last seat. The database aborts one of them (SQLSTATE 40001).
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Registration register(Integer userId, Integer eventId, int capacity) {
        if (repository.existsByUserIdAndEventIdAndStatus(userId, eventId, RegistrationStatus.Registered)) {
            throw new ConflictException("You are already registered for this event");
        }
        if (repository.countByEventIdAndStatus(eventId, RegistrationStatus.Registered) >= capacity) {
            throw new ConflictException("Event is full");
        }
        return repository.save(new Registration(userId, eventId));
    }
}
