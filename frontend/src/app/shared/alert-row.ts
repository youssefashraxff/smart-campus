import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBan,
  lucideBellRing,
  lucideCalendarClock,
  lucideCheck,
  lucideCircleCheck,
} from '@ng-icons/lucide';
import { CampusNotification, NotificationType } from '../core/models';
import { formatDateTime, relativeTime } from '../core/util/time';

const TYPE: Record<NotificationType, { icon: string; label: string; tone: string }> = {
  Confirmation: {
    icon: 'lucideCircleCheck',
    label: 'Confirmed',
    tone: 'bg-success-soft text-success',
  },
  Reminder: { icon: 'lucideBellRing', label: 'Reminder', tone: 'bg-brand-soft text-brand-ink' },
  ScheduleChange: {
    icon: 'lucideCalendarClock',
    label: 'Schedule change',
    tone: 'bg-warning-soft text-warning',
  },
  Cancellation: {
    icon: 'lucideBan',
    label: 'Cancelled',
    tone: 'bg-destructive-soft text-destructive',
  },
};

/** One dashboard alert (FR-U9) with a "Mark read" action (FR-U10) */
@Component({
  selector: 'app-alert-row',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCircleCheck,
      lucideBellRing,
      lucideCalendarClock,
      lucideBan,
      lucideCheck,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex items-start gap-3 py-3.5' },
  template: `
    <span
      class="grid size-9 shrink-0 place-items-center rounded-xl {{ meta().tone }}"
      aria-hidden="true"
    >
      <ng-icon [name]="meta().icon" size="17" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-2 text-xs">
        <span class="font-semibold">{{ meta().label }}</span>
        <time
          class="text-muted-foreground"
          [attr.datetime]="alert().createdAt"
          [title]="absolute()"
          >{{ relative() }}</time
        >
        @if (!alert().isRead) {
          <span class="bg-sun size-2 rounded-full" aria-hidden="true"></span>
          <span class="sr-only">Unread</span>
        }
      </p>
      <p class="narrow mt-0.5 text-sm" [class.text-muted-foreground]="alert().isRead">
        {{ alert().message }}
      </p>
    </div>
    @if (!alert().isRead) {
      <button
        type="button"
        class="text-muted-foreground hover:bg-muted hover:text-foreground -mt-1 grid size-8 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50"
        (click)="markRead.emit(alert())"
        [disabled]="busy()"
        aria-label="Mark as read"
        title="Mark as read"
      >
        <ng-icon name="lucideCheck" size="16" />
      </button>
    }
  `,
})
export class AlertRow {
  readonly alert = input.required<CampusNotification>();
  readonly busy = input(false);
  readonly markRead = output<CampusNotification>();

  protected readonly meta = computed(() => TYPE[this.alert().type] ?? TYPE.Reminder);
  protected readonly relative = computed(() => relativeTime(this.alert().createdAt));
  protected readonly absolute = computed(() => formatDateTime(this.alert().createdAt));
}
