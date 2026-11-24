import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../../core/auth/auth.store';
import { errorMessage, fieldErrors, statusOf } from '../../core/util/errors';
import { FormField } from '../../shared/form-field';
import { AuthLayout } from './auth-layout';

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
  imports: [ReactiveFormsModule, RouterLink, HlmButton, HlmInput, AuthLayout, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-layout
      title="Create your account"
      subtitle="Students and faculty get the same access to rooms, labs and events."
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

        <fieldset class="flex flex-col gap-1.5">
          <legend class="mb-1.5 text-sm font-medium">I am</legend>
          <div class="bg-muted grid grid-cols-2 gap-1 rounded-xl p-1">
            @for (role of roles; track role) {
              <label
                class="has-checked:bg-card has-checked:text-foreground has-checked:shadow-raised has-focus-visible:ring-ring/50 text-muted-foreground relative flex h-9 cursor-pointer items-center justify-center rounded-[0.6rem] text-sm font-medium transition-[background-color,box-shadow,color] has-focus-visible:ring-3"
              >
                <input type="radio" class="sr-only" formControlName="role" [value]="role" />
                {{ role === 'Student' ? 'a student' : 'faculty staff' }}
              </label>
            }
          </div>
        </fieldset>

        <app-form-field label="Full name" for="name" [error]="error('name')">
          <input
            hlmInput
            id="name"
            autocomplete="name"
            formControlName="name"
            [attr.aria-invalid]="!!error('name')"
            aria-describedby="name-error"
          />
        </app-form-field>

        <app-form-field
          label="University ID"
          for="universityId"
          [error]="error('universityId')"
          hint="On your faculty ID card, e.g. 2022170045."
        >
          <input
            hlmInput
            id="universityId"
            class="tabular"
            formControlName="universityId"
            [attr.aria-invalid]="!!error('universityId')"
            aria-describedby="universityId-error universityId-hint"
          />
        </app-form-field>

        <app-form-field label="University email" for="email" [error]="error('email')">
          <input
            hlmInput
            id="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            placeholder="name@cis.asu.edu.eg"
            formControlName="email"
            [attr.aria-invalid]="!!error('email')"
            aria-describedby="email-error"
          />
        </app-form-field>

        <app-form-field
          label="Password"
          for="password"
          [error]="error('password')"
          hint="At least 8 characters."
        >
          <input
            hlmInput
            id="password"
            type="password"
            autocomplete="new-password"
            formControlName="password"
            [attr.aria-invalid]="!!error('password')"
            aria-describedby="password-error password-hint"
          />
        </app-form-field>

        <button hlmBtn size="lg" type="submit" class="mt-2 w-full" [disabled]="busy()">
          {{ busy() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p footer>
        Already have an account?
        <a routerLink="/login" class="text-primary font-medium hover:underline">Sign in</a>
      </p>
    </app-auth-layout>
  `,
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
