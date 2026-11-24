import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarArrowDown, lucideCalendarDays, lucideHistory } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { Observable } from 'rxjs';
import { BookingApi } from '../../../core/api/booking.api';
import { MyItem } from '../../../core/models';
import { errorMessage } from '../../../core/util/errors';
import { formatRange, isFuture } from '../../../core/util/time';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { MyItemRow } from '../../../shared/my-item-row';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';

type Tab = 'active' | 'past';

/**
 * FR-U7: your bookings and registrations, upcoming and past, in one list.
 * FR-U8: cancel anything that hasn't started. FR-U11: download them all as an .ics calendar.
 */
@Component({
  selector: 'app-my-bookings-page',
  imports: [
    RouterLink,
    NgIcon,
    HlmButton,
    PageHeader,
    MyItemRow,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    ListSkeleton,
  ],
  providers: [provideIcons({ lucideCalendarArrowDown, lucideCalendarDays, lucideHistory })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-bookings-page.html',
  styleUrl: './my-bookings-page.css',
})
export class MyBookingsPage {
  private readonly api = inject(BookingApi);
  private readonly router = inject(Router);

  /** ?tab=past (query param input) */
  readonly tabParam = input<string>(undefined, { alias: 'tab' });
  protected readonly tab = computed<Tab>(() => (this.tabParam() === 'past' ? 'past' : 'active'));
  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'active', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
  ];

  protected readonly items = rxResource({
    params: () => this.tab(),
    stream: ({ params }) => this.api.mine(params),
  });

  protected readonly toCancel = signal<MyItem | null>(null);
  protected readonly cancelling = signal(false);
  protected readonly downloading = signal(false);

  protected readonly cancelDescription = computed(() => {
    const item = this.toCancel();
    if (!item) return '';
    const what =
      item.kind === 'BOOKING'
        ? 'The slot will be freed for others.'
        : 'Your seat will go to someone else.';
    return `${item.title}, ${formatRange(item.startTime, item.endTime)}. ${what}`;
  });

  /** Past items can't be cancelled (FR-U8); the server also refuses with 400 */
  protected canCancel(item: MyItem): boolean {
    return this.tab() === 'active' && item.status !== 'Cancelled' && isFuture(item.startTime);
  }

  protected setTab(tab: Tab, focus = false): void {
    void this.router.navigate([], {
      queryParams: { tab: tab === 'past' ? 'past' : null },
      replaceUrl: true,
    });
    if (focus) queueMicrotask(() => document.getElementById(`tab-${tab}`)?.focus());
  }

  protected cancel(): void {
    const item = this.toCancel();
    if (!item) return;
    this.cancelling.set(true);
    const request: Observable<void> =
      item.kind === 'BOOKING'
        ? this.api.cancelBooking(item.id)
        : this.api.cancelRegistration(item.id);
    request.subscribe({
      next: () => {
        this.cancelling.set(false);
        this.toCancel.set(null);
        toast.success(item.kind === 'BOOKING' ? 'Booking cancelled' : 'Registration cancelled', {
          description: item.title,
        });
        this.items.reload();
      },
      error: (err) => {
        this.cancelling.set(false);
        toast.error('Couldn’t cancel', { description: errorMessage(err) });
      },
    });
  }

  /** The .ics needs the JWT, so it's downloaded with HttpClient and saved from a Blob URL */
  protected downloadCalendar(): void {
    this.downloading.set(true);
    this.api.calendar().subscribe({
      next: (blob) => {
        this.downloading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'smart-campus.ics';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        this.downloading.set(false);
        toast.error('Couldn’t create the calendar file', { description: errorMessage(err) });
      },
    });
  }
}
