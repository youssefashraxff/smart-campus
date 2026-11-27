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
import { CatalogApi } from '../../../core/api/catalog.api';
import { BookingApi } from '../../../core/api/booking.api';
import { errorMessage, statusOf } from '../../../core/util/errors';
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
} from '../../../core/util/time';
import { capacityLabel, facilityIcon } from '../../../shared/facility-type';
import { FormField } from '../../../shared/form-field';
import { ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';
import { Spinner } from '../../../shared/spinner';

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
 * one request for the visible range (?from=&to=). The calendar is fed one signal (calendarEvents), so taken slots
 * and your selection always update together. Dragging on the calendar fills the form; the form also works
 * on its own, so booking doesn't depend on a mouse. The overlap check here is only for quick feedback:
 * the Booking Engine re-checks inside a serializable transaction and answers 409 if someone else got
 * the slot first (SRS 4.3, NFR-6).
 */
@Component({
  selector: 'app-facility-booking-page',
  imports: [
    Spinner,
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
  templateUrl: './facility-booking-page.html',
  styleUrl: './facility-booking-page.css',
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

  /** Booked slots for the visible range, from the availability endpoint */
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
    // FullCalendar can report the same range more than once, so only a new range triggers a request
    datesSet: (range) => {
      const unchanged =
        this.visibleRange?.start.getTime() === range.start.getTime() &&
        this.visibleRange?.end.getTime() === range.end.getTime();
      this.visibleRange = { start: range.start, end: range.end };
      if (!unchanged) this.loadBooked();
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

  /**
   * One availability request for the whole visible range (FR-C3, NFR-3).
   * FullCalendar's range end is exclusive (the day after the last column), while the API's `to`
   * is inclusive, so step back one day.
   */
  private loadBooked(): void {
    const range = this.visibleRange;
    if (!range) return;
    const from = toCampusDate(range.start.toISOString());
    const to = addDays(toCampusDate(range.end.toISOString()), -1);
    this.catalog.availability(this.id(), from, to).subscribe({
      next: (res) => this.bookedSlots.set(res.bookedSlots),
      error: (err) => toast.error('Couldn’t load availability', { description: errorMessage(err) }),
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
