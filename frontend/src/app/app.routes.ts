import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';
import { Shell } from './layout/shell';

// Every page is lazy-loaded (loadComponent), so the first screen only downloads what it needs.
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · Smart Campus',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Create account · Smart Campus',
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Overview · Smart Campus',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'facilities',
        title: 'Facilities · Smart Campus',
        loadComponent: () =>
          import('./features/facilities/facilities-page/facilities-page').then(
            (m) => m.FacilitiesPage,
          ),
      },
      {
        path: 'facilities/:id',
        title: 'Book a facility · Smart Campus',
        loadComponent: () =>
          import('./features/facilities/facility-booking-page/facility-booking-page').then(
            (m) => m.FacilityBookingPage,
          ),
      },
      {
        path: 'events',
        title: 'Events · Smart Campus',
        loadComponent: () =>
          import('./features/events/events-page/events-page').then((m) => m.EventsPage),
      },
      {
        path: 'events/:id',
        title: 'Event · Smart Campus',
        loadComponent: () =>
          import('./features/events/event-detail-page/event-detail-page').then(
            (m) => m.EventDetailPage,
          ),
      },
      {
        path: 'bookings',
        title: 'My bookings · Smart Campus',
        loadComponent: () =>
          import('./features/bookings/my-bookings-page/my-bookings-page').then(
            (m) => m.MyBookingsPage,
          ),
      },
      {
        path: 'alerts',
        title: 'Alerts · Smart Campus',
        loadComponent: () =>
          import('./features/alerts/alerts-page/alerts-page').then((m) => m.AlertsPage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'facilities' },
          {
            path: 'facilities',
            title: 'Manage facilities · Smart Campus',
            loadComponent: () =>
              import('./features/admin/admin-facilities-page/admin-facilities-page').then(
                (m) => m.AdminFacilitiesPage,
              ),
          },
          {
            path: 'events',
            title: 'Manage events · Smart Campus',
            loadComponent: () =>
              import('./features/admin/admin-events-page/admin-events-page').then(
                (m) => m.AdminEventsPage,
              ),
          },
          {
            path: 'bookings',
            title: 'All bookings · Smart Campus',
            loadComponent: () =>
              import('./features/admin/admin-bookings-page/admin-bookings-page').then(
                (m) => m.AdminBookingsPage,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
