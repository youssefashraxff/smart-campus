import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideBuilding2,
  lucideCalendarDays,
  lucideClipboardList,
  lucideHouse,
  lucideLogOut,
  lucideSettings2,
  lucideTicket,
  lucideCalendarCog,
} from '@ng-icons/lucide';
import { AlertsStore } from '../core/alerts.store';
import { AuthStore } from '../core/auth/auth.store';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  badge?: boolean;
}

const USER_NAV: NavItem[] = [
  { label: 'Overview', path: '/', icon: 'lucideHouse', exact: true },
  { label: 'Facilities', path: '/facilities', icon: 'lucideBuilding2' },
  { label: 'Events', path: '/events', icon: 'lucideCalendarDays' },
  { label: 'My bookings', path: '/bookings', icon: 'lucideTicket' },
  { label: 'Alerts', path: '/alerts', icon: 'lucideBell', badge: true },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Manage facilities', path: '/admin/facilities', icon: 'lucideSettings2' },
  { label: 'Manage events', path: '/admin/events', icon: 'lucideCalendarCog' },
  { label: 'All bookings', path: '/admin/bookings', icon: 'lucideClipboardList' },
];

/** The navigation list, shared by the desktop sidebar and the mobile sheet */
@Component({
  selector: 'app-nav',
  imports: [RouterLink, RouterLinkActive, NgIcon, NgTemplateOutlet],
  providers: [
    provideIcons({
      lucideHouse,
      lucideBuilding2,
      lucideCalendarDays,
      lucideTicket,
      lucideBell,
      lucideSettings2,
      lucideCalendarCog,
      lucideClipboardList,
      lucideLogOut,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full flex-col' },
  template: `
    <nav aria-label="Main" class="flex flex-1 flex-col gap-6 overflow-y-auto">
      <ul class="flex flex-col gap-0.5" role="list">
        @for (item of userNav; track item.path) {
          <li>
            <ng-container *ngTemplateOutlet="link; context: { $implicit: item }"></ng-container>
          </li>
        }
      </ul>

      @if (auth.isAdmin()) {
        <div>
          <p
            class="text-muted-foreground mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-wider uppercase"
          >
            Administration
          </p>
          <ul class="flex flex-col gap-0.5" role="list">
            @for (item of adminNav; track item.path) {
              <li>
                <ng-container *ngTemplateOutlet="link; context: { $implicit: item }"></ng-container>
              </li>
            }
          </ul>
        </div>
      }
    </nav>

    @if (auth.user(); as user) {
      <div class="border-border mt-4 flex items-center gap-3 border-t pt-4">
        <span
          class="bg-brand-soft text-brand-ink grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
          aria-hidden="true"
          >{{ initials(user.name) }}</span
        >
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium" [title]="user.name">{{ user.name }}</p>
          <p class="text-muted-foreground truncate text-xs">{{ user.role }}</p>
        </div>
        <button
          type="button"
          class="text-muted-foreground hover:bg-muted hover:text-foreground grid size-9 place-items-center rounded-xl transition-colors"
          (click)="signOut()"
          aria-label="Sign out"
          title="Sign out"
        >
          <ng-icon name="lucideLogOut" size="17" />
        </button>
      </div>
    }

    <ng-template #link let-item>
      <a
        [routerLink]="item.path"
        routerLinkActive="bg-card text-foreground font-semibold shadow-raised"
        [routerLinkActiveOptions]="{ exact: !!item.exact }"
        #rla="routerLinkActive"
        [attr.aria-current]="rla.isActive ? 'page' : null"
        (click)="navigate.emit()"
        class="group text-muted-foreground hover:text-foreground flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors"
      >
        <ng-icon
          [name]="item.icon"
          size="18"
          class="shrink-0"
          [class.text-primary]="rla.isActive"
          aria-hidden="true"
        />
        <span class="tab-label flex-1" [attr.data-text]="item.label"
          ><span>{{ item.label }}</span></span
        >
        @if (item.badge && alerts.unreadCount() > 0) {
          <span
            class="bg-sun text-foreground tabular grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-semibold"
            [attr.aria-label]="alerts.unreadCount() + ' unread'"
            >{{ alerts.unreadCount() }}</span
          >
        }
      </a>
    </ng-template>
  `,
})
export class Nav {
  protected readonly auth = inject(AuthStore);
  protected readonly alerts = inject(AlertsStore);
  protected readonly userNav = USER_NAV;
  protected readonly adminNav = ADMIN_NAV;

  /** Lets the mobile sheet close itself after a link is followed */
  readonly navigate = output<void>();

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter((p) => !/^(dr|eng|prof)\.?$/i.test(p))
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  protected signOut(): void {
    this.navigate.emit();
    this.auth.logout();
  }
}
