# Smart Campus Platform — Software Requirements Specification

Source of truth for implementation. Live version: https://claude.ai/artifact/3i3WQG1Kd5fFxMEQwQ755n (as of 11 Nov 2026).

## 1. Introduction

**Purpose.** Defines what the Smart Campus Platform must do and how it is structured, for the Reusable
Software Architecture course project (UEL / Ain Shams University, FCIS).

**Scope.** A web-services-based web app where students and faculty discover campus events, book study
rooms and labs, register for workshops and track their reservations. Admins manage spaces, event schedules
and resource availability. Every admin and user function is a REST web service consumed by one composing
application (the gateway). Out of scope: payments, mobile apps, real university SSO.

**Deadline:** end of week 13.

## 2. Overall description

### 2.1 User roles

| Role | Can do |
| --- | --- |
| Student | Register/login, search facilities and events, book rooms, register for events, view/cancel own bookings, receive notifications |
| Faculty | Same as Student (role stored at registration) |
| Admin | Manage facilities, equipment, events and speakers; view all bookings. Never self-registered (seeded) |

### 2.2 Operating environment

| Component | Technology |
| --- | --- |
| Backend services + gateway | C# on .NET 10, ASP.NET Core Web API (REST, controllers) |
| Frontend | Angular 22 (standalone, zoneless) + Tailwind CSS 4 + Spartan/ng; FullCalendar 7 for the booking calendar |
| Database | PostgreSQL 17 via Entity Framework Core (Npgsql) |
| Local orchestration | .NET Aspire AppHost |
| Dev machine | macOS Apple Silicon, VS Code + C# Dev Kit, no Docker |

### 2.3 Constraints

- All admin and user functions are web services consumed through the gateway.
- Core modules (Auth, Facility Catalog, Booking Engine, Notification) are structured for reuse.
- The brief names MS SQL Server; PostgreSQL is used but kept portable (no provider-specific SQL in code).
- The frontend calls only the gateway, never a service directly.

## 3. Architecture

```
Angular (4200) ──HTTP + JWT──▶ API Gateway (5000) ──REST/JSON──▶ AuthService          (5001)
                               YARP routing                     FacilityCatalog      (5002)
                               aggregation                      BookingEngine        (5003) ──▶ NotificationService
                               JWT validation, CORS             NotificationService  (5004)
                                                                        │
                                                         PostgreSQL "campusdb" (each service owns its tables)
```

| Project | Port | Responsibility |
| --- | --- | --- |
| Gateway | 5000 | Single entry point: YARP routing, aggregated endpoints, JWT validation, CORS |
| AuthService | 5001 | Registration, login, JWT issuing, roles |
| FacilityCatalog | 5002 | Facilities, equipment, events, speakers, search |
| BookingEngine | 5003 | Reservations, registrations, conflict checks, calendar export |
| NotificationService | 5004 | Email and dashboard alerts, reminders |
| Shared | — | Service names and contracts reused by services and gateway |
| SmartCampus.ServiceDefaults | — | Health checks, telemetry, service discovery, resilient HttpClients |
| SmartCampus.AppHost | — | Aspire: starts everything with one command |

Design decisions: one project/process per service; gateway as BFF; synchronous REST between services;
a service reads/writes only its own tables and gets other data through the owning service's API;
relational DB for transactional double-booking protection.

## 4. Functional requirements

### 4.1 Admin functions (4 marks)

| ID | Requirement | Service |
| --- | --- | --- |
| FR-A1 | Add, edit, delete, view facilities/equipment: title, building, location, capacity, type (Room/Lab/Equipment), status (Available/Maintenance) | Facility Catalog |
| FR-A2 | A facility in Maintenance accepts no new bookings | Facility Catalog |
| FR-A3 | Add, edit, delete, view events: title, description, category, building, location, start, end, capacity, status | Facility Catalog |
| FR-A4 | Manage each event's speakers (category is a text field on the event, no table) | Facility Catalog |
| FR-A5 | On event schedule change or cancellation, notify every registered user | Facility Catalog → Notification |
| FR-A6 | View all bookings and registrations, filter by facility, event, date | Booking Engine |

### 4.2 User functions (10 marks)

| ID | Requirement | Service |
| --- | --- | --- |
| FR-U1 | Register: name, university ID, email, role (Student/Faculty), password (stored hashed, BCrypt) | Auth |
| FR-U2 | Log in → JWT used on all later requests; log out | Auth |
| FR-U3 | Search/filter facilities by keyword, type, building, availability | Facility Catalog |
| FR-U4 | Search/filter events by keyword, date range, category, building | Facility Catalog |
| FR-U5 | Reserve an available facility for a time slot; reject overlaps | Booking Engine |
| FR-U6 | Register for an event; reject when full or already registered | Booking Engine |
| FR-U7 | View own active and past bookings and registrations | Booking Engine |
| FR-U8 | Cancel an upcoming booking or registration; past ones cannot be cancelled | Booking Engine |
| FR-U9 | Notifications on confirmation, cancellation, reminder, schedule change — email + dashboard alerts | Notification |
| FR-U10 | Mark dashboard alerts as read | Notification |
| FR-U11 | Export bookings and registrations as iCalendar (.ics) | Booking Engine |

### 4.3 Booking rules

1. A booking has a facility, a user, a start and an end; end > start.
2. Two Confirmed bookings of the same facility must not overlap (touching edges are allowed).
3. The overlap check and the insert run in ONE serializable database transaction.
4. Facilities in Maintenance cannot be booked.
5. Event registration is rejected when active registrations = event capacity.
6. A reminder is sent a set time (24 h) before each booking starts.

### 4.4 Application composition (1 mark)

