import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../models';

// The services answer errors as RFC 9457 ProblemDetail JSON (shared/.../GlobalExceptionHandler.java).
// These helpers turn one into a sentence a student can act on.

const FALLBACK: Record<number, string> = {
  0: 'Can’t reach the campus server. Check that the gateway is running on port 5010.',
  400: 'Some of the details aren’t valid.',
  401: 'Your session has ended. Please sign in again.',
  403: 'You don’t have permission to do that.',
  404: 'That item doesn’t exist any more.',
  409: 'That conflicts with something that already exists.',
  503: 'A campus service is down right now. Try again in a minute.',
};

export function problemOf(error: unknown): ProblemDetail | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return error.error as ProblemDetail;
  }
  return null;
}

/** The best message for an error: the server's detail when it sent one, otherwise a fallback by status */
export function errorMessage(error: unknown): string {
  const problem = problemOf(error);
  if (problem?.detail) return problem.detail;
  if (error instanceof HttpErrorResponse) {
    return FALLBACK[error.status] ?? `Something went wrong (HTTP ${error.status}).`;
  }
  return 'Something went wrong.';
}

/** Per-field validation messages from a 400, e.g. { email: 'must be a well-formed email address' } */
export function fieldErrors(error: unknown): Record<string, string> {
  return problemOf(error)?.errors ?? {};
}

export const statusOf = (error: unknown) =>
  error instanceof HttpErrorResponse ? error.status : undefined;
