import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalendarClock,
  lucideCircleCheck,
  lucideClock,
  lucideMapPin,
  lucideTicket,
  lucideUsers,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { BookingApi } from '../../../core/api/booking.api';
import { CatalogApi } from '../../../core/api/catalog.api';
import { errorMessage, problemOf, statusOf } from '../../../core/util/errors';
import { formatLongDay, formatTime, isFuture } from '../../../core/util/time';
import { ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';
import { Spinner } from '../../../shared/spinner';

/** An event with its speakers (FR-A3, FR-A4) and the Register action (FR-U6) */
@Component({
  selector: 'app-event-detail-page',
  imports: [Spinner, RouterLink, NgIcon, HlmButton, StatusBadge, ErrorState, ListSkeleton],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideClock,
      lucideMapPin,
      lucideUsers,
      lucideTicket,
      lucideCircleCheck,
      lucideCalendarClock,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-detail-page.html',
  styleUrl: './event-detail-page.css',
})
export class EventDetailPage {
  private readonly catalog = inject(CatalogApi);
  private readonly bookings = inject(BookingApi);

  readonly id = input.required({ transform: numberAttribute });

  protected readonly event = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.catalog.getEvent(params),
  });
  protected readonly busy = signal(false);
  protected readonly registered = signal(false);
  protected readonly registerError = signal<string | null>(null);

  protected readonly closedReason = computed(() => {
    if (!this.event.hasValue()) return null;
    const e = this.event.value();
    if (e.status === 'Cancelled') return 'This event was cancelled, so registration is closed.';
    if (!isFuture(e.startTime)) return 'This event has already started, so registration is closed.';
    return null;
  });

  protected readonly day = formatLongDay;
  protected readonly time = formatTime;

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter((p) => !/^(dr|eng|prof)\.?$/i.test(p))
      .slice(0, 2)
      .map((p) => p[0])
      .join('');
  }

  protected register(): void {
    this.busy.set(true);
    this.registerError.set(null);
    this.bookings.register(this.id()).subscribe({
      next: () => {
        this.busy.set(false);
        this.registered.set(true);
        toast.success('You’re registered', { description: this.event.value()?.title });
      },
      error: (err) => {
        this.busy.set(false);
        // 409 covers both "event full" and "already registered"; the server's detail says which
        if (statusOf(err) === 409 && /already/i.test(problemOf(err)?.detail ?? '')) {
          this.registered.set(true);
          return;
        }
        this.registerError.set(
          statusOf(err) === 409
            ? (problemOf(err)?.detail ?? 'This event is full.')
            : errorMessage(err),
        );
      },
    });
  }
}
