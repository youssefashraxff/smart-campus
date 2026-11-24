import { inject, Injectable, signal } from '@angular/core';
import { NotificationApi } from './api/notification.api';

/**
 * The unread-alerts count shown in the navigation. Pages that mark alerts as read update it,
 * so the badge stays right without reloading the whole list.
 */
@Injectable({ providedIn: 'root' })
export class AlertsStore {
  private readonly api = inject(NotificationApi);
  readonly unreadCount = signal(0);

  refresh(): void {
    this.api.mine(true).subscribe({
      next: (alerts) => this.unreadCount.set(alerts.length),
      // The badge is a convenience: if the Notification service is down, just hide it (NFR-4)
      error: () => this.unreadCount.set(0),
    });
  }

  set(count: number): void {
    this.unreadCount.set(count);
  }

  decrement(): void {
    this.unreadCount.update((n) => Math.max(0, n - 1));
  }
}
