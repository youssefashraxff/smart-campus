import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { environment } from '../../../../environments/environment';
import { AuthStore } from '../../../core/auth/auth.store';
import { errorMessage, statusOf } from '../../../core/util/errors';
import { FormField } from '../../../shared/form-field';
import { AuthLayout } from '../auth-layout/auth-layout';
import { PasswordToggle } from '../password-toggle/password-toggle';

/** FR-U2: sign in and receive the JWT used on every later request */
@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    AuthLayout,
    FormField,
    PasswordToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** Set by authGuard when it sent you here from a protected page */
  readonly returnUrl = input<string>();

  protected readonly production = environment.production;
  protected readonly demoAccounts = [
    { label: 'Student', email: 'ahmed.mostafa@cis.asu.edu.eg', password: 'Campus@2026' },
    { label: 'Admin', email: 'facilities.admin@cis.asu.edu.eg', password: 'Admin@2026' },
  ];

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly busy = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected showError(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected fill(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.busy.set(true);
    this.serverError.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl() || '/'),
      error: (err) => {
        this.busy.set(false);
        this.serverError.set(
          statusOf(err) === 401
            ? 'That email and password don’t match an account.'
            : errorMessage(err),
        );
      },
    });
  }
}
