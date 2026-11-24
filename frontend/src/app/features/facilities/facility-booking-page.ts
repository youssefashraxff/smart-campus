import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
  viewChild,
  effect,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  CalendarOptions,
  DateSelectInfo,
  EventInput,
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';
import interactionPlugin from '@fullcalendar/angular/interaction';
import timeGridPlugin from '@fullcalendar/angular/timegrid';
import themePlugin from '@fullcalendar/angular/themes/forma';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalendarCheck,
  lucideCircleCheck,
  lucideMapPin,
  lucideTriangleAlert,
  lucideUsers,
  lucideWrench,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { forkJoin, map } from 'rxjs';
import { CatalogApi } from '../../core/api/catalog.api';
import { BookingApi } from '../../core/api/booking.api';
import { errorMessage, statusOf } from '../../core/util/errors';
import {
  addDays,
  CAMPUS_TZ,
  campusToday,
  formatLongDay,
  isFuture,
  nextHalfHour,
  toCampusDate,
  toCampusIso,
  toCampusTime,
} from '../../core/util/time';
import { capacityLabel, facilityIcon } from '../../shared/facility-type';
import { FormField } from '../../shared/form-field';
import { ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

/** Bookable hours shown on the calendar and offered in the time menus */
const OPEN = '08:00';
const CLOSE = '22:00';
const STEP_MINUTES = 30;

function timeOptions(): string[] {
  const out: string[] = [];
  const [openH] = OPEN.split(':').map(Number);
  const [closeH] = CLOSE.split(':').map(Number);
  for (let m = openH * 60; m <= closeH * 60; m += STEP_MINUTES) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** A sensible first suggestion: the next free-looking hour today, or 10:00 tomorrow if it's late */
function defaultSlot(): { date: string; start: string; end: string } {
  const next = nextHalfHour();
  const startMin = Math.max(minutesOf(next.time), minutesOf(OPEN));
  if (next.date === campusToday() && startMin + 60 <= minutesOf(CLOSE)) {
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    return { date: next.date, start: fmt(startMin), end: fmt(startMin + 60) };
  }
  return { date: addDays(campusToday(), 1), start: '10:00', end: '11:00' };
}

/**
 * FR-U5: reserve a facility for a time slot.
 * The week calendar shows taken slots from the gateway's GET /api/facilities/{id}/availability (FR-C3),
 * one call per visible day, in parallel. The calendar is fed one signal (calendarEvents), so taken slots
 * and your selection always update together. Dragging on the calendar fills the form; the form also works
 * on its own, so booking doesn't depend on a mouse. The overlap check here is only for quick feedback:
 * the Booking Engine re-checks inside a serializable transaction and answers 409 if someone else got
 * the slot first (SRS 4.3, NFR-6).
 */
@Component({
  selector: 'app-facility-booking-page',
  imports: [
    RouterLink,
    FullCalendarModule,
    NgIcon,
    HlmButton,
    FormField,
    StatusBadge,
    ErrorState,
    ListSkeleton,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideCircleCheck,
      lucideMapPin,
      lucideUsers,
      lucideWrench,
      lucideCalendarCheck,
      lucideTriangleAlert,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      routerLink="/facilities"
      class="text-muted-foreground hover:text-foreground -ms-1 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium"
    >
      <ng-icon name="lucideArrowLeft" size="16" aria-hidden="true" /> All facilities
    </a>

    @if (facility.error()) {
      <div class="surface-raised mt-4">
        <app-error-state
          [error]="facility.error()"
          title="Couldn’t load this facility"
          (retry)="facility.reload()"
        />
      </div>
    } @else if (!facility.hasValue()) {
      <div class="surface-raised mt-4 p-4">
        <app-list-skeleton [rows]="2" label="Loading facility" />
      </div>
    } @else {
      @let f = facility.value();
      <header class="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          class="bg-brand-soft text-brand-ink grid size-14 shrink-0 place-items-center rounded-2xl"
          aria-hidden="true"
        >
          <ng-icon [name]="icon(f.type)" size="26" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 class="text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-semibold">{{ f.title }}</h1>
            <app-status-badge [status]="f.status" />
          </div>
          <p class="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span class="inline-flex items-center gap-1.5"
              ><ng-icon name="lucideMapPin" size="14" aria-hidden="true" />{{ f.building }} ·
              {{ f.location }}</span
            >
            <span class="tabular inline-flex items-center gap-1.5"
              ><ng-icon name="lucideUsers" size="14" aria-hidden="true" />{{
                capacity(f.type, f.capacity)
              }}</span
            >
          </p>
        </div>
      </header>

      <div class="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <!-- Calendar -->
        <section
          class="surface-raised campus-calendar min-w-0 p-3 sm:p-5"
          aria-label="Availability calendar"
        >
          <p
            class="text-muted-foreground mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs"
          >
            <span class="inline-flex items-center gap-1.5"
              ><span class="legend legend-busy" aria-hidden="true"></span>Booked</span
            >
            <span class="inline-flex items-center gap-1.5"
              ><span class="legend legend-mine" aria-hidden="true"></span>Your selection</span
            >
            <span class="hidden sm:inline">Drag across free time to pick a slot.</span>
          </p>
          <full-calendar #calendar [options]="calendarOptions" [events]="calendarEvents()" />
        </section>

        <!-- Booking form -->
        <aside class="surface-raised p-5 sm:p-6 lg:sticky lg:top-8" aria-labelledby="book-title">
          <h2 id="book-title" class="text-lg font-semibold">Book a slot</h2>

          @if (f.status === 'Maintenance') {
            <div
              role="status"
              class="bg-warning-soft text-warning mt-4 flex gap-3 rounded-xl p-4 text-sm"
            >
              <ng-icon name="lucideWrench" size="18" class="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                <span class="font-semibold">Under maintenance.</span> This facility can’t take new
                bookings until it’s available again.
              </p>
            </div>
          } @else if (justBooked(); as booked) {
            <div role="status" class="mt-4 flex flex-col items-start gap-3">
              <p class="text-success flex items-center gap-2 font-semibold">
                <ng-icon name="lucideCircleCheck" size="18" aria-hidden="true" /> Booked
              </p>
              <p class="text-sm">{{ booked }}</p>
              <p class="text-muted-foreground text-sm">
                It’s in My bookings now. You can cancel it there until it starts.
              </p>
              <div class="mt-1 flex flex-wrap gap-2">
                <button hlmBtn (click)="bookAnother()">Book another slot</button>
                <a hlmBtn variant="outline" routerLink="/bookings">My bookings</a>
              </div>
            </div>
          } @else {
            <form
              class="mt-4 flex flex-col gap-4"
              (submit)="$event.preventDefault(); book()"
              novalidate
            >
              <app-form-field label="Date" for="date">
                <input
                  id="date"
                  type="date"
                  class="select-native tabular bg-none"
                  [min]="today"
                  [value]="date()"
                  (change)="date.set($any($event.target).value); justBooked.set(null)"
                />
              </app-form-field>
              <div class="grid grid-cols-2 gap-3">
                <app-form-field label="From" for="start">
                  <select
                    id="start"
                    class="select-native tabular"
                    (change)="setStart($any($event.target).value)"
                  >
                    @for (t of times.slice(0, -1); track t) {
                      <option [value]="t" [selected]="t === start()">{{ t }}</option>
                    }
                  </select>
                </app-form-field>
                <app-form-field label="To" for="end">
                  <select
                    id="end"
                    class="select-native tabular"
                    (change)="end.set($any($event.target).value); justBooked.set(null)"
                  >
                    @for (t of endTimes(); track t) {
                      <option [value]="t" [selected]="t === end()">{{ t }}</option>
                    }
                  </select>
                </app-form-field>
              </div>

              <div class="bg-muted/60 rounded-xl px-4 py-3 text-sm" aria-live="polite">
                <p class="font-medium">{{ summaryDay() }}</p>
                <p class="text-muted-foreground tabular">
                  {{ start() }}–{{ end() }} · {{ durationLabel() }}
                </p>
              </div>

              @if (problem(); as p) {
                <p role="alert" class="text-destructive flex items-start gap-2 text-sm">
                  <ng-icon
                    name="lucideTriangleAlert"
                    size="16"
                    class="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />{{ p }}
                </p>
              }

              <button
                hlmBtn
                size="lg"
                type="submit"
                class="w-full"
                [disabled]="!!problem() || busy()"
              >
                <ng-icon name="lucideCalendarCheck" />
                {{ busy() ? 'Booking…' : 'Book this slot' }}
              </button>
              <p class="text-muted-foreground text-xs">
                Times are campus time (Cairo). You’ll get a confirmation alert and a reminder 24
                hours before.
              </p>
            </form>
          }
        </aside>
      </div>
    }
  `,
  styles: `
    .legend {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 0.25rem;
      display: inline-block;
    }
    .legend-busy {
      background: repeating-linear-gradient(
        135deg,
        oklch(0.94 0.008 255) 0 3px,
        oklch(0.88 0.014 255) 3px 6px
      );
      outline: 1px solid oklch(0.84 0.02 255);
    }
    .legend-mine {
      background: var(--primary);
    }
    input[type='date'].bg-none {
      background-image: none;
      padding-right: 0.875rem;
    }
    :host ::ng-deep .slot-busy {
      --fc-event-color: oklch(0.92 0.012 255);
      --fc-event-contrast-color: oklch(0.42 0.03 258);
      background: repeating-linear-gradient(
        135deg,
        oklch(0.94 0.008 255) 0 6px,
        oklch(0.9 0.014 255) 6px 12px
      ) !important;
      border: 1px solid oklch(0.84 0.02 255) !important;
      color: oklch(0.42 0.03 258) !important;
      cursor: not-allowed;
    }
    :host ::ng-deep .slot-mine {
      box-shadow: var(--shadow-primary);
    }
  `,
})
export class FacilityBookingPage {
  private readonly catalog = inject(CatalogApi);
  private readonly bookings = inject(BookingApi);
  private readonly router = inject(Router);

  /** Route param :id (withComponentInputBinding) */
  readonly id = input.required({ transform: numberAttribute });

  protected readonly facility = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.catalog.getFacility(params),
  });

  protected readonly today = campusToday();
  protected readonly times = timeOptions();
  private readonly initial = defaultSlot();
  protected readonly date = signal(this.initial.date);
  protected readonly start = signal(this.initial.start);
  protected readonly end = signal(this.initial.end);
  protected readonly busy = signal(false);
  /** Set after a successful booking: the panel shows a confirmation instead of the form */
  protected readonly justBooked = signal<string | null>(null);

  /** Booked slots for the visible week, from the availability endpoint */
  private readonly bookedSlots = signal<{ startTime: string; endTime: string }[]>([]);
  /** The same slots as numbers, for the instant overlap check */
  private readonly booked = computed(() =>
    this.bookedSlots().map((b) => ({
      start: new Date(b.startTime).getTime(),
      end: new Date(b.endTime).getTime(),
    })),
  );
  /** The visible date range, so a booking can refresh it */
  private visibleRange: { start: Date; end: Date } | null = null;

  protected readonly endTimes = computed(() =>
    this.times.filter((t) => minutesOf(t) > minutesOf(this.start())),
  );
  protected readonly startIso = computed(() => toCampusIso(this.date(), this.start()));
  protected readonly endIso = computed(() => toCampusIso(this.date(), this.end()));
  protected readonly summaryDay = computed(() => formatLongDay(this.startIso()));
  protected readonly durationLabel = computed(() => {
    const mins = minutesOf(this.end()) - minutesOf(this.start());
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ');
  });

  /** Client-side checks for quick feedback; the server enforces the same rules */
  protected readonly problem = computed<string | null>(() => {
    if (!this.date()) return 'Pick a date.';
    if (minutesOf(this.end()) <= minutesOf(this.start()))
      return 'The end time must be after the start time.';
    if (!isFuture(this.startIso())) return 'That time has already passed. Pick a later slot.';
    const s = new Date(this.startIso()).getTime();
    const e = new Date(this.endIso()).getTime();
    // Strict < and > so touching edges (10–11 then 11–12) are allowed, as in SRS 4.3
    if (this.booked().some((b) => b.start < e && b.end > s))
      return 'That overlaps an existing booking. Choose a free time.';
    return null;
  });

  /** The current form selection, drawn on the calendar in campus blue */
  private readonly selectionEvent = computed<EventInput[]>(() =>
    !this.justBooked() && this.date() && minutesOf(this.end()) > minutesOf(this.start())
      ? [
          {
            id: 'mine',
            title: 'Your selection',
            start: this.startIso(),
            end: this.endIso(),
            className: 'slot-mine',
            editable: false,
          },
        ]
      : [],
  );

  /** Everything the calendar shows: taken slots (grey stripes) plus your selection (blue) */
  protected readonly calendarEvents = computed<EventInput[]>(() => [
    ...this.bookedSlots().map((s) => ({
      title: 'Booked',
      start: s.startTime,
      end: s.endTime,
      className: 'slot-busy',
      interactive: false,
    })),
    ...this.selectionEvent(),
  ]);

  protected readonly calendarOptions: CalendarOptions = {
    plugins: [themePlugin, timeGridPlugin, interactionPlugin],
    timeZone: CAMPUS_TZ,
    initialDate: this.initial.date,
    initialView:
      typeof window !== 'undefined' && window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' },
    buttons: {
      today: { text: 'Today' },
      timeGridWeek: { text: 'Week' },
      timeGridDay: { text: 'Day' },
    },
    firstDay: 6, // The Egyptian week starts on Saturday
    allDaySlot: false,
    slotMinTime: OPEN,
    slotMaxTime: CLOSE,
    slotDuration: '00:30:00',
    slotHeaderFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
    nowIndicator: true,
    height: 'auto',
    validRange: { start: this.today },
    selectable: true,
    selectMirror: true,
    selectOverlap: (event) => event.id === 'mine',
    selectAllow: (span) => span.start.getTime() > Date.now(),
    select: (info) => this.onSelect(info),
    // Runs on first render and whenever the user moves to another week or day
    datesSet: (range) => {
      this.visibleRange = { start: range.start, end: range.end };
      this.loadBooked();
    },
  };

  protected readonly icon = facilityIcon;
  protected readonly capacity = capacityLabel;

  private readonly calendar = viewChild<FullCalendarComponent>('calendar');

  constructor() {
    // Typing a date in the form moves the calendar to that week, so you can see what's free
    effect(() => {
      const date = this.date();
      const calendar = this.calendar();
      if (date && calendar) untracked(() => calendar.getApi().gotoDate(date));
    });
  }

  protected setStart(value: string): void {
    this.justBooked.set(null);
    this.start.set(value);
    // Keep the slot valid: if the end is now before the start, make it one hour long
    if (minutesOf(this.end()) <= minutesOf(value)) {
      const next =
        this.times.find((t) => minutesOf(t) >= minutesOf(value) + 60) ?? this.times.at(-1)!;
      this.end.set(next);
    }
  }

  /** Offers the hour right after the slot just booked */
  protected bookAnother(): void {
    const previousEnd = this.end();
    this.justBooked.set(null);
    if (minutesOf(previousEnd) + 60 <= minutesOf(CLOSE)) {
      this.setStart(previousEnd);
    }
  }

  private onSelect(info: DateSelectInfo): void {
    this.justBooked.set(null);
    const startIso = info.start.toISOString();
    const endIso = info.end.toISOString();
    this.date.set(toCampusDate(startIso));
    this.start.set(toCampusTime(startIso));
    this.end.set(toCampusDate(endIso) === toCampusDate(startIso) ? toCampusTime(endIso) : CLOSE);
    info.view.calendar.unselect();
  }

  /** One availability call per visible day, in parallel (NFR-3) */
  private loadBooked(): void {
    const range = this.visibleRange;
    if (!range) return;
    const days: string[] = [];
    for (
      let d = toCampusDate(range.start.toISOString());
      d < toCampusDate(range.end.toISOString());
      d = addDays(d, 1)
    ) {
      days.push(d);
    }
    forkJoin(days.map((day) => this.catalog.availability(this.id(), day)))
      .pipe(
        map((responses) => {
          // A booking that crosses midnight is returned for both days: keep one copy
          const unique = new Map<string, { startTime: string; endTime: string }>();
          responses
            .flatMap((r) => r.bookedSlots)
            .forEach((s) => unique.set(s.startTime + s.endTime, s));
          return [...unique.values()];
        }),
      )
      .subscribe({
        next: (slots) => this.bookedSlots.set(slots),
        error: (err) =>
          toast.error('Couldn’t load availability', { description: errorMessage(err) }),
      });
  }

  protected book(): void {
    if (this.problem() || this.busy()) return;
    this.busy.set(true);
    this.bookings
      .reserve({ facilityId: this.id(), startTime: this.startIso(), endTime: this.endIso() })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.justBooked.set(
            `${this.facility.value()?.title}, ${this.summaryDay()}, ${this.start()}–${this.end()}`,
          );
          toast.success('Booked', {
            description: `${this.facility.value()?.title}, ${this.summaryDay()} ${this.start()}–${this.end()}`,
            action: {
              label: 'My bookings',
              onClick: () => void this.router.navigate(['/bookings']),
            },
          });
          this.loadBooked();
        },
        error: (err) => {
          this.busy.set(false);
          const conflict = statusOf(err) === 409;
          toast.error(conflict ? 'That slot was just taken' : 'Booking failed', {
            description: conflict
              ? 'Someone booked an overlapping time. The calendar has been refreshed.'
              : errorMessage(err),
          });
          if (conflict) this.loadBooked();
        },
      });
  }
}
