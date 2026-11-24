import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideClock,
  lucideMapPin,
  lucideSearch,
  lucideSearchX,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../core/api/catalog.api';
import { CampusEvent } from '../../core/models';
import { campusToday, formatLongDay, formatTime, toCampusDate } from '../../core/util/time';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

/**
 * FR-U4: search events by keyword, date range, category and building.
 * Results are grouped by day, the way people scan a programme. Without a "from" date the list starts
 * today, so finished events don't crowd the top.
 */
@Component({
  selector: 'app-events-page',
  imports: [
    RouterLink,
    NgIcon,
    HlmButton,
    HlmInput,
    PageHeader,
    StatusBadge,
    EmptyState,
    ErrorState,
    ListSkeleton,
  ],
  providers: [
    provideIcons({
      lucideSearch,
      lucideClock,
      lucideMapPin,
      lucideUsers,
      lucideChevronRight,
      lucideSearchX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Events"
      description="Workshops, talks, contests and socials at FCIS. Register to save your seat."
    />

    <div
      class="surface-flat mt-6 grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]"
      role="search"
    >
      <div class="relative md:col-span-2 xl:col-span-1">
        <ng-icon
          name="lucideSearch"
          size="17"
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          hlmInput
          type="search"
          class="ps-10"
          placeholder="Search events"
          aria-label="Search events"
          [value]="q() ?? ''"
          (input)="pendingSearch.set($any($event.target).value)"
        />
      </div>
      <select
        class="select-native"
        aria-label="Category"
        (change)="setFilter({ category: $any($event.target).value || null })"
      >
        <option value="">All categories</option>
        @for (c of categories(); track c) {
          <option [value]="c" [selected]="c === category()">{{ c }}</option>
        }
      </select>
      <select
        class="select-native"
        aria-label="Building"
        (change)="setFilter({ building: $any($event.target).value || null })"
      >
        <option value="">All buildings</option>
        @for (b of buildings(); track b) {
          <option [value]="b" [selected]="b === building()">{{ b }}</option>
        }
      </select>
      <label class="relative">
        <span
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs"
          >From</span
        >
        <input
          type="date"
          class="select-native tabular date-input ps-14"
          [value]="fromDate()"
          (change)="setFilter({ from: $any($event.target).value || null })"
        />
      </label>
      <label class="relative">
        <span
          class="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs"
          >To</span
        >
        <input
          type="date"
          class="select-native tabular date-input ps-10"
          [min]="fromDate()"
          [value]="to() ?? ''"
          (change)="setFilter({ to: $any($event.target).value || null })"
        />
      </label>
    </div>

    <section class="mt-6" aria-labelledby="events-results">
      <h2 id="events-results" class="sr-only">Results</h2>
      @if (events.error()) {
        <div class="surface-raised">
          <app-error-state [error]="events.error()" (retry)="events.reload()" />
        </div>
      } @else if (!events.hasValue()) {
        <div class="surface-raised p-4">
          <app-list-skeleton [rows]="4" label="Loading events" />
        </div>
      } @else {
        <p class="text-muted-foreground mb-4 text-sm" aria-live="polite">
          {{ total() }} {{ total() === 1 ? 'event' : 'events' }}
          @if (hasFilters()) {
            ·
            <button
              type="button"
              class="text-primary font-medium hover:underline"
              (click)="clearFilters()"
            >
              Clear filters
            </button>
          }
        </p>
        @if (groups().length === 0) {
          <div class="surface-raised">
            <app-empty-state
              icon="lucideSearchX"
              title="No events match"
              description="Try a wider date range or another category."
            >
              <button hlmBtn variant="outline" (click)="clearFilters()">Clear filters</button>
            </app-empty-state>
          </div>
        } @else {
          <div class="flex flex-col gap-8">
            @for (group of groups(); track group.date) {
              <section [attr.aria-labelledby]="'day-' + group.date">
                <h3
                  [id]="'day-' + group.date"
                  class="mb-3 flex items-baseline gap-2 text-sm font-semibold"
                >
                  {{ group.label }}
                  @if (group.date === today) {
                    <span class="bg-sun-soft text-sun-ink rounded-full px-2 py-0.5 text-xs"
                      >Today</span
                    >
                  }
                </h3>
                <ul class="surface-raised divide-border divide-y overflow-hidden" role="list">
                  @for (e of group.events; track e.id) {
                    <li>
                      <a
                        [routerLink]="['/events', e.id]"
                        class="group hover:bg-accent/60 focus-visible:bg-accent flex items-center gap-4 px-4 py-4 outline-none transition-colors sm:px-5"
                      >
                        <div
                          class="tabular hidden w-14 shrink-0 text-center sm:block"
                          aria-hidden="true"
                        >
                          <p class="text-[0.9375rem] font-semibold">{{ time(e.startTime) }}</p>
                          <p class="text-muted-foreground text-xs">{{ time(e.endTime) }}</p>
                        </div>
                        <span
                          class="bg-border hidden h-10 w-px shrink-0 sm:block"
                          aria-hidden="true"
                        ></span>
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-brand-ink text-xs font-semibold">{{
                              e.category
                            }}</span>
                            @if (e.status !== 'Scheduled') {
                              <app-status-badge [status]="e.status" />
                            }
                          </div>
                          <p
                            class="clamp-2 mt-0.5 font-semibold"
                            [class.line-through]="e.status === 'Cancelled'"
                            [title]="e.title"
                          >
                            {{ e.title }}
                          </p>
                          <p
                            class="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm"
                          >
                            <span class="tabular inline-flex items-center gap-1.5"
                              ><ng-icon name="lucideClock" size="14" aria-hidden="true" />{{
                                time(e.startTime)
                              }}–{{ time(e.endTime) }}</span
                            >
                            <span class="inline-flex min-w-0 items-center gap-1.5"
                              ><ng-icon
                                name="lucideMapPin"
                                size="14"
                                class="shrink-0"
                                aria-hidden="true"
                              /><span class="truncate"
                                >{{ e.building }}, {{ e.location }}</span
                              ></span
                            >
                            <span class="tabular inline-flex items-center gap-1.5"
                              ><ng-icon name="lucideUsers" size="14" aria-hidden="true" />{{
                                e.capacity
                              }}
                              seats</span
                            >
                          </p>
                        </div>
                        <ng-icon
                          name="lucideChevronRight"
                          size="18"
                          class="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        }
      }
    </section>
  `,
  styles: `
    .date-input {
      background-image: none;
      padding-right: 0.75rem;
    }
  `,
})
export class EventsPage {
  private readonly api = inject(CatalogApi);
  private readonly router = inject(Router);

  readonly q = input<string>();
  readonly category = input<string>();
  readonly building = input<string>();
  readonly from = input<string>();
  readonly to = input<string>();

  protected readonly today = campusToday();
  protected readonly fromDate = computed(() => this.from() ?? this.today);
  protected readonly hasFilters = computed(
    () => !!(this.q() || this.category() || this.building() || this.from() || this.to()),
  );

  protected readonly events = rxResource({
    params: () => ({
      q: this.q() ?? '',
      category: this.category() ?? '',
      building: this.building() ?? '',
      from: this.fromDate(),
      to: this.to() ?? '',
    }),
    stream: ({ params }) => this.api.searchEvents(params),
  });

  private readonly all = rxResource({ stream: () => this.api.searchEvents() });
  protected readonly categories = computed(() =>
    this.all.hasValue() ? [...new Set(this.all.value().map((e) => e.category))].sort() : [],
  );
  protected readonly buildings = computed(() =>
    this.all.hasValue() ? [...new Set(this.all.value().map((e) => e.building))].sort() : [],
  );

  protected readonly total = computed(() =>
    this.events.hasValue() ? this.events.value().length : 0,
  );
  protected readonly groups = computed(() => {
    if (!this.events.hasValue()) return [];
    const byDay = new Map<string, CampusEvent[]>();
    [...this.events.value()]
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach((e) => {
        const day = toCampusDate(e.startTime);
        byDay.set(day, [...(byDay.get(day) ?? []), e]);
      });
    return [...byDay.entries()].map(([date, events]) => ({
      date,
      label: formatLongDay(events[0].startTime),
      events,
    }));
  });

  protected readonly time = formatTime;
  protected readonly pendingSearch = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const value = this.pendingSearch();
      if (value === null) return;
      const timer = setTimeout(() => this.setFilter({ q: value.trim() || null }), 250);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected setFilter(change: Record<string, string | null>): void {
    void this.router.navigate([], {
      queryParams: change,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected clearFilters(): void {
    this.pendingSearch.set(null);
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
