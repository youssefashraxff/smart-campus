import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  Availability,
  CampusEvent,
  CampusEventDetail,
  EventRequest,
  Facility,
  FacilityRequest,
  FacilityType,
  Speaker,
  SpeakerRequest,
} from '../models';
import { api, queryParams } from './api';

export interface FacilityFilters {
  q?: string;
  type?: FacilityType | '';
  building?: string;
}

export interface EventFilters {
  q?: string;
  category?: string;
  building?: string;
  from?: string;
  to?: string;
}

/** Facility Catalog service (port 5002), reached through /api/facilities and /api/events */
@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);

  // ---- Facilities (FR-U3, FR-A1, FR-A2) ----

  searchFacilities(filters: FacilityFilters = {}) {
    return this.http.get<Facility[]>(api('/facilities'), { params: queryParams({ ...filters }) });
  }

  getFacility(id: number) {
    return this.http.get<Facility>(api(`/facilities/${id}`));
  }

  createFacility(body: FacilityRequest) {
    return this.http.post<Facility>(api('/facilities'), body);
  }

  updateFacility(id: number, body: FacilityRequest) {
    return this.http.put<Facility>(api(`/facilities/${id}`), body);
  }

  deleteFacility(id: number) {
    return this.http.delete<void>(api(`/facilities/${id}`));
  }

  /** Gateway aggregation (FR-C3): the facility plus that day's booked slots */
  availability(id: number, date: string) {
    return this.http.get<Availability>(api(`/facilities/${id}/availability`), {
      params: queryParams({ date }),
    });
  }

  // ---- Events (FR-U4, FR-A3, FR-A5) ----

  searchEvents(filters: EventFilters = {}) {
    return this.http.get<CampusEvent[]>(api('/events'), { params: queryParams({ ...filters }) });
  }

  getEvent(id: number) {
    return this.http.get<CampusEventDetail>(api(`/events/${id}`));
  }

  createEvent(body: EventRequest) {
    return this.http.post<CampusEvent>(api('/events'), body);
  }

  /** Changing the time or cancelling notifies every registered user on the server side (FR-A5) */
  updateEvent(id: number, body: EventRequest) {
    return this.http.put<CampusEvent>(api(`/events/${id}`), body);
  }

  deleteEvent(id: number) {
    return this.http.delete<void>(api(`/events/${id}`));
  }

  // ---- Speakers (FR-A4) ----

  listSpeakers(eventId: number) {
    return this.http.get<Speaker[]>(api(`/events/${eventId}/speakers`));
  }

  addSpeaker(eventId: number, body: SpeakerRequest) {
    return this.http.post<Speaker>(api(`/events/${eventId}/speakers`), body);
  }

  updateSpeaker(eventId: number, speakerId: number, body: SpeakerRequest) {
    return this.http.put<Speaker>(api(`/events/${eventId}/speakers/${speakerId}`), body);
  }

  deleteSpeaker(eventId: number, speakerId: number) {
    return this.http.delete<void>(api(`/events/${eventId}/speakers/${speakerId}`));
  }
}
