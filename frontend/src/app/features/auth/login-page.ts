import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth.store';
import { errorMessage, statusOf } from '../../core/util/errors';
import { FormField } from '../../shared/form-field';
import { AuthLayout } from './auth-layout';

/** FR-U2: sign in and receive the JWT used on every later request */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmInput, AuthLayout, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout
      title="Sign in"
      subtitle="Use your university email to book rooms and join events."
    >
      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4" novalidate>
        @if (serverError()) {
          <p
            role="alert"
            class="bg-destructive-soft text-destructive rounded-xl px-3.5 py-2.5 text-sm"
          >
            {{ serverError() }}
          </p>
        }

        <app-form-field
          label="Email"
          for="email"
          [error]="showError('email') ? 'Enter your university email.' : null"
        >
          <input
            hlmInput
            id="email"
            type="email"
            autocomplete="username"
            inputmode="email"
            placeholder="name@cis.asu.edu.eg"
            formControlName="email"
            [attr.aria-invalid]="showError('email')"
            aria-describedby="email-error"
          />
        </app-form-field>

        <app-form-field
          label="Password"
          for="password"
          [error]="showError('password') ? 'Enter your password.' : null"
        >
          <input
            hlmInput
            id="password"
            type="password"
            autocomplete="current-password"
            formControlName="password"
            [attr.aria-invalid]="showError('password')"
            aria-describedby="password-error"
          />
        </app-form-field>

        <button hlmBtn size="lg" type="submit" class="mt-2 w-full" [disabled]="busy()">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      @if (!production) {
        <details class="bg-muted/60 mt-6 rounded-xl px-3.5 py-3 text-xs">
          <summary class="text-muted-foreground cursor-pointer font-medium">
            Demo accounts (seed data)
          </summary>
          <div class="mt-3 flex flex-col gap-2">
            @for (account of demoAccounts; track account.email) {
              <button
                type="button"
                class="hover:bg-card flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-start transition-colors"
                (click)="fill(account.email, account.password)"
              >
                <span class="min-w-0">
                  <span class="block font-medium">{{ account.label }}</span>
                  <span class="text-muted-foreground block truncate">{{ account.email }}</span>
                </span>
                <span class="text-primary shrink-0 font-medium">Use</span>
              </button>
            }
          </div>
        </details>
      }

      <p footer>
        New to Smart Campus?
        <a
          routerLink="/register"
          class="text-primary font-medium underline-offset-[0.2em] hover:underline"
          >Create an account</a
        >
      </p>
    </app-auth-layout>
  `,
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
