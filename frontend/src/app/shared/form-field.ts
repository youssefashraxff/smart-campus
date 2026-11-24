import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Label + control + hint/error, wired for screen readers: the error has role="alert" and an id
 * the control can point at with aria-describedby.
 */
@Component({
  selector: 'app-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <label [for]="for()" class="text-sm font-medium">
      {{ label() }}
      @if (optional()) {
        <span class="text-muted-foreground font-normal">(optional)</span>
      }
    </label>
    <ng-content />
    @if (error()) {
      <p [id]="for() + '-error'" role="alert" class="text-destructive text-xs">{{ error() }}</p>
    } @else if (hint()) {
      <p [id]="for() + '-hint'" class="text-muted-foreground text-xs">{{ hint() }}</p>
    }
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly for = input.required<string>();
  readonly error = input<string | null>(null);
  readonly hint = input<string>();
  readonly optional = input(false);
}
