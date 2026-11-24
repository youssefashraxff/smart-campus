import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideSearch, lucideTrash2 } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../../core/api/catalog.api';
import { Facility } from '../../../core/models';
import { errorMessage, statusOf } from '../../../core/util/errors';
import { ConfirmDialog } from '../../../shared/confirm-dialog';
import { PageHeader } from '../../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../../shared/states';
import { StatusBadge } from '../../../shared/status-badge';
import { FacilityFormDialog } from '../facility-form-dialog/facility-form-dialog';

/** FR-A1, FR-A2: add, edit and delete facilities. A flat table: admins scan rows, not cards. */
@Component({
  selector: 'app-admin-facilities-page',
  imports: [
    NgIcon,
    HlmButton,
    HlmInput,
    PageHeader,
    StatusBadge,
    ConfirmDialog,
    FacilityFormDialog,
    EmptyState,
    ErrorState,
    ListSkeleton,
  ],
  providers: [provideIcons({ lucidePlus, lucidePencil, lucideTrash2, lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-facilities-page.html',
  styleUrl: './admin-facilities-page.css',
})
export class AdminFacilitiesPage {
  private readonly api = inject(CatalogApi);

  protected readonly facilities = rxResource({ stream: () => this.api.searchFacilities() });
  protected readonly filter = signal('');
  protected readonly rows = computed(() => {
    if (!this.facilities.hasValue()) return [];
    const q = this.filter().trim().toLowerCase();
    return this.facilities
      .value()
      .filter((f) => !q || `${f.title} ${f.building}`.toLowerCase().includes(q));
  });

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Facility | null>(null);
  protected readonly toDelete = signal<Facility | null>(null);
  protected readonly deleting = signal(false);

  protected edit(f: Facility | null): void {
    this.editing.set(f);
    this.formOpen.set(true);
  }

  protected remove(): void {
    const f = this.toDelete();
    if (!f) return;
    this.deleting.set(true);
    this.api.deleteFacility(f.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toDelete.set(null);
        toast.success('Facility deleted', { description: f.title });
        this.facilities.reload();
      },
      error: (err) => {
        this.deleting.set(false);
        toast.error('Couldn’t delete', {
          description:
            statusOf(err) === 409
              ? 'It has upcoming bookings. Set it to Maintenance instead.'
              : errorMessage(err),
        });
      },
    });
  }
}
