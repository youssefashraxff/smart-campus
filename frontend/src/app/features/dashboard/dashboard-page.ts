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
import { AlertsStore } from '../../core/alerts.store';
import { NotificationApi } from '../../core/api/notification.api';
import { AuthStore } from '../../core/auth/auth.store';
import { CampusNotification } from '../../core/models';
import { errorMessage } from '../../core/util/errors';
import { CAMPUS_TZ, formatLongDay } from '../../core/util/time';
import { AlertRow } from '../../shared/alert-row';
import { MyItemRow } from '../../shared/my-item-row';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';

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
  template: `
    <app-page-header [eyebrow]="today" [title]="greeting()">
      <a hlmBtn variant="outline" routerLink="/events">
        <ng-icon name="lucideCalendarDays" />
        Browse events
      </a>
      <a hlmBtn routerLink="/facilities">
        <ng-icon name="lucideBuilding2" />
        Book a room
      </a>
    </app-page-header>

    @if (dashboard.error()) {
      <div class="surface-raised mt-8">
        <app-error-state
          [error]="dashboard.error()"
          title="Couldn’t load your overview"
          (retry)="dashboard.reload()"
        />
      </div>
    } @else {
      <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <!-- Coming up -->
        <section class="surface-raised min-w-0 p-5 sm:p-6" aria-labelledby="upcoming-title">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 id="upcoming-title" class="text-lg font-semibold">Coming up</h2>
            <a
              routerLink="/bookings"
              class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              All bookings <ng-icon name="lucideArrowRight" size="15" aria-hidden="true" />
            </a>
          </div>

          @if (!dashboard.hasValue()) {
            <app-list-skeleton [rows]="3" label="Loading upcoming bookings" />
          } @else if (dashboard.value().upcomingStatus === 'unavailable') {
            <ng-container *ngTemplateOutlet="unavailable; context: { $implicit: 'Bookings' }" />
          } @else if (dashboard.value().upcoming.length === 0) {
            <app-empty-state
              icon="lucideCalendarDays"
              title="Nothing booked yet"
              description="Reserve a study room or lab, or sign up for a workshop, and it shows up here."
            >
              <a hlmBtn variant="outline" routerLink="/facilities">Find a room</a>
            </app-empty-state>
          } @else {
            <ul class="divide-border -my-4 divide-y" role="list">
              @for (item of dashboard.value().upcoming; track item.kind + item.id) {
                <li>
                  <app-my-item-row [item]="item" [showStatus]="false" [showRelative]="true" />
                </li>
              }
            </ul>
          }
        </section>

        <!-- Alerts -->
        <section class="surface-raised min-w-0 p-5 sm:p-6" aria-labelledby="alerts-title">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 id="alerts-title" class="flex items-center gap-2 text-lg font-semibold">
              Alerts
              @if (dashboard.hasValue() && unreadCount() > 0) {
                <span
                  class="bg-sun tabular grid h-6 min-w-6 place-items-center rounded-full px-2 text-xs font-semibold"
                >
                  {{ unreadCount() }}<span class="sr-only">&nbsp;unread</span>
                </span>
              }
            </h2>
            <a
              routerLink="/alerts"
              class="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              See all <ng-icon name="lucideArrowRight" size="15" aria-hidden="true" />
            </a>
          </div>

          @if (!dashboard.hasValue()) {
            <app-list-skeleton [rows]="3" label="Loading alerts" />
          } @else if (dashboard.value().alertsStatus === 'unavailable') {
            <ng-container *ngTemplateOutlet="unavailable; context: { $implicit: 'Alerts' }" />
          } @else if (alerts().length === 0) {
            <app-empty-state
              icon="lucideBellRing"
              title="You’re all caught up"
              description="Confirmations, reminders and schedule changes appear here."
            />
          } @else {
            <ul class="divide-border -my-3.5 divide-y" role="list">
              @for (alert of alerts(); track alert.id) {
                <li>
                  <app-alert-row
                    [alert]="alert"
                    [busy]="marking() === alert.id"
                    (markRead)="markRead($event)"
                  />
                </li>
              }
            </ul>
          }
        </section>
      </div>
    }

    <ng-template #unavailable let-section>
      <div
        role="status"
        class="bg-muted/70 text-muted-foreground flex items-start gap-3 rounded-xl p-4 text-sm"
      >
        <ng-icon name="lucideCloudOff" size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          <span class="text-foreground font-medium">{{ section }} are unavailable right now.</span>
          The rest of the page still works. Refresh in a minute to try again.
        </p>
      </div>
    </ng-template>
  `,
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
