import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideMenu } from '@ng-icons/lucide';
import { BrnSheetContent } from '@spartan-ng/brain/sheet';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { AlertsStore } from '../core/alerts.store';
import { Brand } from './brand';
import { Nav } from './nav';

/**
 * The signed-in frame around every page.
 * Desktop: a fixed sidebar. Mobile: a translucent top bar (content scrolls under it) and the same
 * navigation in a sheet that slides in from the left and leaves the same way (spatial consistency).
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, NgIcon, HlmSheetImports, BrnSheetContent, Brand, Nav],
  providers: [provideIcons({ lucideMenu, lucideBell })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      href="#main"
      class="bg-primary text-primary-foreground sr-only z-50 rounded-xl px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >Skip to content</a
    >

    <div class="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_1fr]">
      <!-- Desktop sidebar -->
      <aside class="bg-sidebar border-sidebar-border hidden border-r lg:block">
        <div class="sticky top-0 flex h-dvh flex-col gap-8 px-4 py-6">
          <div class="px-1"><app-brand /></div>
          <app-nav class="flex-1" />
        </div>
      </aside>

      <!-- Mobile top bar -->
      <header
        class="material border-border/60 sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-[color-mix(in_oklch,var(--background)_75%,transparent)] px-3 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      >
        <button
          type="button"
          class="hover:bg-muted grid size-10 place-items-center rounded-xl"
          aria-label="Open menu"
          (click)="menuOpen.set(true)"
        >
          <ng-icon name="lucideMenu" size="20" />
        </button>
        <app-brand />
        <a
          routerLink="/alerts"
          class="hover:bg-muted relative grid size-10 place-items-center rounded-xl"
          [attr.aria-label]="
            'Alerts' + (alerts.unreadCount() ? ', ' + alerts.unreadCount() + ' unread' : '')
          "
        >
          <ng-icon name="lucideBell" size="19" />
          @if (alerts.unreadCount() > 0) {
            <span
              class="bg-sun ring-background absolute top-2 right-2 size-2.5 rounded-full ring-2"
              aria-hidden="true"
            ></span>
          }
        </a>
      </header>

      <main id="main" tabindex="-1" class="min-w-0 outline-none">
        <div class="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10">
          <router-outlet />
        </div>
      </main>
    </div>

    <hlm-sheet side="left" [state]="menuOpen() ? 'open' : 'closed'" (closed)="menuOpen.set(false)">
      <hlm-sheet-content *brnSheetContent="let ctx" class="bg-sidebar w-[17.5rem] gap-6 px-4 py-5">
        <div class="px-1 pt-0.5"><app-brand /></div>
        <app-nav class="flex-1" (navigate)="menuOpen.set(false)" />
      </hlm-sheet-content>
    </hlm-sheet>
  `,
})
export class Shell implements OnInit {
  protected readonly alerts = inject(AlertsStore);
  protected readonly menuOpen = signal(false);

  ngOnInit(): void {
    this.alerts.refresh();
  }
}
