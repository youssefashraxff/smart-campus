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
import { CatalogApi } from '../../../core/api/catalog.api';
import { CampusEvent } from '../../../core/models';
import { campusToday, formatLongDay, formatTime, toCampusDate } from '../../../core/util/time';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';

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
  templateUrl: './events-page.html',
  styleUrl: './events-page.css',
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
