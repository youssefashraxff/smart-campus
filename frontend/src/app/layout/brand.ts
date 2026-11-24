import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Logo mark + name. The mark is a small arch: a campus gate. */
@Component({
  selector: 'app-brand',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/" class="flex items-center gap-2.5 rounded-xl" aria-label="Smart Campus home">
      <span
        class="bg-primary shadow-primary grid size-9 place-items-center rounded-[0.8rem] text-white"
        aria-hidden="true"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20V11a8 8 0 0 1 16 0v9"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <path
            d="M9 20v-6a3 3 0 0 1 6 0v6"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="6.5" r="1.4" fill="var(--sun)" />
        </svg>
      </span>
      <span class="leading-tight">
        <span class="block text-[0.9375rem] font-semibold tracking-tight">Smart Campus</span>
        <span class="text-muted-foreground block text-[0.6875rem]"
          ><abbr
            class="[font-variant-caps:normal]"
            title="Faculty of Computer and Information Sciences"
            >FCIS</abbr
          >
          · Ain Shams</span
        >
      </span>
    </a>
  `,
})
export class Brand {}
