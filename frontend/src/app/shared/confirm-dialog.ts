import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

/**
 * "Are you sure?" for actions that can't be undone (cancel a booking, delete a facility).
 * Used sparingly, so people still read it when it appears (apple-design: Agency).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmDialogImports, BrnDialogContent, HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-dialog [state]="open() ? 'open' : 'closed'" (closed)="open.set(false)">
      <hlm-dialog-content *brnDialogContent="let ctx" class="sm:max-w-sm" [showCloseButton]="false">
        <hlm-dialog-header>
          <h2 hlmDialogTitle class="text-lg font-semibold">{{ title() }}</h2>
          <p hlmDialogDescription class="text-muted-foreground text-sm">{{ description() }}</p>
        </hlm-dialog-header>
        <hlm-dialog-footer class="gap-2">
          <button hlmBtn variant="outline" (click)="open.set(false)" [disabled]="busy()">
            {{ cancelLabel() }}
          </button>
          <button
            hlmBtn
            [variant]="destructive() ? 'destructive' : 'default'"
            (click)="confirm.emit()"
            [disabled]="busy()"
          >
            {{ busy() ? 'Working…' : confirmLabel() }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class ConfirmDialog {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly description = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Keep it');
  readonly destructive = input(false);
  readonly busy = input(false);
  readonly confirm = output<void>();
}
