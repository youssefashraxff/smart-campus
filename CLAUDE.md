# Smart Campus — guide for Claude Code

University course project (Reusable Software Architecture). Requirements live in `docs/SRS.md`; every
feature maps to an ID there (FR-A*, FR-U*, FR-C*, NFR-*). Read it before implementing anything.

The repo is a skeleton: modules, folders, ports and configs exist, but there is no feature code yet.
The student must be able to explain every line to a TA, so prefer clear, conventional code over clever code,
and explain non-obvious decisions in your summary.

## Stack

- Java 21, Spring Boot 4.1, Maven multi-module build (root `pom.xml`, versions set only there)
- Spring Web MVC with `@RestController` classes
- Spring Data JPA (Hibernate) + PostgreSQL JDBC driver on native PostgreSQL 17, database `campusdb` (no Docker anywhere)
- Flyway for migrations: hand-written SQL in `services/<service>/src/main/resources/db/migration/V<n>__<description>.sql`
- Spring Cloud Gateway (WebFlux server, release train 2025.1) in `gateway`
- Angular 22 (standalone components, signals, zoneless) + Tailwind CSS 4 + Spartan/ng helm components in
  `frontend/libs/ui` (add more with `npx ng g @spartan-ng/cli:ui <name>`) + FullCalendar 7 (`fullcalendar`, `@fullcalendar/angular`)

## Modules and ports

| Module | Port | Base package | Flyway history table |
| --- | --- | --- | --- |
| gateway | 5010 | `com.smartcampus.gateway` | — |
| services/auth-service | 5001 | `com.smartcampus.auth` | `flyway_history_auth` |
| services/facility-catalog | 5002 | `com.smartcampus.catalog` | `flyway_history_catalog` |
| services/booking-engine | 5003 | `com.smartcampus.booking` | `flyway_history_booking` |
| services/notification-service | 5004 | `com.smartcampus.notification` | `flyway_history_notification` |
| shared | — | `com.smartcampus.shared` | — |

Each service has `controller/`, `entity/` and `repository/` packages. Ports and DB settings are in each
`src/main/resources/application.yml`.

## Rules

- **Frontend talks only to the gateway** (`http://localhost:5010/api`, see `frontend/src/environments`).
  Gateway routes live in `gateway/src/main/resources/application.yml` under `spring.cloud.gateway.server.webflux.routes`.
- **Data ownership:** each service maps only its own tables and has its own Flyway history table (above).
  Cross-service IDs have no foreign keys; validate them by calling the owning service over HTTP
  (`http://localhost:<port>`).
- **Schema changes go through Flyway only.** `ddl-auto` stays `validate`. Never edit a migration that has
  already run; add a new `V<n+1>__...sql` instead.
- **Table/column names must match `db/schema.sql`**: snake_case (Hibernate default: field `startTime` →
  column `start_time`), plural table names set with `@Table(name = "bookings")`, enums stored with
  `@Enumerated(EnumType.STRING)`, so `db/seed.sql` loads into the migrated database unchanged.
- **Portable SQL only:** no PostgreSQL-specific features in migrations or queries (no jsonb, arrays, `ILIKE`).
  Switching to SQL Server must only require changing the JDBC driver and URL.
- **Booking overlap rule** (SRS 4.3): check + insert in one serializable transaction.
- **Availability (NFR-4):** a failing Notification call must never fail a booking or registration.
- Reusable request/response contracts and service names go in `shared`.
- Errors follow SRS 5 status codes (400/401/403/404/409/503).
- Secrets: never commit real passwords. `application.yml` uses the placeholder `CHANGE_ME`; the real value goes
  in the git-ignored `application-local.yml` (template: `application-local.yml.example`).
- UI style: soft raised look — `rounded-2xl`/`rounded-3xl`, layered shadows on cards and primary buttons,
  flatter tables and forms.

## Verify before saying a phase is done

```bash
mvn clean install
cd frontend && npx ng build
```

When a phase touches the database, add the Flyway migration, start the service once so it runs, and confirm
`db/seed.sql` still loads.

## Dev accounts (db/seed.sql)

Admin `facilities.admin@cis.asu.edu.eg` / `Admin@2026` · Student `ahmed.mostafa@cis.asu.edu.eg` / `Campus@2026`.
