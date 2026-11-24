import { Directive } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmDialogFooter],hlm-dialog-footer',
  exportAs: 'hlmDialogFooter',
  host: { 'data-slot': 'dialog-footer' },
})
export class HlmDialogFooter {
  constructor() {
    classes(
      () =>
        'bg-muted/50 -mx-6 -mb-6 rounded-b-3xl border-t px-6 py-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
    );
  }
}
