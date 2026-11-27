import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks the gateway requests that are still waiting for an answer, so the app can show
 * the "waking up" indicator (shared/waking-indicator.ts) when one takes unusually long.
 */
@Injectable({ providedIn: 'root' })
export class PendingRequests {
  /** Start time (ms) of every request still in flight, keyed by an id */
  private readonly started = signal<ReadonlyMap<number, number>>(new Map());
  private nextId = 0;

  /** Ticks every second while something is pending, so `waitedSeconds` updates live */
  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | undefined;

  /** Seconds the oldest pending request has been waiting (0 when nothing is pending) */
  readonly waitedSeconds = computed(() => {
    const times = [...this.started().values()];
    return times.length ? Math.max(0, Math.floor((this.now() - Math.min(...times)) / 1000)) : 0;
  });

  start(): number {
    const id = this.nextId++;
    this.started.update((m) => new Map(m).set(id, Date.now()));
    this.timer ??= setInterval(() => this.now.set(Date.now()), 500);
    return id;
  }

  finish(id: number): void {
    this.started.update((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
    if (this.started().size === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
