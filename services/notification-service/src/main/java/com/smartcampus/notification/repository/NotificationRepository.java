package com.smartcampus.notification.repository;

import com.smartcampus.notification.entity.Notification;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

// Database access for Notification. Spring Data writes the implementation at startup;
// JpaRepository<Notification, Integer> already gives save, findById, findAll, deleteById, count, ...
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // ... WHERE user_id = ? ORDER BY <sort>
    List<Notification> findByUserId(Integer userId, Sort sort);

    // Written as JPQL: a derived name like "findByUserIdAndIsReadFalse" would put the keyword "Is" next to
    // a field that is itself called isRead, which is easy to misread. Sort is still passed in by the caller.
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.isRead = false")
    List<Notification> findUnreadByUserId(@Param("userId") Integer userId, Sort sort);
}
