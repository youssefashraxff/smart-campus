import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';

/**
 * Wraps a password input and adds a show/hide button on its right edge. The input stays in the parent's
 * template, so its formControlName keeps working; the parent reads visible() to pick the input's type:
 *
 *   <app-password-toggle #toggle>
 *     <input [type]="toggle.visible() ? 'text' : 'password'" ... />
 *   </app-password-toggle>
 */
@Component({
  selector: 'app-password-toggle',
  imports: [NgIcon],
  providers: [provideIcons({ lucideEye, lucideEyeOff })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  templateUrl: './password-toggle.html',
  styleUrl: './password-toggle.css',
})
export class PasswordToggle {
  /** Hidden by default */
  readonly visible = signal(false);
}
