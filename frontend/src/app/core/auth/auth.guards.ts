import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

// Guards only hide screens. The real protection is the gateway: it rejects a missing JWT with 401
// and a non-admin calling an admin endpoint with 403 (FR-C4, NFR-5).

/** Signed-in users only; everyone else goes to /login and comes back afterwards */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  if (auth.isSignedIn()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Admins only (SRS 2.1) */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/']);
};

/** Login and register pages: a signed-in user goes straight to the dashboard */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isSignedIn() ? inject(Router).createUrlTree(['/']) : true;
};
