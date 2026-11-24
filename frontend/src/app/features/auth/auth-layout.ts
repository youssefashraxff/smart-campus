import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Brand } from '../../layout/brand';

/** Shared frame for the sign-in and register pages */
@Component({
  selector: 'app-auth-layout',
  imports: [Brand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center' },
  template: `
    <div class="w-full max-w-[25rem]">
      <div class="mb-8 flex justify-center"><app-brand /></div>
      <div class="surface-raised p-6 sm:p-8">
        <h1 class="text-2xl font-semibold">{{ title() }}</h1>
        <p class="text-muted-foreground mt-1.5 text-sm">{{ subtitle() }}</p>
        <div class="mt-6"><ng-content /></div>
      </div>
      <div class="text-muted-foreground mt-6 text-center text-sm">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}
