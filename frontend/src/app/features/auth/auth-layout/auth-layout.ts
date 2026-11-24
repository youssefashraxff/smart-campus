import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Brand } from '../../../layout/brand';

/** Shared frame for the sign-in and register pages */
@Component({
  selector: 'app-auth-layout',
  imports: [Brand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center' },
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}
