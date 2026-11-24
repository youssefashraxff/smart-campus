import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { BookingApi } from '../../core/api/booking.api';
import { CatalogApi } from '../../core/api/catalog.api';
import { formatDateTime, formatRange } from '../../core/util/time';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

/**
 * FR-A6: every booking and registration, filtered by facility, event and day.
 * The Booking Engine returns ids only (it doesn't own titles), so the names come from the catalog
 * lists loaded here. User names live in Auth and aren't joined, so users show as their id.
 */
@Component({
  selector: 'app-admin-bookings-page',
  imports: [HlmButton, PageHeader, StatusBadge, EmptyState, ErrorState, ListSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      eyebrow="Administration"
      title="All bookings"
      description="Check who has reserved what, for example before putting a lab into maintenance."
    />

    <div
      class="surface-flat mt-6 grid gap-3 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:p-4"
      role="search"
    >
      <select
        class="select-native"
        aria-label="Facility"
        (change)="facilityId.set(toId($any($event.target).value))"
      >
        <option value="">All facilities</option>
        @for (f of facilityList(); track f.id) {
          <option [value]="f.id" [selected]="f.id === facilityId()">{{ f.title }}</option>
        }
      </select>
      <select
        class="select-native"
        aria-label="Event"
        (change)="eventId.set(toId($any($event.target).value))"
      >
        <option value="">All events</option>
        @for (e of eventList(); track e.id) {
          <option [value]="e.id" [selected]="e.id === eventId()">{{ e.title }}</option>
        }
      </select>
      <input
        type="date"
        class="select-native tabular bg-none"
        aria-label="Day"
        [value]="date()"
        (change)="date.set($any($event.target).value)"
      />
      <button
        hlmBtn
        variant="ghost"
        class="h-10"
        (click)="reset()"
        [disabled]="!facilityId() && !eventId() && !date()"
      >
        Reset
      </button>
    </div>

    @if (data.error()) {
      <div class="surface-flat mt-6">
        <app-error-state [error]="data.error()" (retry)="data.reload()" />
      </div>
    } @else if (!data.hasValue()) {
      <div class="surface-flat mt-6 p-4">
        <app-list-skeleton [rows]="5" label="Loading bookings" />
      </div>
    } @else {
      <section class="mt-8" aria-labelledby="fb-title">
        <h2 id="fb-title" class="mb-3 flex items-baseline gap-2 text-base font-semibold">
          Facility bookings
          <span class="text-muted-foreground tabular text-sm font-normal">{{
            data.value().bookings.length
          }}</span>
        </h2>
        <div class="surface-flat overflow-hidden">
          @if (data.value().bookings.length === 0) {
            <app-empty-state title="No bookings" description="Nothing matches these filters." />
          } @else {
            <div class="overflow-x-auto">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Facility</th>
                    <th scope="col">When</th>
                    <th scope="col" class="max-sm:hidden">User</th>
                    <th scope="col" class="max-md:hidden">Booked</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of data.value().bookings; track b.id) {
                    <tr>
                      <td class="font-medium">{{ facilityName(b.facilityId) }}</td>
                      <td class="tabular whitespace-nowrap">{{ range(b.startTime, b.endTime) }}</td>
                      <td class="tabular text-muted-foreground max-sm:hidden">#{{ b.userId }}</td>
                      <td class="tabular text-muted-foreground max-md:hidden">
                        {{ dateTime(b.createdAt) }}
                      </td>
                      <td><app-status-badge [status]="b.status" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>

      <section class="mt-8" aria-labelledby="reg-title">
        <h2 id="reg-title" class="mb-3 flex items-baseline gap-2 text-base font-semibold">
          Event registrations
          <span class="text-muted-foreground tabular text-sm font-normal">{{
            data.value().registrations.length
          }}</span>
        </h2>
        @if (date()) {
          <p class="text-muted-foreground mb-3 text-xs">
            The day filter applies to bookings only: registrations have no time of their own.
          </p>
        }
        <div class="surface-flat overflow-hidden">
          @if (data.value().registrations.length === 0) {
            <app-empty-state
              title="No registrations"
              description="Nothing matches these filters."
            />
          } @else {
            <div class="overflow-x-auto">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col" class="max-sm:hidden">User</th>
                    <th scope="col">Registered</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of data.value().registrations; track r.id) {
                    <tr>
                      <td class="font-medium">{{ eventName(r.eventId) }}</td>
                      <td class="tabular text-muted-foreground max-sm:hidden">#{{ r.userId }}</td>
                      <td class="tabular text-muted-foreground">{{ dateTime(r.createdAt) }}</td>
                      <td><app-status-badge [status]="r.status" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: `
    input[type='date'].bg-none {
      background-image: none;
      padding-right: 0.875rem;
    }
  `,
})
export class AdminBookingsPage {
  private readonly bookingApi = inject(BookingApi);
  private readonly catalog = inject(CatalogApi);

  protected readonly facilityId = signal<number | null>(null);
  protected readonly eventId = signal<number | null>(null);
  protected readonly date = signal('');

  protected readonly data = rxResource({
    params: () => ({ facilityId: this.facilityId(), eventId: this.eventId(), date: this.date() }),
    stream: ({ params }) => this.bookingApi.all(params),
  });

  private readonly facilities = rxResource({ stream: () => this.catalog.searchFacilities() });
  private readonly events = rxResource({ stream: () => this.catalog.searchEvents() });
  protected readonly facilityList = computed(() =>
    this.facilities.hasValue() ? this.facilities.value() : [],
  );
  protected readonly eventList = computed(() =>
    this.events.hasValue() ? this.events.value() : [],
  );
  private readonly facilityNames = computed(
    () => new Map(this.facilityList().map((f) => [f.id, f.title])),
  );
  private readonly eventNames = computed(
    () => new Map(this.eventList().map((e) => [e.id, e.title])),
  );

  protected readonly range = formatRange;
  protected readonly dateTime = formatDateTime;

  protected facilityName(id: number): string {
    return this.facilityNames().get(id) ?? `Facility #${id}`;
  }

  protected eventName(id: number): string {
    return this.eventNames().get(id) ?? `Event #${id}`;
  }

  protected toId(value: string): number | null {
    return value ? Number(value) : null;
  }

  protected reset(): void {
    this.facilityId.set(null);
    this.eventId.set(null);
    this.date.set('');
  }
}
