import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideSearch, lucideTrash2 } from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../core/api/catalog.api';
import { Facility } from '../../core/models';
import { errorMessage, statusOf } from '../../core/util/errors';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { PageHeader } from '../../shared/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '../../shared/states';
import { StatusBadge } from '../../shared/status-badge';
import { FacilityFormDialog } from './facility-form-dialog';

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
  template: `
    <app-page-header
      eyebrow="Administration"
      title="Facilities"
      description="Rooms, labs and equipment students can book."
    >
      <button hlmBtn (click)="edit(null)"><ng-icon name="lucidePlus" /> Add facility</button>
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
        placeholder="Filter by name or building"
        aria-label="Filter facilities"
        (input)="filter.set($any($event.target).value)"
      />
    </div>

    <div class="surface-flat mt-4 overflow-hidden">
      @if (facilities.error()) {
        <app-error-state [error]="facilities.error()" (retry)="facilities.reload()" />
      } @else if (!facilities.hasValue()) {
        <div class="p-4"><app-list-skeleton [rows]="5" label="Loading facilities" /></div>
      } @else if (rows().length === 0) {
        <app-empty-state
          title="No facilities"
          description="Add the first room, lab or piece of equipment."
        />
      } @else {
        <div class="overflow-x-auto">
          <table class="admin-table">
            <caption class="sr-only">
              Facilities
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" class="max-md:hidden">Building</th>
                <th scope="col" class="max-sm:hidden">Type</th>
                <th scope="col" class="text-end max-sm:hidden">Capacity</th>
                <th scope="col">Status</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (f of rows(); track f.id) {
                <tr>
                  <td>
                    <p class="font-medium">{{ f.title }}</p>
                    <p class="text-muted-foreground text-xs">{{ f.location }}</p>
                  </td>
                  <td class="max-md:hidden">{{ f.building }}</td>
                  <td class="max-sm:hidden">{{ f.type }}</td>
                  <td class="tabular text-end max-sm:hidden">{{ f.capacity }}</td>
                  <td><app-status-badge [status]="f.status" /></td>
                  <td>
                    <div class="flex justify-end gap-1">
                      <button
                        hlmBtn
                        variant="ghost"
                        size="icon-sm"
                        (click)="edit(f)"
                        [attr.aria-label]="'Edit ' + f.title"
                        title="Edit"
                      >
                        <ng-icon name="lucidePencil" />
                      </button>
                      <button
                        hlmBtn
                        variant="ghost"
                        size="icon-sm"
                        class="hover:text-destructive"
                        (click)="toDelete.set(f)"
                        [attr.aria-label]="'Delete ' + f.title"
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

    <app-facility-form-dialog
      [(open)]="formOpen"
      [facility]="editing()"
      (saved)="facilities.reload()"
    />

    <app-confirm-dialog
      [open]="!!toDelete()"
      (openChange)="!$event && toDelete.set(null)"
      title="Delete this facility?"
      [description]="
        (toDelete()?.title ?? '') +
        ' will be removed from search. To pause bookings for a while, set it to Maintenance instead.'
      "
      confirmLabel="Delete"
      cancelLabel="Cancel"
      [destructive]="true"
      [busy]="deleting()"
      (confirm)="remove()"
    />
  `,
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
