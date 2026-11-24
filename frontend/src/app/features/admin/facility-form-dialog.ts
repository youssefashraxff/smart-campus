import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { CatalogApi } from '../../core/api/catalog.api';
import { Facility, FacilityStatus, FacilityType } from '../../core/models';
import { errorMessage, fieldErrors } from '../../core/util/errors';
import { FACILITY_TYPES } from '../../shared/facility-type';
import { FormField } from '../../shared/form-field';

/** Add or edit a facility (FR-A1). Setting status to Maintenance stops new bookings (FR-A2). */
@Component({
  selector: 'app-facility-form-dialog',
  imports: [
    ReactiveFormsModule,
    HlmDialogImports,
    BrnDialogContent,
    HlmButton,
    HlmInput,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (closed)="open.set(false)">
      <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-lg">
        <hlm-dialog-header>
          <h2 hlmDialogTitle class="text-lg font-semibold">
            {{ facility() ? 'Edit facility' : 'Add a facility' }}
          </h2>
          <p hlmDialogDescription class="text-muted-foreground text-sm">
            Students see these details when they search and book.
          </p>
        </hlm-dialog-header>

        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="flex flex-col gap-4"
          novalidate
          id="facility-form"
        >
          <app-form-field label="Name" for="f-title" [error]="error('title', 'Enter a name.')">
            <input hlmInput id="f-title" formControlName="title" placeholder="Study Room A-305" />
          </app-form-field>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field
              label="Building"
              for="f-building"
              [error]="error('building', 'Enter a building.')"
            >
              <input
                hlmInput
                id="f-building"
                formControlName="building"
                placeholder="FCIS Building A"
              />
            </app-form-field>
            <app-form-field
              label="Location"
              for="f-location"
              [error]="error('location', 'Enter where it is.')"
            >
              <input hlmInput id="f-location" formControlName="location" placeholder="3rd floor" />
            </app-form-field>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <app-form-field label="Type" for="f-type">
              <select id="f-type" class="select-native" formControlName="type">
                @for (t of types; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </app-form-field>
            <app-form-field
              label="Capacity"
              for="f-capacity"
              [error]="error('capacity', 'At least 1.')"
            >
              <input
                hlmInput
                id="f-capacity"
                class="tabular"
                type="number"
                min="1"
                formControlName="capacity"
              />
            </app-form-field>
            <app-form-field label="Status" for="f-status">
              <select id="f-status" class="select-native" formControlName="status">
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </app-form-field>
          </div>
        </form>

        <hlm-dialog-footer class="gap-2">
          <button hlmBtn variant="outline" type="button" (click)="open.set(false)">Cancel</button>
          <button hlmBtn type="submit" form="facility-form" [disabled]="busy()">
            {{ busy() ? 'Saving…' : facility() ? 'Save changes' : 'Add facility' }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class FacilityFormDialog {
  private readonly api = inject(CatalogApi);

  readonly open = model(false);
  /** null = create a new facility */
  readonly facility = input<Facility | null>(null);
  readonly saved = output<Facility>();

  protected readonly types = FACILITY_TYPES;
  protected readonly busy = signal(false);
  private readonly submitted = signal(false);
  private readonly serverErrors = signal<Record<string, string>>({});

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', Validators.required],
    building: ['', Validators.required],
    location: ['', Validators.required],
    capacity: [1, [Validators.required, Validators.min(1)]],
    type: ['Room' as FacilityType],
    status: ['Available' as FacilityStatus],
  });

  constructor() {
    // Fill the form each time the dialog opens
    effect(() => {
      if (!this.open()) return;
      const f = this.facility();
      this.submitted.set(false);
      this.serverErrors.set({});
      this.form.reset(
        f
          ? { ...f }
          : {
              title: '',
              building: '',
              location: '',
              capacity: 1,
              type: 'Room',
              status: 'Available',
            },
      );
    });
  }

  protected error(name: keyof typeof this.form.controls, message: string): string | null {
    const server = this.serverErrors()[name];
    if (server) return server;
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted()) ? message : null;
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.busy.set(true);
    const body = this.form.getRawValue();
    const existing = this.facility();
    const request = existing
      ? this.api.updateFacility(existing.id, body)
      : this.api.createFacility(body);
    request.subscribe({
      next: (result) => {
        this.busy.set(false);
        this.open.set(false);
        toast.success(existing ? 'Facility updated' : 'Facility added', {
          description: result.title,
        });
        this.saved.emit(result);
      },
      error: (err) => {
        this.busy.set(false);
        this.serverErrors.set(fieldErrors(err));
        toast.error('Couldn’t save the facility', { description: errorMessage(err) });
      },
    });
  }
}
