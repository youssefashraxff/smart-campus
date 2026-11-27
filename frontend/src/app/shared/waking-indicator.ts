import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { PendingRequests } from '../core/loading/pending-requests';

/** Show the indicator only once a request has waited this long; quick requests never see it. */
const SHOW_AFTER_SECONDS = 3;

/**
 * Floating "waking up the campus" card for slow requests. On Render's free tier the services
 * sleep when idle and need about a minute to boot, so instead of a frozen screen the user sees
 * a small campus skyline whose windows light up while they wait.
 * The six buildings stand for the six services (gateway, auth, catalog, booking, notifications, assistant).
 */
@Component({
  selector: 'app-waking-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="waking surface-raised" role="status" aria-live="polite">
        <svg class="skyline" viewBox="0 0 120 56" aria-hidden="true">
          <!-- buildings: x, width, height -->
          @for (b of buildings; track $index; let i = $index) {
            <rect
              [attr.x]="b.x"
              [attr.y]="52 - b.h"
              [attr.width]="b.w"
              [attr.height]="b.h"
              rx="2"
              class="building"
            />
            @for (w of b.windows; track $index; let j = $index) {
              <rect
                [attr.x]="w.x"
                [attr.y]="w.y"
                width="3"
                height="3"
                rx="0.75"
                class="window"
                [style.animation-delay.ms]="(i * 3 + j) * 140"
              />
            }
          }
          <line x1="2" y1="52.5" x2="118" y2="52.5" class="ground" />
        </svg>

        <div class="min-w-0">
          <p class="text-sm font-semibold">{{ title() }}</p>
          <p class="detail text-muted-foreground mt-0.5 text-xs">{{ detail() }}</p>
        </div>
        <span class="text-muted-foreground tabular ms-auto shrink-0 text-xs" aria-hidden="true">
          {{ waited() }}&nbsp;s
        </span>
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset-inline: 0;
      bottom: 1.5rem;
      z-index: 60;
      display: flex;
      justify-content: center;
      padding-inline: 1rem;
      pointer-events: none;
    }
    .waking {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      width: min(100%, 26rem);
      padding: 0.875rem 1.25rem 0.875rem 1rem;
      transition:
        opacity 300ms var(--ease-out),
        transform 300ms var(--ease-out);
      @starting-style {
        opacity: 0;
        transform: translateY(0.5rem) scale(0.98);
      }
    }
    .skyline {
      width: 5rem;
      flex-shrink: 0;
    }
    /* Phones: sit at the top so it never covers the form or its submit button, and stay compact */
    @media (max-width: 639px) {
      :host {
        bottom: auto;
        top: 0.75rem;
      }
      .waking {
        gap: 0.75rem;
        padding: 0.75rem 1rem 0.75rem 0.75rem;
        @starting-style {
          opacity: 0;
          transform: translateY(-0.5rem) scale(0.98);
        }
      }
      .skyline {
        width: 3.25rem;
      }
      .detail {
        display: none;
      }
    }
    .building {
      fill: var(--primary);
    }
    .ground {
      stroke: var(--border);
      stroke-width: 1;
    }
    /* Windows switch on in sequence, hold, then dim: a campus waking up floor by floor */
    .window {
      fill: var(--sun);
      opacity: 0.18;
      animation: light 2.6s var(--ease-out) infinite;
    }
    @keyframes light {
      0%,
      100% {
        opacity: 0.18;
      }
      25%,
      70% {
        opacity: 1;
      }
    }
    /* Reduced motion: the global rule stops the loop; show the windows lit instead of dimmed */
    @media (prefers-reduced-motion: reduce) {
      .window {
        opacity: 1;
      }
    }
  `,
})
export class WakingIndicator {
  private readonly pending = inject(PendingRequests);

  protected readonly waited = this.pending.waitedSeconds;
  protected readonly visible = computed(() => this.waited() >= SHOW_AFTER_SECONDS);

  /** On Render the services sleep when idle; locally a slow answer just means a slow server */
  private readonly sleepyHost = environment.wakeUpUrls.length > 0;

  protected readonly title = computed(() => {
    const s = this.waited();
    if (!this.sleepyHost) return 'Still working…';
    if (s < 20) return 'Waking up the campus servers…';
    if (s < 60) return 'Starting the services…';
    return 'Almost there…';
  });

  protected readonly detail = computed(() =>
    this.sleepyHost
      ? 'The demo sleeps when nobody uses it. The first request takes about a minute.'
      : 'The server is taking longer than usual.',
  );

  /** Six buildings of different heights, each with a small grid of windows */
  protected readonly buildings = [
    { x: 4, w: 14, h: 30 },
    { x: 22, w: 18, h: 44 },
    { x: 44, w: 14, h: 24 },
    { x: 62, w: 16, h: 38 },
    { x: 82, w: 14, h: 28 },
    { x: 100, w: 16, h: 34 },
  ].map((b) => ({ ...b, windows: windowsFor(b.x, b.w, b.h) }));
}

/** A 2-column grid of windows, every 7 units up the building, leaving a gap at the top */
function windowsFor(x: number, w: number, h: number): { x: number; y: number }[] {
  const cols = [x + w / 2 - 4.5, x + w / 2 + 1.5];
  const windows: { x: number; y: number }[] = [];
  for (let y = 52 - h + 5; y <= 52 - 7; y += 7) {
    for (const cx of cols) windows.push({ x: cx, y });
  }
  return windows;
}
