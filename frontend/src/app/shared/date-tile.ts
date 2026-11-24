import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CAMPUS_TZ, campusToday, toCampusDate } from '../core/util/time';

const monthFmt = new Intl.DateTimeFormat('en-GB', { timeZone: CAMPUS_TZ, month: 'short' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: CAMPUS_TZ, day: 'numeric' });

/** A small calendar-page tile: "NOV / 24". Today is marked in sun yellow. */
@Component({
  selector: 'app-date-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    class:
      'flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl leading-none tabular',
    '[class.bg-sun-soft]': 'isToday()',
    '[class.text-sun-ink]': 'isToday()',
    '[class.bg-brand-soft]': '!isToday()',
    '[class.text-brand-ink]': '!isToday()',
  },
  template: `
    <span class="text-[0.625rem] font-semibold tracking-wider uppercase">{{ month() }}</span>
    <span class="mt-1 text-lg font-semibold">{{ day() }}</span>
  `,
})
export class DateTile {
  readonly iso = input.required<string>();
  protected readonly month = computed(() => monthFmt.format(new Date(this.iso())));
  protected readonly day = computed(() => dayFmt.format(new Date(this.iso())));
  protected readonly isToday = computed(() => toCampusDate(this.iso()) === campusToday());
}
