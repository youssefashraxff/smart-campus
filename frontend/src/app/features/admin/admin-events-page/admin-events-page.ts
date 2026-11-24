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
import { CatalogApi } from '../../../core/api/catalog.api';
import { CampusEvent } from '../../../core/models';
import { errorMessage } from '../../../core/util/errors';
import { formatDay, formatTime } from '../../../core/util/time';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';
import { EventFormDialog } from '../event-form-dialog/event-form-dialog';
import { SpeakersDialog } from '../speakers-dialog/speakers-dialog';

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
  templateUrl: './admin-events-page.html',
  styleUrl: './admin-events-page.css',
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
