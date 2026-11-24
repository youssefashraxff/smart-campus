import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarDays, lucideDoorOpen, lucideMapPin } from '@ng-icons/lucide';
import { MyItem } from '../core/models';
import { formatRange, relativeTime } from '../core/util/time';
import { DateTile } from './date-tile';
import { StatusBadge } from './status-badge';

/** One booking or registration: date tile, title, when and where. Actions go in the content slot. */
@Component({
  selector: 'app-my-item-row',
  imports: [NgIcon, DateTile, StatusBadge],
  providers: [provideIcons({ lucideDoorOpen, lucideCalendarDays, lucideMapPin })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-start gap-4 py-4 sm:items-center' },
  template: `
    <app-date-tile [iso]="item().startTime" />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
          <ng-icon
            [name]="isBooking() ? 'lucideDoorOpen' : 'lucideCalendarDays'"
            size="13"
            aria-hidden="true"
          />
          {{ isBooking() ? 'Facility booking' : 'Event registration' }}
        </span>
        @if (showStatus()) {
          <app-status-badge [status]="item().status" />
        }
      </div>
      <h3 class="clamp-2 mt-1 text-[0.9375rem] font-semibold" [title]="item().title">
        {{ item().title }}
      </h3>
      <p class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
        <time [attr.datetime]="item().startTime" class="text-foreground/80">{{ range() }}</time>
        <span class="inline-flex min-w-0 items-center gap-1">
          <ng-icon name="lucideMapPin" size="13" class="shrink-0" aria-hidden="true" />
          <span class="truncate">{{ item().building }}, {{ item().location }}</span>
        </span>
      </p>
      @if (showRelative()) {
        <p class="text-muted-foreground mt-0.5 text-xs">Starts {{ relative() }}</p>
      }
    </div>
    <div class="flex shrink-0 items-center gap-2 empty:hidden"><ng-content /></div>
  `,
})
export class MyItemRow {
  readonly item = input.required<MyItem>();
  readonly showStatus = input(true);
  readonly showRelative = input(false);

  protected readonly isBooking = computed(() => this.item().kind === 'BOOKING');
  protected readonly range = computed(() =>
    formatRange(this.item().startTime, this.item().endTime),
  );
  protected readonly relative = computed(() => relativeTime(this.item().startTime));
}
