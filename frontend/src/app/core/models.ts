// JSON contracts between the Angular app and the gateway (SRS section 5).
// Each type mirrors a Java record. Where the backend record exists already, the source file is named;
// the others follow the ClickUp task descriptions and must keep the same field names when implemented.

// ---------- Auth (services/auth-service/.../dto) ----------

export type Role = 'Student' | 'Faculty' | 'Admin';

/** UserResponse.java */
export interface User {
  id: number;
  name: string;
  universityId: string;
  email: string;
  role: Role;
}

/** LoginRequest.java */
export interface LoginRequest {
  email: string;
  password: string;
}

/** RegisterRequest.java (Admin is never self-registered, SRS 2.1) */
export interface RegisterRequest {
  name: string;
  universityId: string;
  email: string;
  password: string;
  role: Exclude<Role, 'Admin'>;
}

/** AuthResponse.java */
export interface AuthResponse {
  token: string;
  user: User;
}

// ---------- Facility Catalog (shared/.../contracts, services/facility-catalog/.../dto) ----------

export type FacilityType = 'Room' | 'Lab' | 'Equipment';
export type FacilityStatus = 'Available' | 'Maintenance';

/** FacilityResponse.java */
export interface Facility {
  id: number;
  title: string;
  building: string;
  location: string;
  capacity: number;
  type: FacilityType;
  status: FacilityStatus;
}

/** FacilityRequest.java */
export type FacilityRequest = Omit<Facility, 'id'>;

export type EventStatus = 'Scheduled' | 'Changed' | 'Cancelled';

/** EventResponse.java. Times are ISO-8601 strings with an offset (OffsetDateTime). */
export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  building: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: EventStatus;
}

/** EventRequest.java */
export type EventRequest = Omit<CampusEvent, 'id'>;

/** SpeakerResponse.java */
export interface Speaker {
  id: number;
  name: string;
  affiliation: string;
  bio: string;
}

/** SpeakerRequest.java */
export type SpeakerRequest = Omit<Speaker, 'id'>;

/** EventDetailResponse (Search task): GET /api/events/{id} returns the event with its speakers */
export interface CampusEventDetail extends CampusEvent {
  speakers: Speaker[];
}

// ---------- Booking Engine ----------

export type BookingStatus = 'Confirmed' | 'Cancelled';
export type RegistrationStatus = 'Registered' | 'Cancelled';

/** BookingRequest (Reserve task) */
export interface BookingRequest {
  facilityId: number;
  startTime: string;
  endTime: string;
}

/** BookingResponse (Reserve task) */
export interface Booking {
  id: number;
  userId: number;
  facilityId: number;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

/** RegistrationResponse (Event registration task) */
export interface Registration {
  id: number;
  userId: number;
  eventId: number;
  status: RegistrationStatus;
  createdAt: string;
}

/** MyItemResponse (List mine task): bookings and registrations in one list */
export interface MyItem {
  kind: 'BOOKING' | 'REGISTRATION';
  id: number;
  title: string;
  building: string;
  location: string;
  startTime: string;
  endTime: string;
  status: BookingStatus | RegistrationStatus;
}

/** AdminBookingsResponse (Admin list task, FR-A6) */
export interface AdminBookings {
  bookings: Booking[];
  registrations: Registration[];
}

// ---------- Notification service ----------

export type NotificationType = 'Confirmation' | 'Reminder' | 'ScheduleChange' | 'Cancellation';

/** NotificationResponse (Notifications task). The DTO names the field isRead explicitly. */
export interface CampusNotification {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ---------- Gateway aggregation (FR-C3) ----------

export type SectionStatus = 'ok' | 'unavailable';

/** DashboardResponse (Gateway: /api/dashboard task) */
export interface Dashboard {
  upcoming: MyItem[];
  unreadAlerts: CampusNotification[];
  unreadCount: number;
  upcomingStatus: SectionStatus;
  alertsStatus: SectionStatus;
}

/**
 * Availability response (Gateway: facility availability task).
 * from/to are Cairo calendar dates, both inclusive; bookedSlots are the Confirmed bookings that overlap
 * that range, each listed once, with no user ids.
 */
export interface Availability {
  facility: Facility;
  from: string;
  to: string;
  bookedSlots: { startTime: string; endTime: string }[];
}

// ---------- Errors ----------

/** RFC 9457 ProblemDetail, as produced by shared/.../GlobalExceptionHandler.java */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}
