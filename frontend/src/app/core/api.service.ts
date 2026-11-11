import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { CampusEvent, Facility } from './models';

/** Single entry point to the backend: every call goes through the API gateway. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  searchFacilities(filters: { q?: string; type?: string; building?: string } = {}) {
    return this.http.get<Facility[]>(`${this.base}/facilities`, { params: toParams(filters) });
  }

  searchEvents(filters: { q?: string; category?: string; building?: string } = {}) {
    return this.http.get<CampusEvent[]>(`${this.base}/events`, { params: toParams(filters) });
  }
}

function toParams(filters: Record<string, string | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params = params.set(key, value);
  }
  return params;
}
