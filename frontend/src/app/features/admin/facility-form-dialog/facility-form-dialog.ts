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
import { CatalogApi } from '../../../core/api/catalog.api';
import { Facility, FacilityStatus, FacilityType } from '../../../core/models';
import { errorMessage, fieldErrors } from '../../../core/util/errors';
import { FACILITY_TYPES } from '../../../shared/facility-type';
import { FormField } from '../../../shared/form-field';
import { Spinner } from '../../../shared/spinner';

/** Add or edit a facility (FR-A1). Setting status to Maintenance stops new bookings (FR-A2). */
@Component({
  selector: 'app-facility-form-dialog',
  imports: [
    Spinner,
    ReactiveFormsModule,
    HlmDialogImports,
    BrnDialogContent,
    HlmButton,
    HlmInput,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './facility-form-dialog.html',
  styleUrl: './facility-form-dialog.css',
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
