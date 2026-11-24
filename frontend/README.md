# Smart Campus — Frontend

Angular 22 (standalone, signals, zoneless), Tailwind CSS 4, Spartan/ng (components in `libs/ui`, add more with
`npx ng g @spartan-ng/cli:ui <name>`), FullCalendar 7.

```bash
npm install
npm start        # http://localhost:4200, talks to the gateway on http://localhost:5010
npm run build
```

The app calls only the API gateway (`src/environments`, FR-C1). Sign in with the dev accounts from `db/seed.sql`;
in development the sign-in page has a "Demo accounts" shortcut.

## Structure

```
src/app/
  core/
    models.ts          JSON contracts, one interface per Java record (field names must match)
    api/               one service per backend service: CatalogApi, BookingApi, NotificationApi
    auth/              AuthStore (JWT + user, signals), authInterceptor, route guards
    util/time.ts       everything in Africa/Cairo time (Temporal), incl. DST
    util/errors.ts     ProblemDetail -> readable message / per-field errors
  layout/              shell (sidebar on desktop, top bar + sheet on mobile), navigation
  shared/              page header, empty/error/loading states, status badge, rows, dialogs
  features/            one folder per component: <name>/<name>.ts, .html, .css
    auth/              login (FR-U2), register (FR-U1)
    dashboard/         GET /api/dashboard (FR-C3)
    facilities/        search (FR-U3), week calendar + booking form (FR-U5, FR-C3 availability)
    events/            search grouped by day (FR-U4), detail + register (FR-U6)
    bookings/          upcoming/past, cancel, .ics export (FR-U7, FR-U8, FR-U11)
    alerts/            alerts + mark read (FR-U9, FR-U10)
    admin/             facilities (FR-A1/A2), events + speakers (FR-A3/A4/A5), all bookings (FR-A6)
```

## Contracts the backend must match

`src/app/core/models.ts` is the frontend's side of SRS section 5. Records that already exist in the backend are
named there; the others follow the ClickUp task descriptions:

| Endpoint | Shape |
| --- | --- |
| `GET /api/events/{id}` | event fields + `speakers: Speaker[]` |
| `GET /api/bookings/mine?status=active\|past` | `MyItem[]`: `kind` (`BOOKING`/`REGISTRATION`), `id`, `title`, `building`, `location`, `startTime`, `endTime`, `status` |
| `GET /api/bookings` (admin) | `{ bookings: Booking[], registrations: Registration[] }` |
| `POST /api/registrations` | body `{ eventId }` |
| `GET /api/notifications/mine` | `{ id, type, message, isRead, createdAt }[]`, newest first |
| `GET /api/dashboard` | `{ upcoming, unreadAlerts, unreadCount, upcomingStatus, alertsStatus }`, statuses `ok`/`unavailable` |
| `GET /api/facilities/{id}/availability?from=&to=` | `{ facility, from, to, bookedSlots: [{ startTime, endTime }] }`. One request per calendar view; `from`/`to` are `YYYY-MM-DD`, both inclusive, in Cairo time |
| `GET /api/events?from=&to=` | `from`/`to` sent as `YYYY-MM-DD` |

Times are ISO-8601 strings with an offset (`OffsetDateTime`). Errors are read from RFC 9457 ProblemDetail
(`detail`, and `errors` for field validation).

## Design notes

- Soft raised style (SRS bonus): raised cards and primary buttons use the `--shadow-*` tokens in `src/styles.css`;
  tables, filters and forms stay flat.
- Colours: campus blue for actions, sun yellow only for "new" and "today". Every status badge has an icon and a
  word, not colour alone.
- Filters live in the URL query string, so lists can be bookmarked and the back button restores them.
- Motion is short and only on feedback (button press, dialogs, toasts); `prefers-reduced-motion` turns it off.
