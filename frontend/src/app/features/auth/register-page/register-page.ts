import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../../../core/auth/auth.store';
import { errorMessage, fieldErrors, statusOf } from '../../../core/util/errors';
import { FormField } from '../../../shared/form-field';
import { AuthLayout } from '../auth-layout/auth-layout';
import { PasswordToggle } from '../password-toggle/password-toggle';
import { Spinner } from '../../../shared/spinner';

type Field = 'name' | 'universityId' | 'email' | 'password';

const MESSAGES: Record<Field, string> = {
  name: 'Enter your full name.',
  universityId: 'Enter your university ID (up to 20 characters).',
  email: 'Enter a valid email address.',
  password: 'Use 8 to 72 characters.',
};

/** FR-U1: create a Student or Faculty account. Admins are seeded, never self-registered. */
@Component({
  selector: 'app-register-page',
  imports: [
    Spinner,
    ReactiveFormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    AuthLayout,
    FormField,
    PasswordToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.html',
  styleUrl: './register-page.css',
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly roles = ['Student', 'Faculty'] as const;
  // Same limits as RegisterRequest.java, so most mistakes are caught before the request
  protected readonly form = inject(NonNullableFormBuilder).group({
    role: ['Student' as 'Student' | 'Faculty'],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    universityId: ['', [Validators.required, Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  protected readonly busy = signal(false);
  protected readonly serverError = signal<string | null>(null);
  /** Messages from the server's 400 response, keyed by field */
  private readonly serverFieldErrors = signal<Record<string, string>>({});
  private readonly submitted = signal(false);

  protected error(field: Field): string | null {
    const server = this.serverFieldErrors()[field];
    if (server) return server;
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted()) ? MESSAGES[field] : null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.serverFieldErrors.set({});
    if (this.form.invalid) return;

    this.busy.set(true);
    this.serverError.set(null);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: (err) => {
        this.busy.set(false);
        this.serverFieldErrors.set(fieldErrors(err));
        this.serverError.set(
          statusOf(err) === 409
            ? 'An account with that email or university ID already exists.'
            : errorMessage(err),
        );
      },
    });
  }
}
