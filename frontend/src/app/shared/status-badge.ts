import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBan,
  lucideCalendarClock,
  lucideCircleCheck,
  lucideCircleDot,
  lucideWrench,
} from '@ng-icons/lucide';

type Tone = 'success' | 'warning' | 'danger' | 'brand' | 'neutral';

const STATUS: Record<string, { tone: Tone; icon: string; label?: string }> = {
  Available: { tone: 'success', icon: 'lucideCircleCheck' },
  Maintenance: { tone: 'warning', icon: 'lucideWrench' },
  Confirmed: { tone: 'success', icon: 'lucideCircleCheck' },
  Registered: { tone: 'success', icon: 'lucideCircleCheck' },
  Scheduled: { tone: 'brand', icon: 'lucideCircleDot' },
  Changed: { tone: 'warning', icon: 'lucideCalendarClock', label: 'Rescheduled' },
  Cancelled: { tone: 'danger', icon: 'lucideBan' },
};

const TONE: Record<Tone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-destructive-soft text-destructive',
  brand: 'bg-brand-soft text-brand-ink',
  neutral: 'bg-muted text-muted-foreground',
};

/**
 * A status pill. Every status has an icon and a word as well as a colour, so it still reads
 * for colour-blind users and in greyscale (WCAG 1.4.1).
 */
@Component({
  selector: 'app-status-badge',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideWrench,
      lucideCircleDot,
      lucideCalendarClock,
      lucideBan,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
  },
  template: `<ng-icon [name]="meta().icon" size="13" aria-hidden="true" />{{
      meta().label ?? status()
    }}`,
})
export class StatusBadge {
  readonly status = input.required<string>();

  protected readonly meta = computed(
    () => STATUS[this.status()] ?? { tone: 'neutral' as Tone, icon: 'lucideCircleDot' },
  );
  protected readonly classes = computed(
    () =>
      `inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ${TONE[this.meta().tone]}`,
  );
}
