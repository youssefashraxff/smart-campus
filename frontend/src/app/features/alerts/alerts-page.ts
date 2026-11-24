import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBellRing, lucideCheckCheck } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { forkJoin } from 'rxjs';
import { AlertsStore } from '../../core/alerts.store';
import { NotificationApi } from '../../core/api/notification.api';
import { CampusNotification } from '../../core/models';
import { errorMessage } from '../../core/util/errors';
import { AlertRow } from '../../shared/alert-row';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';

/** FR-U9 and FR-U10: every alert, newest first, with "mark as read" */
@Component({
  selector: 'app-alerts-page',
  imports: [NgIcon, HlmButton, PageHeader, AlertRow, EmptyState, ErrorState, ListSkeleton],
  providers: [provideIcons({ lucideCheckCheck, lucideBellRing })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Alerts"
      description="Booking confirmations, reminders and schedule changes. They’re also sent to your email."
    >
      @if (unread().length > 1) {
        <button hlmBtn variant="outline" (click)="markAllRead()" [disabled]="markingAll()">
          <ng-icon name="lucideCheckCheck" />
          Mark all as read
        </button>
      }
    </app-page-header>

    <label class="mt-6 inline-flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <input
        type="checkbox"
        class="size-4 accent-[var(--primary)]"
        [checked]="unreadOnly()"
        (change)="unreadOnly.set($any($event.target).checked)"
      />
      Unread only
    </label>

    <section class="surface-raised mt-4 p-5 sm:p-6" aria-label="Alerts">
      @if (alerts.error()) {
        <app-error-state [error]="alerts.error()" (retry)="alerts.reload()" />
      } @else if (!alerts.hasValue()) {
        <app-list-skeleton [rows]="4" label="Loading alerts" />
      } @else if (visible().length === 0) {
        <app-empty-state
          icon="lucideBellRing"
          [title]="unreadOnly() ? 'No unread alerts' : 'No alerts yet'"
          description="When you book, cancel or an event changes, you’ll hear about it here."
        />
      } @else {
        <ul class="divide-border -my-3.5 divide-y" role="list">
          @for (a of visible(); track a.id) {
            <li>
              <app-alert-row
                [alert]="a"
                [busy]="marking().has(a.id)"
                (markRead)="markRead($event)"
              />
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class AlertsPage {
  private readonly api = inject(NotificationApi);
  private readonly store = inject(AlertsStore);

  protected readonly unreadOnly = signal(false);
  protected readonly alerts = rxResource({ stream: () => this.api.mine() });
  /** Alerts read on this page, applied on top of the loaded list */
  private readonly readIds = signal<Set<number>>(new Set());
  protected readonly marking = signal<Set<number>>(new Set());
  protected readonly markingAll = signal(false);

  private readonly list = computed<CampusNotification[]>(() =>
    this.alerts.hasValue()
      ? this.alerts.value().map((a) => (this.readIds().has(a.id) ? { ...a, isRead: true } : a))
      : [],
  );
  protected readonly unread = computed(() => this.list().filter((a) => !a.isRead));
  protected readonly visible = computed(() => (this.unreadOnly() ? this.unread() : this.list()));

  constructor() {
    // Keep the navigation badge in step with this page
    effect(() => {
      if (this.alerts.hasValue()) this.store.set(this.unread().length);
    });
  }

  protected markRead(alert: CampusNotification): void {
    this.marking.update((s) => new Set(s).add(alert.id));
    this.api.markRead(alert.id).subscribe({
      next: () => this.done([alert.id]),
      error: (err) => {
        this.done([], [alert.id]);
        toast.error('Couldn’t mark that alert as read', { description: errorMessage(err) });
      },
    });
  }

  protected markAllRead(): void {
    const ids = this.unread().map((a) => a.id);
    this.markingAll.set(true);
    forkJoin(ids.map((id) => this.api.markRead(id))).subscribe({
      next: () => {
        this.markingAll.set(false);
        this.done(ids);
      },
      error: (err) => {
        this.markingAll.set(false);
        this.alerts.reload();
        toast.error('Some alerts couldn’t be marked as read', { description: errorMessage(err) });
      },
    });
  }

  private done(read: number[], failed: number[] = []): void {
    this.readIds.update((s) => new Set([...s, ...read]));
    this.marking.update(
      (s) => new Set([...s].filter((id) => !read.includes(id) && !failed.includes(id))),
    );
  }
}
