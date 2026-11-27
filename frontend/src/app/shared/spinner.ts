import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Small ring spinner for buttons and inline "working" states. Uses currentColor, so it
 * matches the button's text. Decorative: the button label ("Signing in…") says what's happening.
 */
@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'inline-block size-4 shrink-0' },
  template: `
    <svg viewBox="0 0 16 16" class="spinner size-full">
      <circle
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        opacity="0.25"
      />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
  `,
  styles: `
    .spinner {
      animation: spin 700ms linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Spinner {}
