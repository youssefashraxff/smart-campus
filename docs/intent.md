# Intent — remaining backend work

Why this work exists, what "done" means, and what is deliberately left out. Requirements are in `SRS.md`;
the contracts for this phase are in `spec.md`; the build order is in `plan.md`.

## Where the project stands (25 Nov 2026)

Done and merged: auth (register, login, `/me`), gateway routing + JWT validation + CORS + user headers,
facility/event/speaker admin writes, event registration and cancellation, cancelling bookings, "my items",
admin "all bookings". The Angular frontend already calls every endpoint in SRS 5 and waits for the backend.

Missing (the nine ClickUp backlog tasks):

| ClickUp task | SRS | Priority |
| --- | --- | --- |
| Booking: reserve a facility with transactional overlap check | FR-U5, 4.3 | Urgent |
| Catalog: search facilities and events | FR-U3, FR-U4 (+ GET by id) | High |
| Notifications: create, list mine, mark read | FR-U9, FR-U10 | High |
| Notifications: send email via SMTP | FR-U9 | Normal |
| Gateway: `/api/dashboard` aggregation | FR-C3 | Normal |
| Gateway: facility availability aggregation endpoint | FR-C3 | Normal |
| Catalog: notify registrants on schedule change or cancellation | FR-A5 | Normal |
| Booking: calendar export as .ics | FR-U11 | Normal |
| Booking: reminder before each booking | FR-U9, 4.3.6 | Low |

## Goal

Every endpoint in SRS 5 answers through the gateway with the shape the frontend's `core/models.ts` expects,
so the app works end to end on the seeded database.

## What success looks like

1. A student can search, open a facility's week calendar, book a free slot, and gets a 409 for an
   overlapping slot, even when two requests race (NFR-6).
2. Bookings, registrations, cancellations, event changes and reminders all create a dashboard alert, and an
   email when SMTP is configured.
3. The dashboard and the availability calendar each cost the browser one request; the gateway fans out
   in parallel and degrades per section when a service is down (NFR-3, NFR-4).
4. "Export to calendar" downloads a valid `.ics` file that Apple Calendar / Google Calendar import.
5. `mvn clean install` passes, `db/seed.sql` still loads after the new migration.

## Principles we keep

- **Data ownership.** A service touches only its own tables; anything else is an HTTP call to the owner.
  New service-to-service reads live under `/internal/**`, which the gateway never routes and explicitly denies.
- **HTTP calls never inside a DB transaction.** Validate first, run a short transaction, notify after commit.
- **Notifications are best effort (NFR-4).** A failing notification, email or reminder is logged, never
  turned into an error for the user's real action.
- **Portable SQL.** Case-insensitive search is `LOWER(col) LIKE LOWER(?)`, not `ILIKE`.
- **Explainable code.** Conventional Spring, comments that say *why*, one concept per class.

## Out of scope

Payments, SSO, push notifications, recurring bookings, waiting lists, an outbox/message broker for
guaranteed delivery, and the bonus chatbot.
