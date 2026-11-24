# Smart Campus — Event & Facility Booking Platform

Reusable Software Architecture course project (University of East London × Ain Shams University, FCIS).
Students and faculty discover campus events, book study rooms, labs and equipment, register for
workshops and track their reservations. Every function is a REST web service behind one API gateway.

## Architecture

```
Angular (4200) ──HTTP──▶ API Gateway (5000) ──▶ Auth Service          (5001)
                         Spring Cloud Gateway   Facility Catalog      (5002)
                         routing                Booking Engine        (5003)
                                                Notification Service  (5004)
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

Backend: skeleton plus the features merged so far. Frontend: every page from SRS section 4 is built against the
contracts in `frontend/README.md`; it works end to end as each backend endpoint lands. Requirements are in `docs/SRS.md`, conventions for AI-assisted work in
`CLAUDE.md`, and the task backlog in ClickUp (space **Smart Campus**).
