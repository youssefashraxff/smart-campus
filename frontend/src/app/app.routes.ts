import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'facilities' },
  {
    path: 'facilities',
    loadComponent: () => import('./features/facilities/facilities.page').then((m) => m.FacilitiesPage),
  },
  // TODO: events, bookings, dashboard, admin, login (see SRS section 4)
];
