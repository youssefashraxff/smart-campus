import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucidePlus, lucideTrash2 } from '@ng-icons/lucide';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { CatalogApi } from '../../core/api/catalog.api';
import { CampusEvent, Speaker } from '../../core/models';
import { errorMessage } from '../../core/util/errors';
import { FormField } from '../../shared/form-field';
import { ListSkeleton } from '../../shared/states';

/** FR-A4: manage one event's speakers. List on top, add/edit form underneath. */
@Component({
  selector: 'app-speakers-dialog',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmDialogImports,
    BrnDialogContent,
    HlmButton,
    HlmInput,
    HlmTextarea,
    FormField,
    ListSkeleton,
  ],
  providers: [provideIcons({ lucidePencil, lucideTrash2, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (closed)="open.set(false)">
      <hlm-dialog-content
        *brnDialogContent="let ctx"
        class="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
      >
        <hlm-dialog-header>
          <h2 hlmDialogTitle class="text-lg font-semibold">Speakers</h2>
          <p hlmDialogDescription class="text-muted-foreground text-sm">{{ event()?.title }}</p>
        </hlm-dialog-header>

        @if (loading()) {
          <app-list-skeleton [rows]="2" label="Loading speakers" />
        } @else if (speakers().length === 0) {
          <p class="text-muted-foreground bg-muted/60 rounded-xl px-4 py-3 text-sm">
            No speakers yet. Add the first one below.
          </p>
        } @else {
          <ul class="divide-border surface-flat divide-y" role="list">
            @for (s of speakers(); track s.id) {
              <li class="flex items-start gap-3 p-3.5" [class.bg-brand-soft]="editingId() === s.id">
                <div class="min-w-0 flex-1">
                  <p class="font-medium">{{ s.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ s.affiliation }}</p>
                </div>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon-sm"
                  (click)="startEdit(s)"
                  [attr.aria-label]="'Edit ' + s.name"
                >
                  <ng-icon name="lucidePencil" />
                </button>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon-sm"
                  class="hover:text-destructive"
                  (click)="remove(s)"
                  [attr.aria-label]="'Remove ' + s.name"
                >
                  <ng-icon name="lucideTrash2" />
                </button>
              </li>
            }
          </ul>
        }

        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3" novalidate>
          <h3 class="text-sm font-semibold">
            {{ editingId() ? 'Edit speaker' : 'Add a speaker' }}
          </h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <app-form-field label="Name" for="s-name"
              ><input hlmInput id="s-name" formControlName="name"
            /></app-form-field>
            <app-form-field label="Affiliation" for="s-affiliation"
              ><input hlmInput id="s-affiliation" formControlName="affiliation"
            /></app-form-field>
          </div>
          <app-form-field label="Short bio" for="s-bio">
            <textarea hlmTextarea id="s-bio" rows="2" formControlName="bio"></textarea>
          </app-form-field>
          <div class="flex justify-end gap-2">
            @if (editingId()) {
              <button hlmBtn variant="ghost" type="button" (click)="resetForm()">
                Cancel edit
              </button>
            }
            <button hlmBtn type="submit" [disabled]="form.invalid || busy()">
              @if (!editingId()) {
                <ng-icon name="lucidePlus" />
              }
              {{ busy() ? 'Saving…' : editingId() ? 'Save speaker' : 'Add speaker' }}
            </button>
          </div>
        </form>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class SpeakersDialog {
  private readonly api = inject(CatalogApi);

  readonly open = model(false);
  readonly event = input<CampusEvent | null>(null);

  protected readonly speakers = signal<Speaker[]>([]);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    affiliation: ['', Validators.required],
    bio: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const e = this.event();
      if (this.open() && e) this.load(e.id);
    });
  }

  private load(eventId: number): void {
    this.loading.set(true);
    this.resetForm();
    this.api.listSpeakers(eventId).subscribe({
      next: (list) => {
        this.speakers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        toast.error('Couldn’t load speakers', { description: errorMessage(err) });
      },
    });
  }

  protected startEdit(s: Speaker): void {
    this.editingId.set(s.id);
    this.form.setValue({ name: s.name, affiliation: s.affiliation, bio: s.bio });
    queueMicrotask(() => document.getElementById('s-name')?.focus());
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', affiliation: '', bio: '' });
  }

  protected save(): void {
    const e = this.event();
    if (!e || this.form.invalid) return;
    const id = this.editingId();
    this.busy.set(true);
    (id
      ? this.api.updateSpeaker(e.id, id, this.form.getRawValue())
      : this.api.addSpeaker(e.id, this.form.getRawValue())
    ).subscribe({
      next: (saved) => {
        this.busy.set(false);
        this.speakers.update((list) =>
          id ? list.map((s) => (s.id === id ? saved : s)) : [...list, saved],
        );
        this.resetForm();
      },
      error: (err) => {
        this.busy.set(false);
        toast.error('Couldn’t save the speaker', { description: errorMessage(err) });
      },
    });
  }

  protected remove(s: Speaker): void {
    const e = this.event();
    if (!e) return;
    // Removing a speaker is easy to redo, so no confirmation: an undo-style toast is enough
    this.api.deleteSpeaker(e.id, s.id).subscribe({
      next: () => {
        this.speakers.update((list) => list.filter((x) => x.id !== s.id));
        if (this.editingId() === s.id) this.resetForm();
        toast('Speaker removed', { description: s.name });
      },
      error: (err) =>
        toast.error('Couldn’t remove the speaker', { description: errorMessage(err) }),
    });
  }
}
