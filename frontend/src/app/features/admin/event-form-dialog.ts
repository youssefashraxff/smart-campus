import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { CatalogApi } from '../../core/api/catalog.api';
import { CampusEvent, EventStatus } from '../../core/models';
import { errorMessage, fieldErrors } from '../../core/util/errors';
import { campusToday, toCampusDate, toCampusIso, toCampusTime } from '../../core/util/time';
import { FormField } from '../../shared/form-field';

/**
 * Add or edit an event (FR-A3). Changing the time or setting "Cancelled" makes the Facility Catalog
 * notify everyone registered (FR-A5), so the dialog says so before you save.
 */
@Component({
  selector: 'app-event-form-dialog',
  imports: [
    ReactiveFormsModule,
    HlmDialogImports,
    BrnDialogContent,
    HlmButton,
    HlmInput,
    HlmTextarea,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (closed)="open.set(false)">
      <hlm-dialog-content
        *brnDialogContent="let ctx"
        class="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl"
      >
        <hlm-dialog-header>
          <h2 hlmDialogTitle class="text-lg font-semibold">
            {{ event() ? 'Edit event' : 'Add an event' }}
          </h2>
          <p hlmDialogDescription class="text-muted-foreground text-sm">
            Times are campus time (Cairo).
          </p>
        </hlm-dialog-header>

        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="flex flex-col gap-4"
          novalidate
          id="event-form"
        >
          <app-form-field label="Title" for="e-title" [error]="error('title', 'Enter a title.')">
            <input hlmInput id="e-title" formControlName="title" />
          </app-form-field>
          <app-form-field
            label="Description"
            for="e-description"
            [error]="error('description', 'Add a short description.')"
          >
            <textarea
              hlmTextarea
              id="e-description"
              rows="3"
              formControlName="description"
            ></textarea>
          </app-form-field>
          <div class="grid gap-4 sm:grid-cols-2">
            <app-form-field
              label="Category"
              for="e-category"
              [error]="error('category', 'Enter a category.')"
              hint="e.g. Workshop, Talk, Competition"
            >
              <input hlmInput id="e-category" formControlName="category" list="category-options" />
              <datalist id="category-options">
                @for (c of categories(); track c) {
                  <option [value]="c"></option>
                }
              </datalist>
            </app-form-field>
            <app-form-field
              label="Capacity"
              for="e-capacity"
              [error]="error('capacity', 'At least 1 seat.')"
            >
              <input
                hlmInput
                id="e-capacity"
                class="tabular"
                type="number"
                min="1"
                formControlName="capacity"
              />
            </app-form-field>
            <app-form-field
              label="Building"
              for="e-building"
              [error]="error('building', 'Enter a building.')"
            >
              <input hlmInput id="e-building" formControlName="building" />
            </app-form-field>
            <app-form-field
              label="Location"
              for="e-location"
              [error]="error('location', 'Enter a room or hall.')"
            >
              <input hlmInput id="e-location" formControlName="location" />
            </app-form-field>
          </div>
          <div class="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
            <app-form-field label="Date" for="e-date">
              <input hlmInput id="e-date" class="tabular" type="date" formControlName="date" />
            </app-form-field>
            <app-form-field label="Starts" for="e-start">
              <input
                hlmInput
                id="e-start"
                class="tabular"
                type="time"
                step="900"
                formControlName="start"
              />
            </app-form-field>
            <app-form-field label="Ends" for="e-end" [error]="timeError()">
              <input
                hlmInput
                id="e-end"
                class="tabular"
                type="time"
                step="900"
                formControlName="end"
              />
            </app-form-field>
          </div>
          <app-form-field label="Status" for="e-status">
            <select id="e-status" class="select-native" formControlName="status">
              <option value="Scheduled">Scheduled</option>
              <option value="Changed">Changed (rescheduled)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </app-form-field>

          @if (notifies()) {
            <p role="status" class="bg-warning-soft text-warning rounded-xl px-3.5 py-2.5 text-sm">
              Everyone registered for this event will get an alert and an email about this change.
            </p>
          }
        </form>

        <hlm-dialog-footer class="gap-2">
          <button hlmBtn variant="outline" type="button" (click)="open.set(false)">Cancel</button>
          <button hlmBtn type="submit" form="event-form" [disabled]="busy()">
            {{ busy() ? 'Saving…' : event() ? 'Save changes' : 'Add event' }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class EventFormDialog {
  private readonly api = inject(CatalogApi);

  readonly open = model(false);
  readonly event = input<CampusEvent | null>(null);
  readonly categories = input<string[]>([]);
  readonly saved = output<CampusEvent>();

  protected readonly busy = signal(false);
  private readonly submitted = signal(false);
  private readonly serverErrors = signal<Record<string, string>>({});
  /** Bumped on every form change, so computed() below re-runs */
  private readonly changes = signal(0);

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    building: ['', Validators.required],
    location: ['', Validators.required],
    capacity: [30, [Validators.required, Validators.min(1)]],
    date: [campusToday(), Validators.required],
    start: ['10:00', Validators.required],
    end: ['12:00', Validators.required],
    status: ['Scheduled' as EventStatus],
  });

  protected readonly timeError = computed(() => {
    this.changes();
    const { start, end } = this.form.getRawValue();
    return start && end && end <= start ? 'Must be after the start time.' : null;
  });

  /** Editing an event's time, or cancelling it, notifies registrants (FR-A5) */
  protected readonly notifies = computed(() => {
    this.changes();
    const e = this.event();
    if (!e) return false;
    const v = this.form.getRawValue();
    const timeChanged =
      toCampusIso(v.date, v.start) !==
        toCampusIso(toCampusDate(e.startTime), toCampusTime(e.startTime)) ||
      toCampusIso(v.date, v.end) !== toCampusIso(toCampusDate(e.endTime), toCampusTime(e.endTime));
    return timeChanged || (v.status === 'Cancelled' && e.status !== 'Cancelled');
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.changes.update((n) => n + 1));
    effect(() => {
      if (!this.open()) return;
      const e = this.event();
      this.submitted.set(false);
      this.serverErrors.set({});
      this.form.reset(
        e
          ? {
              ...e,
              date: toCampusDate(e.startTime),
              start: toCampusTime(e.startTime),
              end: toCampusTime(e.endTime),
            }
          : {
              title: '',
              description: '',
              category: '',
              building: '',
              location: '',
              capacity: 30,
              date: campusToday(),
              start: '10:00',
              end: '12:00',
              status: 'Scheduled',
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
    if (this.form.invalid || this.timeError()) return;
    const { date, start, end, ...rest } = this.form.getRawValue();
    const body = { ...rest, startTime: toCampusIso(date, start), endTime: toCampusIso(date, end) };
    const existing = this.event();
    this.busy.set(true);
    (existing ? this.api.updateEvent(existing.id, body) : this.api.createEvent(body)).subscribe({
      next: (result) => {
        this.busy.set(false);
        this.open.set(false);
        toast.success(existing ? 'Event updated' : 'Event added', { description: result.title });
        this.saved.emit(result);
      },
      error: (err) => {
        this.busy.set(false);
        this.serverErrors.set(fieldErrors(err));
        toast.error('Couldn’t save the event', { description: errorMessage(err) });
      },
    });
  }
}
