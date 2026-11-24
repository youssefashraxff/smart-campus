import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';

/**
 * Adds "Authorization: Bearer <jwt>" to every request that goes to the gateway (FR-U2, FR-C4).
 * A 401 means the token is missing, expired or invalid, so the user is signed out and sent to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const token = auth.token();
  const toGateway = req.url.startsWith(environment.apiBaseUrl);
  const isAuthCall =
    req.url.startsWith(`${environment.apiBaseUrl}/auth/login`) ||
    req.url.startsWith(`${environment.apiBaseUrl}/auth/register`);

  const request =
    token && toGateway && !isAuthCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
