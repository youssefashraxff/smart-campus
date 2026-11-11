# Smart Campus — Event & Facility Booking Platform

Reusable Software Architecture course project (University of East London × Ain Shams University, FCIS).
Students and faculty discover campus events, book study rooms, labs and equipment, register for
workshops and track their reservations. Every function is a REST web service behind one API gateway.

## Architecture

```
Angular (4200) ──HTTP──▶ API Gateway (5000) ──▶ Auth Service          (5001)
                         YARP routing           Facility Catalog      (5002)
                         aggregation            Booking Engine        (5003)
                         CORS · JWT             Notification Service  (5004)
                                                        │
                                                PostgreSQL (campusdb)
```

| Project                           | Purpose                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| `src/Gateway`                     | Single entry point: YARP pass-through routes + aggregated endpoints (`/api/dashboard`) |
| `src/AuthService`                 | Registration, login, roles (Student, Faculty, Admin)                                   |
| `src/FacilityCatalog`             | Facilities, equipment, events, speakers, search                                        |
| `src/BookingEngine`               | Reservations with overlap checks, event registrations                                  |
| `src/NotificationService`         | Email + dashboard alerts                                                               |
| `src/Shared`                      | Contracts and service names reused across services                                     |
| `src/SmartCampus.ServiceDefaults` | Health checks, telemetry, service discovery, resilient HttpClients                     |
| `src/SmartCampus.AppHost`         | .NET Aspire: starts everything with one command                                        |
| `frontend`                        | Angular 22 + Tailwind CSS 4 + Spartan/ng + FullCalendar                                |
| `db`                              | `schema.sql` (reference) and `seed.sql` (initial FCIS data)                            |

## Prerequisites (macOS, Apple Silicon)

- .NET 10 SDK: `brew install --cask dotnet-sdk`
- Aspire CLI: `curl -sSL https://aspire.dev/install.sh | bash`
- EF Core tools: `dotnet tool install --global dotnet-ef`
- PostgreSQL 17: `brew install postgresql@17 && brew services start postgresql@17`
- Node.js 22+ for the frontend

## First run

1. **Database.** Create the database once (`psql postgres`, then `CREATE DATABASE campusdb;`), then replace `postgres@123` with your PostgreSQL password in:
   - `src/SmartCampus.AppHost/appsettings.json` (used when running through Aspire)
   - each service's `appsettings.Development.json` (used when running a service alone)
2. **Build.**
   ```bash
   dotnet build SmartCampus.slnx
   ```
3. **Create the tables** (one migration per service, each with its own history table):
   ```bash
   for s in AuthService FacilityCatalog BookingEngine NotificationService; do
     dotnet ef migrations add Initial --project src/$s
     dotnet ef database update --project src/$s
   done
   ```
4. **Seed data.** Run `db/seed.sql` in TablePlus (or `psql -d campusdb -f db/seed.sql`).
5. **Start the backend.**
   ```bash
   aspire run          # or: dotnet run --project src/SmartCampus.AppHost
   ```
   The Aspire dashboard opens with every service, its logs and traces.
6. **Start the frontend.**
   ```bash
   cd frontend && npm install && npm start   # http://localhost:4200
   ```

Each service also runs on its own (`dotnet run --project src/FacilityCatalog`) with Swagger at
`http://localhost:<port>/swagger`.

## Dev accounts (from `db/seed.sql`)

| Role    | Email                             | Password      |
| ------- | --------------------------------- | ------------- |
| Admin   | `facilities.admin@cis.asu.edu.eg` | `Admin@2026`  |
| Faculty | `mona.abdelaziz@cis.asu.edu.eg`   | `Campus@2026` |
| Student | `ahmed.mostafa@cis.asu.edu.eg`    | `Campus@2026` |

## Status

Implemented: service structure, gateway routing and dashboard aggregation, CORS, facility/event
search, booking creation with transactional overlap check, booking cancel, notifications list/read,
register/login with BCrypt. Until JWT is added, the caller's user id is passed in an `X-User-Id` header.

Remaining work is tracked in ClickUp (space **Smart Campus**).
