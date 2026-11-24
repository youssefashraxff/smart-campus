package com.smartcampus.booking.service;

import com.smartcampus.booking.entity.Registration;
import com.smartcampus.booking.entity.RegistrationStatus;
import com.smartcampus.booking.repository.RegistrationRepository;
import com.smartcampus.shared.exception.ConflictException;
import com.smartcampus.shared.exception.NotFoundException;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

// The database part of registering and cancelling. It is a separate bean because @Transactional works through a proxy:
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

    @Transactional(readOnly = true)
    public Registration findOwnActive(Integer userId, Integer id) {
        return requireOwnActive(repository.findById(id), userId, id);
    }

    // Checks again: the row may have changed since findOwnActive, while we waited for the catalog
    @Transactional
    public void cancel(Integer userId, Integer id) {
        Registration registration = requireOwnActive(repository.findWithLockById(id), userId, id);
        registration.cancel();
        repository.save(registration);
    }

    private static Registration requireOwnActive(Optional<Registration> found, Integer userId, Integer id) {
        // Someone else's registration gives the same 404 as a missing one, so nobody can probe which ids exist
        Registration registration = found.filter(r -> r.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("Registration " + id + " not found"));
        if (registration.getStatus() == RegistrationStatus.Cancelled) {
            throw new ConflictException("This registration is already cancelled");
        }
        return registration;
    }
}
