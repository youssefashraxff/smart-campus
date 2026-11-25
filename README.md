# Smart Campus — Event & Facility Booking Platform

Reusable Software Architecture course project (University of East London × Ain Shams University, FCIS).
Students and faculty discover campus events, book study rooms, labs and equipment, register for
workshops and track their reservations. Every function is a REST web service behind one API gateway.

## Architecture

```
Angular (4200) ──HTTP──▶ API Gateway (5010) ──▶ Auth Service          (5001)
                         Spring Cloud Gateway   Facility Catalog      (5002)
                         routing                Booking Engine        (5003)
                                                Notification Service  (5004)
                                                Chatbot Service       (5005) ──▶ Groq LLM
                                                        │
                                                PostgreSQL (campusdb)
```

| Module | Purpose |
| --- | --- |
| `gateway` | Single entry point: forwards `/api/**` to the right service (later: aggregation, JWT, CORS) |
| `services/auth-service` | Registration, login, roles (Student, Faculty, Admin) |
| `services/facility-catalog` | Facilities, equipment, events, speakers, search |
| `services/booking-engine` | Reservations with overlap checks, event registrations |
| `services/notification-service` | Email + dashboard alerts |
| `services/chatbot-service` | Bonus: Campus Assistant (`POST /api/chat`), Groq LLM with read-only tools |
| `shared` | Contracts and service names reused across services |
| `frontend` | Angular 22 + Tailwind CSS 4 + Spartan/ng + FullCalendar |
| `db` | `schema.sql` (reference) and `seed.sql` (initial FCIS data) |
| `docs` | `SRS.md`, the requirements every feature maps to |

### Inside each service

The four services live in `services/`; `gateway` and `shared` stay at the root because they aren't services.

```
services/booking-engine/
├── pom.xml                                   ← libraries this service needs
└── src/main/
    ├── java/com/smartcampus/booking/
    │   ├── BookingEngineApplication.java     ← entry point (starts the server)
    │   ├── controller/                       ← @RestController classes (endpoints)
    │   ├── entity/                           ← @Entity classes (one per table)
    │   └── repository/                       ← JpaRepository interfaces
    └── resources/
        ├── application.yml                   ← port, database URL, Flyway settings
        ├── application-local.yml.example     ← template for your local DB password
        └── db/migration/                     ← Flyway SQL files: V1__create_bookings.sql, ...
```

## Stack

- Java 21, Spring Boot 4.1 (Spring Web MVC, Spring Data JPA / Hibernate, Flyway)
- Spring Cloud Gateway (2025.1 release train) for the gateway
- Maven multi-module build (root `pom.xml`)
- PostgreSQL 17, native on macOS (no Docker)

## Prerequisites (macOS, Apple Silicon)

- Java 21: `brew install openjdk@21`
- Maven: `brew install maven`
- PostgreSQL 17: `brew install postgresql@17 && brew services start postgresql@17`
- VS Code extensions: **Extension Pack for Java** and **Spring Boot Extension Pack**
- Node.js 22+ for the frontend

## First run

1. **Database.** Create it once: `psql postgres`, then `CREATE DATABASE campusdb;`
2. **Password.** In each service's `src/main/resources/`, copy `application-local.yml.example` to
   `application-local.yml` and put your Postgres password in it. That file is git-ignored.
   Do the same in `gateway/src/main/resources/`. `jwt.secret` must be the same Base64 value in `auth-service`
   (which signs the tokens) and `gateway` (which verifies them); make one with `openssl rand -base64 32`.
3. **Build everything** from the repo root:
   ```bash
   mvn clean install
   ```
4. **Run a service.** Open its `*Application.java` in VS Code and click **Run**, or:
   ```bash
   mvn -pl services/booking-engine spring-boot:run
   ```
   On startup Flyway runs any new files in that service's `db/migration` folder.
5. **Seed data.** Once the migrations have created the tables, run `db/seed.sql` in TablePlus
   (or `psql -d campusdb -f db/seed.sql`).
6. **Start the frontend.**
   ```bash
   cd frontend && npm install && npm start   # http://localhost:4200
   ```

## Dev accounts (from `db/seed.sql`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `facilities.admin@cis.asu.edu.eg` | `Admin@2026` |
| Faculty | `mona.abdelaziz@cis.asu.edu.eg` | `Campus@2026` |
| Student | `ahmed.mostafa@cis.asu.edu.eg` | `Campus@2026` |

## Status

Backend: every endpoint in SRS section 5 is implemented, including the gateway aggregations (`/api/dashboard`,
facility availability), notifications with optional SMTP email, 24-hour booking reminders and the `.ics` export.
Frontend: every page from SRS section 4 is built against the contracts in `frontend/README.md`.

- Requirements: `docs/SRS.md`
- Why / what / done for the last phase: `docs/intent.md`, exact behaviour: `docs/spec.md`, build order: `docs/plan.md`
- Conventions for AI-assisted work: `CLAUDE.md`; task backlog in ClickUp (space **Smart Campus**)

### Optional: real email

Alerts always appear on the dashboard. To also email them, fill the `spring.mail` block in
`services/notification-service/src/main/resources/application-local.yml` (template in the `.example` next to it,
e.g. a Gmail app password) and set `notifications.email.enabled: true`. With it off, the service logs the email instead.

### Bonus: Campus Assistant chatbot

A chat panel (the "Ask the assistant" button on every page) that answers facility availability and event
questions from live data. It needs a free Groq API key:

1. Create one at https://console.groq.com/keys.
2. Copy `services/chatbot-service/src/main/resources/application-local.yml.example` to `application-local.yml`
   and paste the key (or `export GROQ_API_KEY=gsk_...` before starting the service).
3. Run `ChatbotServiceApplication` (port 5005) next to the other services.

Without a key the service still starts; `/api/chat` answers 503 "isn't configured yet". Details: `docs/spec.md` §9.

## Hosted demo (Render)

`render.yaml` is a Render Blueprint that deploys everything on free instances: Postgres (`campusdb`), the
gateway, the five services (Docker images from `deploy/Dockerfile.*`) and the Angular app as a static site.
Docker is used only there; local development stays native as described above.

- Config comes from environment variables that override `application.yml` (e.g. `SERVER_PORT`,
  `SPRING_DATASOURCE_*`, `SERVICES_CATALOGURL`, `JWT_SECRET`); the gateway's route URIs and CORS origin read
  `${AUTH_SERVICE_URL:...}`, `${CORS_ALLOWED_ORIGINS:...}` etc., which default to the localhost values.
- On the first deploy the gateway container loads `db/seed.sql` once all services have migrated (`deploy/start.sh`).
- Free services sleep after 15 minutes idle; the first request afterwards can take a minute or two.
