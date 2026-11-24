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
  lucideDoorOpen,
  lucideMapPin,
  lucideMonitor,
  lucideProjector,
  lucideSearch,
  lucideSearchX,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../core/api/catalog.api';
import { FacilityType } from '../../core/models';
import { capacityLabel, FACILITY_TYPES, facilityIcon } from '../../shared/facility-type';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';

/**
 * FR-U3: search and filter facilities by keyword, type, building and availability.
 * The filters live in the URL (?q=&type=&building=&available=), so a filtered list can be shared or
 * bookmarked and the back button restores it. Keyword, type and building go to the server; "available
 * only" is applied here because the SRS search endpoint has no status parameter.
 */
@Component({
  selector: 'app-facilities-page',
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
      lucideDoorOpen,
      lucideMonitor,
      lucideProjector,
      lucideMapPin,
      lucideUsers,
      lucideX,
      lucideSearchX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Facilities"
      description="Study rooms, labs and equipment across FCIS. Pick one to see when it’s free and book a slot."
    />

    <!-- Filters: a flat surface, so the results stay the focus -->
    <div
      class="surface-flat mt-6 flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center"
      role="search"
    >
      <div class="relative flex-1">
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
          placeholder="Search by name, e.g. “study room” or “GPU”"
          aria-label="Search facilities"
          [value]="q() ?? ''"
          (input)="onSearch($any($event.target).value)"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="bg-muted flex gap-1 rounded-xl p-1" role="group" aria-label="Facility type">
          <button
            type="button"
            class="filter-chip"
            [attr.aria-pressed]="!type()"
            (click)="setFilter({ type: null })"
          >
            <span class="tab-label" data-text="All"><span>All</span></span>
          </button>
          @for (t of types; track t.value) {
            <button
              type="button"
              class="filter-chip"
              [attr.aria-pressed]="type() === t.value"
              (click)="setFilter({ type: t.value })"
            >
              <span class="tab-label" [attr.data-text]="t.plural"
                ><span>{{ t.plural }}</span></span
              >
            </button>
          }
        </div>

        <select
          class="select-native w-auto min-w-44"
          aria-label="Building"
          [value]="building() ?? ''"
          (change)="setFilter({ building: $any($event.target).value || null })"
        >
          <option value="">All buildings</option>
          @for (b of buildings(); track b) {
            <option [value]="b" [selected]="b === building()">{{ b }}</option>
          }
        </select>

        <label class="flex h-10 cursor-pointer items-center gap-2.5 px-1 text-sm select-none">
          <input
            type="checkbox"
            class="switch"
            [checked]="availableOnly()"
            (change)="setFilter({ available: $any($event.target).checked ? 'true' : null })"
          />
          Available only
        </label>
      </div>
    </div>

    <section class="mt-6" aria-labelledby="results-title">
      <h2 id="results-title" class="sr-only">Results</h2>
      @if (facilities.error()) {
        <div class="surface-raised">
          <app-error-state [error]="facilities.error()" (retry)="facilities.reload()" />
        </div>
      } @else if (!facilities.hasValue()) {
        <div class="surface-raised p-4">
          <app-list-skeleton [rows]="4" label="Loading facilities" />
        </div>
      } @else {
        <p class="text-muted-foreground mb-4 text-sm" aria-live="polite">
          {{ results().length }} {{ results().length === 1 ? 'facility' : 'facilities' }}
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

        @if (results().length === 0) {
          <div class="surface-raised">
            <app-empty-state
              icon="lucideSearchX"
              title="No facilities match"
              description="Try another keyword, or clear the filters to see everything."
            >
              <button hlmBtn variant="outline" (click)="clearFilters()">Clear filters</button>
            </app-empty-state>
          </div>
        } @else {
          <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
            @for (f of results(); track f.id) {
              <li>
                <a
                  [routerLink]="['/facilities', f.id]"
                  class="surface-raised surface-interactive focus-visible:ring-ring/50 flex h-full flex-col gap-4 p-5 outline-none focus-visible:ring-3"
                  [class.opacity-75]="f.status === 'Maintenance'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="bg-brand-soft text-brand-ink grid size-11 place-items-center rounded-2xl"
                      aria-hidden="true"
                    >
                      <ng-icon [name]="icon(f.type)" size="20" />
                    </span>
                    @if (f.status === 'Maintenance') {
                      <app-status-badge [status]="f.status" />
                    }
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-muted-foreground text-xs font-medium">{{ f.type }}</p>
                    <h3 class="clamp-2 mt-0.5 text-base font-semibold" [title]="f.title">
                      {{ f.title }}
                    </h3>
                  </div>
                  <div class="text-muted-foreground flex flex-col gap-1 text-sm">
                    <span class="flex min-w-0 items-center gap-1.5">
                      <ng-icon name="lucideMapPin" size="14" aria-hidden="true" />
                      <span class="truncate">{{ f.building }} · {{ f.location }}</span>
                    </span>
                    <span class="tabular flex items-center gap-1.5">
                      <ng-icon name="lucideUsers" size="14" aria-hidden="true" />
                      {{ capacity(f.type, f.capacity) }}
                    </span>
                  </div>
                </a>
              </li>
            }
          </ul>
        }
      }
    </section>
  `,
})
export class FacilitiesPage {
  private readonly api = inject(CatalogApi);
  private readonly router = inject(Router);

  // Query params arrive as inputs (withComponentInputBinding in app.config.ts)
  readonly q = input<string>();
  readonly type = input<FacilityType>();
  readonly building = input<string>();
  readonly available = input<string>();

  protected readonly types = FACILITY_TYPES;
  protected readonly availableOnly = computed(() => this.available() === 'true');
  protected readonly hasFilters = computed(
    () => !!(this.q() || this.type() || this.building() || this.availableOnly()),
  );

  /** Reloads whenever a server-side filter changes */
  protected readonly facilities = rxResource({
    params: () => ({
      q: this.q() ?? '',
      type: this.type() ?? ('' as const),
      building: this.building() ?? '',
    }),
    stream: ({ params }) => this.api.searchFacilities(params),
  });

  /** Unfiltered list, loaded once, so the building menu doesn't shrink as you filter */
  private readonly all = rxResource({ stream: () => this.api.searchFacilities() });
  protected readonly buildings = computed(() =>
    this.all.hasValue() ? [...new Set(this.all.value().map((f) => f.building))].sort() : [],
  );

  protected readonly results = computed(() => {
    if (!this.facilities.hasValue()) return [];
    const list = this.facilities.value();
    return this.availableOnly() ? list.filter((f) => f.status === 'Available') : list;
  });

  protected readonly icon = facilityIcon;
  protected readonly capacity = capacityLabel;

  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly pendingSearch = signal<string | null>(null);

  constructor() {
    // Debounce typing: update the URL (and so the request) 250 ms after the last keystroke
    effect((onCleanup) => {
      const value = this.pendingSearch();
      if (value === null) return;
      this.searchTimer = setTimeout(() => this.setFilter({ q: value.trim() || null }), 250);
      onCleanup(() => clearTimeout(this.searchTimer));
    });
  }

  protected onSearch(value: string): void {
    this.pendingSearch.set(value);
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
