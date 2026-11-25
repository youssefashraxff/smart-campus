# Plan — remaining backend work

Order is chosen so each step unblocks the next and the app gets usable early. Each step lists the files it
touches and how to check it. Branch: `feat/remaining-backend`.

## Step 0 — shared contracts

- `shared/pom.xml`: add `jackson-annotations` (for `@JsonIgnoreProperties`, `@JsonProperty`).
- `contracts/`: `MyItemResponse` (moved), `NotificationResponse`, `TimeSlot`, `UserContact`; mark
  `EventResponse`, `FacilityResponse` as tolerant readers.

## Step 1 — Catalog search + details (High) · FR-U3, FR-U4

- `FacilitySpecifications`, `EventSpecifications` (optional filters as `Specification`s, escaped `LIKE`).
- Repositories extend `JpaSpecificationExecutor`.
- `FacilityService.search/get`, `EventService.search/get` (+ `EventDetailResponse`), `CampusTime`.
- Controllers: `GET /api/facilities`, `/{id}`, `GET /api/events`, `/{id}`.
- Check: `GET /api/facilities?q=lab`, `GET /api/events?from=…&to=…`, `GET /api/events/1` has `speakers`.

## Step 2 — Reserve a facility (Urgent) · FR-U5, 4.3

- `BookingRequest` DTO, `Booking` constructor, `BookingSpecifications.hasStatus/overlaps`.
- `BookingTransactions.reserve` (SERIALIZABLE), `BookingService.reserve`, `POST /api/bookings`.
- Check: book a free slot (201), same slot again (409), slot touching it (201), maintenance room (409).

## Step 3 — Notifications API (High) · FR-U9, FR-U10

- `Notification` constructor + `markRead`, repository queries, `NotificationService`,
  `NotificationController`; register `GlobalExceptionHandler`.
- Check: POST on port 5004 creates; `GET /api/notifications/mine?unread=true`; `PUT …/read` → 204.

## Step 4 — Email via SMTP (Normal)

- `spring-boot-starter-mail`; auth-service `InternalUserController` (`/internal/users/{id}`);
  notification `AuthClient`, `EmailSender` (`@Async`), `@EnableAsync`, config + local example.
- Check: with `enabled: false` the log shows the mail; with a Gmail app password it arrives.

## Step 5 — Gateway aggregations (Normal ×2) · FR-C3

- booking-engine `InternalController` (`/internal/facilities/{id}/booked-slots`).
- gateway: `DownstreamClients` (WebClient per service, timeouts), `DashboardController`,
  `AvailabilityController`, `GatewayExceptionHandler`; `/internal/**` denyAll; service URLs in yml.
- Check: dashboard with notification-service stopped → `alertsStatus: "unavailable"`, still 200.

## Step 6 — Notify registrants (Normal) · FR-A5

- booking-engine: `/internal/events/{id}/registered-users`.
- catalog: `RestClientConfig`, `BookingClient`, `NotificationClient`, `EventScheduleChanged` event,
  `EventChangeNotifier` (`@Async @TransactionalEventListener`), publish from `EventService`, `@EnableAsync`.
- Check: move a seeded event's start time → every registrant gets a ScheduleChange alert.

## Step 7 — Calendar export (Normal) · FR-U11

- `MyItemsService.listForCalendar`, `CalendarService` (RFC 5545 writer), `GET /api/bookings/calendar.ics`.
- Check: download from "My bookings", import into Calendar.

## Step 8 — Reminders (Low) · 4.3.6

- Flyway `V2__booking_reminders_and_overlap_index.sql`; `Booking.reminderSentAt`;
  `BookingRepository.findDueForReminder`; `ReminderJob` (`@Scheduled`), `@EnableScheduling`; update `db/schema.sql`.
- Check: a booking starting in < 24 h gets one Reminder alert, never two.

## Step 9 — Verify

```bash
mvn clean install
# start the 4 services + gateway, then
psql -d campusdb -f db/seed.sql
cd frontend && npx ng build
```

Walk the UI as the student and the admin accounts; then move each ClickUp task to Done.

## Risks

| Risk | Mitigation |
| --- | --- |
| SERIALIZABLE aborts unrelated bookings (predicate lock on a full scan) | Index `(facility_id, start_time)` keeps locks narrow; aborts surface as 409 "try again" |
| Aggregation slows when one service hangs | 1 s connect / 2 s response timeout per call |
| Duplicate reminders | `reminder_sent_at` stamped in a transaction before sending |
| Lost notifications if a service is down at that moment | Accepted (best effort, NFR-4); an outbox is out of scope |
