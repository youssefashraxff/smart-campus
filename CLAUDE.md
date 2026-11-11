# Smart Campus — guide for Claude Code

University course project (Reusable Software Architecture). Requirements live in `docs/SRS.md`; every
feature maps to an ID there (FR-A*, FR-U*, FR-C*, NFR-*). Read it before implementing anything.

The repo is a skeleton: projects, folders, ports and configs exist, but there is no feature code yet.
The student must be able to explain every line to a TA, so prefer clear, conventional code over clever code,
and explain non-obvious decisions in your summary.

## Stack

- .NET 10, ASP.NET Core Web API with **controllers** (not minimal APIs), C# latest, nullable enabled
  (shared settings in `Directory.Build.props`, solution file `SmartCampus.slnx`)
- EF Core + Npgsql on native PostgreSQL 17, database `campusdb` (no Docker anywhere)
- .NET Aspire AppHost for local orchestration; YARP in the gateway
- Angular 22 (standalone components, signals, zoneless) + Tailwind CSS 4 + Spartan/ng helm components in
  `frontend/libs/ui` (add more with `npx ng g @spartan-ng/cli:ui <name>`) + FullCalendar 7 (`fullcalendar`, `@fullcalendar/angular`)

## Services and names

| Project | Port | Aspire / service-discovery name |
| --- | --- | --- |
| src/Gateway | 5000 | gateway |
| src/AuthService | 5001 | auth |
| src/FacilityCatalog | 5002 | catalog |
| src/BookingEngine | 5003 | bookings |
| src/NotificationService | 5004 | notifications |

Ports are already in each `Properties/launchSettings.json`. Connection string name: `campusdb`.

## Rules

- **Frontend talks only to the gateway** (`http://localhost:5000/api`, see `frontend/src/environments`).
- **Data ownership:** each service has its own DbContext mapping only its own tables, and its own migrations
  history table (`__EFMigrationsHistory_<ServiceName>`). Cross-service IDs have no foreign keys; validate them
  by calling the owning service over HTTP (via service discovery, e.g. `http://catalog`).
- **Table/column names must match `db/schema.sql`** (EF Npgsql defaults: PascalCase, table = DbSet name,
  enums stored as strings) so `db/seed.sql` loads into the migrated database unchanged.
- **Portable SQL only:** no Npgsql-specific functions (no `EF.Functions.ILike`, no jsonb/arrays). Switching to
  SQL Server must only require changing `UseNpgsql` to `UseSqlServer`.
- **Booking overlap rule** (SRS 4.3): check + insert in one serializable transaction.
- **Availability (NFR-4):** a failing Notification call must never fail a booking or registration.
- Reusable request/response contracts and service names go in `src/Shared`.
- Errors follow SRS 5 status codes (400/401/403/404/409/503).
- Secrets: never commit real passwords; connection strings use the placeholder `CHANGE_ME` (use `dotnet user-secrets` locally).
- UI style: soft raised look — `rounded-2xl`/`rounded-3xl`, layered shadows on cards and primary buttons,
  flatter tables and forms.

## Verify before saying a phase is done

```bash
dotnet build SmartCampus.slnx
cd frontend && npx ng build
```

When a phase touches the database, also add/update migrations
(`dotnet ef migrations add <Name> --project src/<Service>`) and confirm `db/seed.sql` still loads.

## Dev accounts (db/seed.sql)

Admin `facilities.admin@cis.asu.edu.eg` / `Admin@2026` · Student `ahmed.mostafa@cis.asu.edu.eg` / `Campus@2026`.
