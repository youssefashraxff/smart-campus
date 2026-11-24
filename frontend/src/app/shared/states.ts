import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloudOff, lucideInbox, lucideRotateCw } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { errorMessage } from '../core/util/errors';

/** Shown when a list has nothing in it. Explains why and, when it helps, offers the next step. */
@Component({
  selector: 'app-empty-state',
  imports: [NgIcon],
  providers: [provideIcons({ lucideInbox })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', class: 'flex flex-col items-center px-6 py-12 text-center' },
  template: `
    <span
      class="bg-brand-soft text-brand-ink mb-4 grid size-12 place-items-center rounded-2xl"
      aria-hidden="true"
    >
      <ng-icon [name]="icon()" size="22" />
    </span>
    <h3 class="text-base font-semibold">{{ title() }}</h3>
    @if (description()) {
      <p class="text-muted-foreground mt-1 max-w-sm text-sm">{{ description() }}</p>
    }
    <div class="mt-5 flex gap-2 empty:hidden"><ng-content /></div>
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly icon = input('lucideInbox');
}

/** Shown when a request failed. Says what went wrong in plain words and offers a retry. */
@Component({
  selector: 'app-error-state',
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideCloudOff, lucideRotateCw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert', class: 'flex flex-col items-center px-6 py-12 text-center' },
  template: `
    <span
      class="bg-destructive-soft text-destructive mb-4 grid size-12 place-items-center rounded-2xl"
      aria-hidden="true"
    >
      <ng-icon name="lucideCloudOff" size="22" />
    </span>
    <h3 class="text-base font-semibold">{{ title() }}</h3>
    <p class="text-muted-foreground mt-1 max-w-sm text-sm">{{ message() }}</p>
    <button hlmBtn variant="outline" class="mt-5" (click)="retry.emit()">
      <ng-icon name="lucideRotateCw" />
      Try again
    </button>
  `,
})
export class ErrorState {
  readonly error = input<unknown>();
  readonly title = input('Couldn’t load this');
  readonly retry = output<void>();

  protected message() {
    return errorMessage(this.error());
  }
}

/** Placeholder rows while a list loads, so the layout doesn't jump when the data arrives */
@Component({
  selector: 'app-list-skeleton',
  imports: [HlmSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', 'aria-busy': 'true', class: 'block' },
  template: `
    <span class="sr-only">{{ label() }}</span>
    <div class="flex flex-col gap-3" aria-hidden="true">
      @for (row of rowsArray(); track $index) {
        <div class="flex items-center gap-4 rounded-2xl p-4">
          <hlm-skeleton class="size-11 shrink-0 rounded-xl" />
          <div class="flex flex-1 flex-col gap-2">
            <hlm-skeleton class="h-3.5 w-2/5" />
            <hlm-skeleton class="h-3 w-3/5" />
          </div>
        </div>
      }
    </div>
  `,
})
export class ListSkeleton {
  readonly rows = input(3);
  readonly label = input('Loading');
  protected rowsArray() {
    return Array.from({ length: this.rows() });
  }
}
