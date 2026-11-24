import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The top of every page: one h1, an optional short description, and actions on the right */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between' },
  template: `
    <div class="min-w-0">
      @if (eyebrow()) {
        <p class="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
          {{ eyebrow() }}
        </p>
      }
      <h1 class="text-[clamp(1.5rem,1.1rem+1.4vw,2rem)] font-semibold">{{ title() }}</h1>
      @if (description()) {
        <p class="text-muted-foreground mt-1.5 max-w-prose text-sm">{{ description() }}</p>
      }
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <ng-content />
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly eyebrow = input<string>();
}
