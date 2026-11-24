import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { BookingApi } from '../../../core/api/booking.api';
import { CatalogApi } from '../../../core/api/catalog.api';
import { formatDateTime, formatRange } from '../../../core/util/time';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';

/**
 * FR-A6: every booking and registration, filtered by facility, event and day.
 * The Booking Engine returns ids only (it doesn't own titles), so the names come from the catalog
 * lists loaded here. User names live in Auth and aren't joined, so users show as their id.
 */
@Component({
  selector: 'app-admin-bookings-page',
  imports: [HlmButton, PageHeader, StatusBadge, EmptyState, ErrorState, ListSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-bookings-page.html',
  styleUrl: './admin-bookings-page.css',
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
