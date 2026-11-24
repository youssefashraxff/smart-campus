import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AdminBookings, Booking, BookingRequest, MyItem, Registration } from '../models';
import { api, queryParams } from './api';

export interface AdminBookingFilters {
  facilityId?: number | null;
  eventId?: number | null;
  date?: string;
}

/** Booking Engine service (port 5003), reached through /api/bookings and /api/registrations */
@Injectable({ providedIn: 'root' })
export class BookingApi {
  private readonly http = inject(HttpClient);

  /** FR-U5. 409 when the slot overlaps a confirmed booking or the facility is in maintenance */
  reserve(body: BookingRequest) {
    return this.http.post<Booking>(api('/bookings'), body);
  }

  /** FR-U7. "active" = upcoming or in progress, "past" = finished or cancelled */
  mine(status: 'active' | 'past') {
    return this.http.get<MyItem[]>(api('/bookings/mine'), { params: queryParams({ status }) });
  }

  /** FR-U8. Only upcoming bookings can be cancelled (400 otherwise) */
  cancelBooking(id: number) {
    return this.http.delete<void>(api(`/bookings/${id}`));
  }

  /** FR-U6. 409 when the event is full or you are already registered */
  register(eventId: number) {
    return this.http.post<Registration>(api('/registrations'), { eventId });
  }

  cancelRegistration(id: number) {
    return this.http.delete<void>(api(`/registrations/${id}`));
  }

  /** FR-U11. The .ics needs the JWT, so it is fetched as a Blob instead of opened as a link */
  calendar() {
    return this.http.get(api('/bookings/calendar.ics'), { responseType: 'blob' });
  }

  /** FR-A6 (admin) */
  all(filters: AdminBookingFilters) {
    return this.http.get<AdminBookings>(api('/bookings'), { params: queryParams({ ...filters }) });
  }
}