| ID | Requirement |
| --- | --- |
| FR-C1 | The gateway is the only entry point for the frontend |
| FR-C2 | The gateway routes to the four services (YARP reverse proxy) |
| FR-C3 | The gateway exposes aggregated endpoints combining several services (dashboard, facility availability) |
| FR-C4 | The gateway validates the JWT and applies CORS for the Angular origin |

## 5. API specification (paths as exposed by the gateway)

JSON in/out. Admin = JWT with Admin role. All others except register/login need any valid JWT.

| Method | Path | Purpose | Access | Req |
| --- | --- | --- | --- | --- |
| POST | /api/auth/register | Create account | Public | FR-U1 |
| POST | /api/auth/login | Return JWT | Public | FR-U2 |
| GET | /api/auth/me | Current user | User | FR-U2 |
| GET | /api/facilities?q=&type=&building= | Search facilities | User | FR-U3 |
| GET | /api/facilities/{id} | Facility details | User | FR-A1 |
| POST / PUT / DELETE | /api/facilities[/{id}] | Manage facilities, set status | Admin | FR-A1, FR-A2 |
| GET | /api/events?q=&category=&building=&from=&to= | Search events | User | FR-U4 |
| GET | /api/events/{id} | Event with speakers | User | FR-A3 |
| POST / PUT / DELETE | /api/events[/{id}] | Manage events | Admin | FR-A3, FR-A5 |
| GET, POST, PUT, DELETE | /api/events/{id}/speakers | Manage speakers | Admin (GET: User) | FR-A4 |
| POST | /api/bookings | Reserve a facility | User | FR-U5 |
| GET | /api/bookings/mine?status=active\|past | Own bookings + registrations | User | FR-U7 |
| DELETE | /api/bookings/{id} | Cancel own upcoming booking | User | FR-U8 |
| GET | /api/bookings?facilityId=&eventId=&date= | All bookings | Admin | FR-A6 |
| GET | /api/bookings/calendar.ics | Personal calendar | User | FR-U11 |
| POST | /api/registrations | Register for event | User | FR-U6 |
| DELETE | /api/registrations/{id} | Cancel registration | User | FR-U8 |
| POST | /api/notifications | Create + email (internal, service-to-service) | Internal | FR-U9, FR-A5 |
| GET | /api/notifications/mine?unread=true | Dashboard alerts | User | FR-U9 |
| PUT | /api/notifications/{id}/read | Mark read | User | FR-U10 |
| GET | /api/dashboard | Gateway aggregation: upcoming bookings + unread alerts | User | FR-C3 |
| GET | /api/facilities/{id}/availability?date= | Gateway aggregation: facility + that day's bookings | User | FR-C3 |

Errors: 400 invalid input · 401 missing/invalid JWT · 403 wrong role · 404 not found ·
409 booking conflict / event full / already registered · 503 downstream service unavailable (gateway).

## 6. Data model

Seven entities; table and column names match `db/schema.sql` exactly (EF Core Npgsql defaults: PascalCase,
table name = DbSet name). Enums stored as strings.

| Entity (table) | Attributes | Owner |
| --- | --- | --- |
| User (Users) | Id, Name, UniversityId (unique), Email (unique), PasswordHash, Role (Student/Faculty/Admin), CreatedAt | Auth |
| Facility (Facilities) | Id, Title, Building, Location, Capacity, Type (Room/Lab/Equipment), Status (Available/Maintenance) | Facility Catalog |
| Event (Events) | Id, Title, Description, Category, Building, Location, StartTime, EndTime, Capacity, Status (Scheduled/Changed/Cancelled) | Facility Catalog |
| Speaker (Speakers) | Id, EventId (FK → Events, cascade), Name, Affiliation, Bio | Facility Catalog |
| Booking (Bookings) | Id, UserId, FacilityId, StartTime, EndTime, Status (Confirmed/Cancelled), CreatedAt | Booking Engine |
| Registration (Registrations) | Id, UserId, EventId, Status (Registered/Cancelled), CreatedAt; unique (UserId, EventId) where Registered | Booking Engine |
| Notification (Notifications) | Id, UserId, Type (Confirmation/Reminder/ScheduleChange/Cancellation), Message, IsRead, CreatedAt | Notification |

Events and Facilities are independent (no FK). IDs crossing services (UserId, FacilityId, EventId) have no
FK and are validated through the owning service's API.

## 7. Non-functional requirements

| ID | Attribute | Requirement |
| --- | --- | --- |
| NFR-1 | Reusability | Each service has its own project, port and OpenAPI contract, usable without the gateway |
| NFR-2 | Modifiability | Frontend depends only on gateway paths; DB provider swappable via EF Core |
| NFR-3 | Performance | Search/dashboard < 500 ms at the gateway for 50 concurrent users; aggregation calls run in parallel |
| NFR-4 | Availability | Notification failure must not fail a booking; gateway returns 503 when a required service is down |
| NFR-5 | Security | BCrypt hashes, JWT on protected endpoints, role-checked admin endpoints, CORS limited to Angular origin |
| NFR-6 | Data integrity | No double booking, enforced in a DB transaction |
| NFR-7 | Usability | Responsive UI (desktop and mobile widths) |
| NFR-8 | Observability | Logs and traces visible in the Aspire dashboard |

## 8. Bonus

- **Creative UI (2 marks):** soft raised style — rounded controls, layered shadows on cards and primary actions, flatter tables/forms.
- **Campus Assistant Chatbot (5 marks):** own service, `POST /api/chat`, LLM with tool calls to the availability and events endpoints (FR-B1 availability questions, FR-B2 event FAQs, FR-B3 service).
