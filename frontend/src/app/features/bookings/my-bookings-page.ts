import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarArrowDown, lucideCalendarDays, lucideHistory } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { Observable } from 'rxjs';
import { BookingApi } from '../../core/api/booking.api';
import { MyItem } from '../../core/models';
import { errorMessage } from '../../core/util/errors';
import { formatRange, isFuture } from '../../core/util/time';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { MyItemRow } from '../../shared/my-item-row';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';

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
  template: `
    <app-page-header
      title="My bookings"
      description="Rooms you’ve reserved and events you’ve registered for."
    >
      <button hlmBtn variant="outline" (click)="downloadCalendar()" [disabled]="downloading()">
        <ng-icon name="lucideCalendarArrowDown" />
        {{ downloading() ? 'Preparing…' : 'Add to calendar' }}
      </button>
    </app-page-header>

    <div
      class="bg-muted mt-6 inline-flex gap-1 rounded-xl p-1"
      role="tablist"
      aria-label="Booking time"
    >
      @for (t of tabs; track t.value) {
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [id]="'tab-' + t.value"
          [attr.aria-selected]="tab() === t.value"
          [attr.aria-controls]="'panel-' + t.value"
          [attr.tabindex]="tab() === t.value ? 0 : -1"
          (click)="setTab(t.value)"
          (keydown.arrowRight)="setTab(t.value === 'active' ? 'past' : 'active', true)"
          (keydown.arrowLeft)="setTab(t.value === 'active' ? 'past' : 'active', true)"
        >
          <span class="tab-label" [attr.data-text]="t.label"
            ><span>{{ t.label }}</span></span
          >
        </button>
      }
    </div>

    <section
      class="surface-raised mt-4 p-5 sm:p-6"
      role="tabpanel"
      [id]="'panel-' + tab()"
      [attr.aria-labelledby]="'tab-' + tab()"
    >
      @if (items.error()) {
        <app-error-state [error]="items.error()" (retry)="items.reload()" />
      } @else if (!items.hasValue()) {
        <app-list-skeleton [rows]="4" label="Loading bookings" />
      } @else if (items.value().length === 0) {
        @if (tab() === 'active') {
          <app-empty-state
            icon="lucideCalendarDays"
            title="No upcoming bookings"
            description="When you book a room or register for an event, it appears here."
          >
            <a hlmBtn routerLink="/facilities">Book a room</a>
            <a hlmBtn variant="outline" routerLink="/events">Browse events</a>
          </app-empty-state>
        } @else {
          <app-empty-state
            icon="lucideHistory"
            title="Nothing here yet"
            description="Finished and cancelled bookings move here."
          />
        }
      } @else {
        <ul class="divide-border -my-4 divide-y" role="list">
          @for (item of items.value(); track item.kind + item.id) {
            <li>
              <app-my-item-row [item]="item" [showStatus]="tab() === 'past'">
                @if (canCancel(item)) {
                  <button
                    hlmBtn
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:bg-destructive-soft hover:text-destructive"
                    (click)="toCancel.set(item)"
                  >
                    Cancel<span class="sr-only">&nbsp;{{ item.title }}</span>
                  </button>
                }
              </app-my-item-row>
            </li>
          }
        </ul>
      }
    </section>

    <app-confirm-dialog
      [open]="!!toCancel()"
      (openChange)="!$event && toCancel.set(null)"
      [title]="
        toCancel()?.kind === 'BOOKING' ? 'Cancel this booking?' : 'Cancel your registration?'
      "
      [description]="cancelDescription()"
      confirmLabel="Yes, cancel it"
      cancelLabel="Keep it"
      [destructive]="true"
      [busy]="cancelling()"
      (confirm)="cancel()"
    />
  `,
  styles: `
    .tab-btn {
      height: 2.25rem;
      padding: 0 1rem;
      border-radius: 0.6rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--muted-foreground);
      transition:
        background-color 150ms ease,
        color 150ms ease,
        box-shadow 150ms ease;
    }
    .tab-btn[aria-selected='true'] {
      background: var(--card);
      color: var(--foreground);
      font-weight: 600;
      box-shadow: var(--shadow-raised);
    }
    .tab-btn:focus-visible {
      outline: 3px solid oklch(0.6 0.14 258 / 0.4);
      outline-offset: 1px;
    }
  `,
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
