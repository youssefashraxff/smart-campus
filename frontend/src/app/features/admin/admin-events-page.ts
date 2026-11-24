import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideMicVocal,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideTrash2,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../core/api/catalog.api';
import { CampusEvent } from '../../core/models';
import { errorMessage } from '../../core/util/errors';
import { formatDay, formatTime } from '../../core/util/time';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';
import { EventFormDialog } from './event-form-dialog';
import { SpeakersDialog } from './speakers-dialog';

/** FR-A3, FR-A4, FR-A5: manage events and their speakers */
@Component({
  selector: 'app-admin-events-page',
  imports: [
    RouterLink,
    NgIcon,
    HlmButton,
    HlmInput,
    PageHeader,
    StatusBadge,
    ConfirmDialog,
    EventFormDialog,
    SpeakersDialog,
    EmptyState,
    ErrorState,
    ListSkeleton,
  ],
  providers: [
    provideIcons({ lucidePlus, lucidePencil, lucideTrash2, lucideMicVocal, lucideSearch }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      eyebrow="Administration"
      title="Events"
      description="Schedule events and manage their speakers. Registrants are notified of changes automatically."
    >
      <button hlmBtn (click)="edit(null)"><ng-icon name="lucidePlus" /> Add event</button>
    </app-page-header>

    <div class="relative mt-6 max-w-sm">
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
        placeholder="Filter by title or category"
        aria-label="Filter events"
        (input)="filter.set($any($event.target).value)"
      />
    </div>

    <div class="surface-flat mt-4 overflow-hidden">
      @if (events.error()) {
        <app-error-state [error]="events.error()" (retry)="events.reload()" />
      } @else if (!events.hasValue()) {
        <div class="p-4"><app-list-skeleton [rows]="5" label="Loading events" /></div>
      } @else if (rows().length === 0) {
        <app-empty-state title="No events" description="Add the first workshop, talk or contest." />
      } @else {
        <div class="overflow-x-auto">
          <table class="admin-table">
            <caption class="sr-only">
              Events
            </caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col" class="max-sm:hidden">When</th>
                <th scope="col" class="max-lg:hidden">Where</th>
                <th scope="col" class="text-end max-md:hidden">Seats</th>
                <th scope="col">Status</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (e of rows(); track e.id) {
                <tr>
                  <td class="max-w-72">
                    <a [routerLink]="['/events', e.id]" class="font-medium hover:underline">{{
                      e.title
                    }}</a>
                    <p class="text-muted-foreground text-xs">{{ e.category }}</p>
                  </td>
                  <td class="tabular whitespace-nowrap max-sm:hidden">
                    {{ day(e.startTime) }}<br /><span class="text-muted-foreground text-xs"
                      >{{ time(e.startTime) }}–{{ time(e.endTime) }}</span
                    >
                  </td>
                  <td class="max-lg:hidden">
                    {{ e.building }}<br /><span class="text-muted-foreground text-xs">{{
                      e.location
                    }}</span>
                  </td>
                  <td class="tabular text-end max-md:hidden">{{ e.capacity }}</td>
                  <td><app-status-badge [status]="e.status" /></td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button
                        hlmBtn
                        variant="ghost"
                        size="icon-sm"
                        (click)="openSpeakers(e)"
                        [attr.aria-label]="'Speakers for ' + e.title"
                        title="Speakers"
                      >
                        <ng-icon name="lucideMicVocal" />
                      </button>
                      <button
                        hlmBtn
                        variant="ghost"
                        size="icon-sm"
                        (click)="edit(e)"
                        [attr.aria-label]="'Edit ' + e.title"
                        title="Edit"
                      >
                        <ng-icon name="lucidePencil" />
                      </button>
                      <button
                        hlmBtn
                        variant="ghost"
                        size="icon-sm"
                        class="hover:text-destructive"
                        (click)="toDelete.set(e)"
                        [attr.aria-label]="'Delete ' + e.title"
                        title="Delete"
                      >
                        <ng-icon name="lucideTrash2" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-event-form-dialog
      [(open)]="formOpen"
      [event]="editing()"
      [categories]="categories()"
      (saved)="events.reload()"
    />
    <app-speakers-dialog [(open)]="speakersOpen" [event]="editing()" />

    <app-confirm-dialog
      [open]="!!toDelete()"
      (openChange)="!$event && toDelete.set(null)"
      title="Delete this event?"
      [description]="
        (toDelete()?.title ?? '') +
        ' and its speakers will be removed. To keep it visible and notify registrants, set its status to Cancelled instead.'
      "
      confirmLabel="Delete"
      cancelLabel="Cancel"
      [destructive]="true"
      [busy]="deleting()"
      (confirm)="remove()"
    />
  `,
})
export class AdminEventsPage {
  private readonly api = inject(CatalogApi);

  protected readonly events = rxResource({ stream: () => this.api.searchEvents() });
  protected readonly filter = signal('');
  protected readonly rows = computed(() => {
    if (!this.events.hasValue()) return [];
    const q = this.filter().trim().toLowerCase();
    return [...this.events.value()]
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .filter((e) => !q || `${e.title} ${e.category}`.toLowerCase().includes(q));
  });
  protected readonly categories = computed(() =>
    this.events.hasValue() ? [...new Set(this.events.value().map((e) => e.category))].sort() : [],
  );

  protected readonly formOpen = signal(false);
  protected readonly speakersOpen = signal(false);
  protected readonly editing = signal<CampusEvent | null>(null);
  protected readonly toDelete = signal<CampusEvent | null>(null);
  protected readonly deleting = signal(false);

  protected readonly day = formatDay;
  protected readonly time = formatTime;

  protected edit(e: CampusEvent | null): void {
    this.editing.set(e);
    this.formOpen.set(true);
  }

  protected openSpeakers(e: CampusEvent): void {
    this.editing.set(e);
    this.speakersOpen.set(true);
  }

  protected remove(): void {
    const e = this.toDelete();
    if (!e) return;
    this.deleting.set(true);
    this.api.deleteEvent(e.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        toast.success('Event deleted', { description: e.title });
        this.events.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        toast.error('Couldn’t delete', { description: errorMessage(err) });
      },
    });
  }
}
