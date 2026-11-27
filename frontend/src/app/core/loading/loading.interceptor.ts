import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PendingRequests } from './pending-requests';

/** Registers every HTTP request with PendingRequests until it answers, fails or is cancelled. */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const pending = inject(PendingRequests);
  const id = pending.start();
  return next(req).pipe(finalize(() => pending.finish(id)));
};
