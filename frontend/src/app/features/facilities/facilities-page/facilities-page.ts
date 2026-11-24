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
import { CatalogApi } from '../../../core/api/catalog.api';
import { FacilityType } from '../../../core/models';
import { capacityLabel, FACILITY_TYPES, facilityIcon } from '../../../shared/facility-type';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';

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
  templateUrl: './facilities-page.html',
  styleUrl: './facilities-page.css',
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
