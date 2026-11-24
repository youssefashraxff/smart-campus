import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CampusNotification, Dashboard } from '../models';
import { api, queryParams } from './api';

/** Notification service (port 5004) and the gateway's own /api/dashboard */
@Injectable({ providedIn: 'root' })
export class NotificationApi {
  private readonly http = inject(HttpClient);

  /** FR-U9. Newest first */
  mine(unreadOnly = false) {
    return this.http.get<CampusNotification[]>(api('/notifications/mine'), {
      params: queryParams({ unread: unreadOnly ? 'true' : null }),
    });
  }

  /** FR-U10 */
  markRead(id: number) {
    return this.http.put<void>(api(`/notifications/${id}/read`), null);
  }

  /** FR-C3. Upcoming bookings + unread alerts in one call; a down service gives an empty section */
  dashboard() {
    return this.http.get<Dashboard>(api('/dashboard'));
  }
}
