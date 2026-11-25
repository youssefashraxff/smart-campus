# Spec — remaining backend work

Exact behaviour for the nine backlog tasks. Paths are as seen through the gateway (port 5010) unless marked
*internal*. Errors are RFC 9457 ProblemDetail with the SRS 5 codes. Times are ISO-8601 with an offset;
dates are `YYYY-MM-DD` in Africa/Cairo. A "Cairo day range" `from..to` always means the half-open interval
`[from 00:00, to + 1 day 00:00)` in Cairo time, and "overlaps" means `start < rangeEnd AND end > rangeStart`
(touching edges do not overlap).

## 1. Catalog search and details (FR-U3, FR-U4) — facility-catalog

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/facilities?q=&type=&building=&status=` | All filters optional. `q` matches title, building or location (case-insensitive, contains). `type` = Room/Lab/Equipment, `building` exact (case-insensitive), `status` = Available/Maintenance. Sorted by title, id. |
| GET | `/api/facilities/{id}` | `FacilityResponse` or 404 |
| GET | `/api/events?q=&category=&building=&from=&to=` | `q` matches title, description or category. `category`/`building` exact (case-insensitive). `from`/`to` keep events overlapping the Cairo day range; either may be sent alone. `to < from` → 400. Sorted by start time, id. Cancelled events are included (the UI shows the status). |
| GET | `/api/events/{id}` | `EventDetailResponse` = all `EventResponse` fields + `speakers[]` (sorted by name) |

`%` and `_` typed by the user are escaped, so they match literally.

## 2. Reserve a facility (FR-U5, SRS 4.3) — booking-engine

`POST /api/bookings` body `{ facilityId, startTime, endTime }`, user from `X-User-Id`.

1. Missing field → 400. `endTime <= startTime` → 400. `startTime` not in the future → 400.
2. Facility fetched from the catalog: unknown → 404, catalog down → 503, `Maintenance` → 409 (FR-A2).
3. One SERIALIZABLE transaction: if a **Confirmed** booking of that facility overlaps → 409; else insert
   `Confirmed`. A serialization failure from a simultaneous request → 409 "try again".
4. After commit: `Confirmation` notification (never fails the request).
5. 201 + `BookingResponse`.

## 3. Notifications (FR-U9, FR-U10) — notification-service

| Method | Path | Access | Behaviour |
| --- | --- | --- | --- |
| POST | `/api/notifications` | internal (gateway: denyAll) | Body `NotificationRequest { userId, type, message }`. Missing field or unknown type → 400. Saves the alert, then emails in the background. 201 + `NotificationResponse`. |
| GET | `/api/notifications/mine?unread=true` | user | Newest first. `unread=true` → only unread. |
| PUT | `/api/notifications/{id}/read` | user | Marks the caller's alert read. Someone else's or unknown → 404. Idempotent. 204. |

`NotificationResponse { id, type, message, isRead, createdAt }`.

## 4. Email via SMTP (FR-U9) — notification-service

- After saving, an `@Async` sender looks up the recipient with *internal* `GET /internal/users/{id}` on
  auth-service (`UserContact { id, name, email }`) and sends a plain-text mail with `JavaMailSender`.
- `notifications.email.enabled` (default `false`): when off, the mail is only logged. SMTP host, user and
  password go in the git-ignored `application-local.yml`.
- Any failure (auth down, SMTP refused) is logged; the alert is already saved.

## 5. Reminders (SRS 4.3.6) — booking-engine

- Every 5 minutes (`reminders.check-interval`, default `PT5M`) a scheduled job finds Confirmed bookings that
  start within the next 24 h (`reminders.lead-time`, default `PT24H`) and have `reminder_sent_at IS NULL`.
- One transaction stamps `reminder_sent_at`; after commit each user gets a `Reminder` notification.
- New column via Flyway `V2__booking_reminders_and_overlap_index.sql`: `reminder_sent_at TIMESTAMPTZ NULL`,
  plus index `(facility_id, start_time)` for the overlap check.

## 6. Calendar export (FR-U11) — booking-engine

`GET /api/bookings/calendar.ics` → `text/calendar; charset=utf-8`, `Content-Disposition: attachment;
filename="smart-campus.ics"`. One `VEVENT` per non-cancelled booking and registration (past and upcoming),
built from the same items as `/mine`. RFC 5545: CRLF line endings, times in UTC (`...Z`), stable `UID`
(`booking-12@smartcampus`), text escaping (`\\ \; \, \n`) and 75-octet line folding.

## 7. Notify registrants (FR-A5) — facility-catalog

- On `PUT /api/events/{id}`: if the event becomes Cancelled → `Cancellation` alert; else if start, end or
  location changed → `ScheduleChange` alert with old and new time/place. On `DELETE` of an event that was
  not already Cancelled → `Cancellation` alert.
- The service publishes an application event inside the transaction; an `@Async
  @TransactionalEventListener(AFTER_COMMIT)` listener fetches the registered user ids from booking-engine
  (*internal* `GET /internal/events/{eventId}/registered-users` → `[userId]`) and posts one notification
  each. The admin's request never waits for it and never fails because of it.

## 8. Gateway aggregations (FR-C3) — gateway

**`GET /api/dashboard`** → `{ upcoming, unreadAlerts, unreadCount, upcomingStatus, alertsStatus }`.
Calls booking-engine `/api/bookings/mine?status=active` and notification `/api/notifications/mine?unread=true`
in parallel with the caller's `X-User-Id`. `upcoming` = first 5, `unreadAlerts` = first 5, `unreadCount` = all
unread. A failing call gives an empty section with status `unavailable`; the response is still 200.

**`GET /api/facilities/{id}/availability?from=&to=`** → `{ facility, from, to, bookedSlots: [{startTime,
endTime}] }`. `to < from` or range > 31 days → 400. Calls catalog `GET /api/facilities/{id}` and *internal*
booking-engine `GET /internal/facilities/{id}/booked-slots?from=&to=` in parallel. Unknown facility → 404;
either service down → 503 (both parts are required). Slots are Confirmed bookings overlapping the range,
each once, sorted, no user ids.

Both are `@RestController`s in the gateway; Spring WebFlux's controller mapping is checked before the
gateway's route mapping, so `/api/facilities/{id}/availability` is answered by the gateway, not proxied.

## New shared contracts (`shared/.../contracts`)

`MyItemResponse` (moved from booking-engine, reused by the gateway and the .ics), `NotificationResponse`,
`TimeSlot`, `UserContact`. Contracts that cross a service boundary ignore unknown JSON fields
(tolerant reader), so adding a field on one side never breaks the other.
