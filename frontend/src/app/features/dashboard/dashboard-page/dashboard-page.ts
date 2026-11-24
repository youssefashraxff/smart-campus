import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideBuilding2,
  lucideCalendarDays,
  lucideCloudOff,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { AlertsStore } from '../../../core/alerts.store';
import { NotificationApi } from '../../../core/api/notification.api';
import { AuthStore } from '../../../core/auth/auth.store';
import { CampusNotification } from '../../../core/models';
import { errorMessage } from '../../../core/util/errors';
import { CAMPUS_TZ, formatLongDay } from '../../../core/util/time';
import { AlertRow } from '../../../shared/alert-row';
import { MyItemRow } from '../../../shared/my-item-row';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';

/**
 * The first screen after sign-in. One call to the gateway's GET /api/dashboard (FR-C3) returns
 * upcoming bookings and unread alerts together. If one service is down, its section says so and the
 * other section still shows (NFR-4).
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    NgIcon,
    HlmButton,
    PageHeader,
    MyItemRow,
    AlertRow,
    EmptyState,
    ErrorState,
    ListSkeleton,
  ],
  providers: [
    provideIcons({ lucideBuilding2, lucideCalendarDays, lucideArrowRight, lucideCloudOff }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage {
  private readonly api = inject(NotificationApi);
  private readonly auth = inject(AuthStore);
  private readonly alertsStore = inject(AlertsStore);

  protected readonly today = formatLongDay(new Date().toISOString());
  protected readonly dashboard = rxResource({ stream: () => this.api.dashboard() });

  /** Alerts marked read on this page disappear from the "unread" list straight away */
  private readonly readIds = signal<Set<number>>(new Set());
  protected readonly marking = signal<number | null>(null);

  protected readonly alerts = computed(() =>
    this.dashboard.hasValue()
      ? this.dashboard.value().unreadAlerts.filter((a) => !this.readIds().has(a.id))
      : [],
  );
  protected readonly unreadCount = computed(() =>
    this.dashboard.hasValue()
      ? Math.max(0, this.dashboard.value().unreadCount - this.readIds().size)
      : 0,
  );

  protected readonly greeting = computed(() => {
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: CAMPUS_TZ,
        hour: 'numeric',
        hour12: false,
      }).format(new Date()),
    );
    const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${part}, ${this.auth.firstName()}`;
  });

  protected markRead(alert: CampusNotification): void {
    this.marking.set(alert.id);
    this.api.markRead(alert.id).subscribe({
      next: () => {
        this.marking.set(null);
        this.readIds.update((ids) => new Set(ids).add(alert.id));
        this.alertsStore.decrement();
      },
      error: (err) => {
        this.marking.set(null);
        toast.error('Couldn’t mark that alert as read', { description: errorMessage(err) });
      },
    });
  }
}
