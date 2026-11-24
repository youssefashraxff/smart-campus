import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Every URL starts at the gateway (FR-C1, NFR-2): the app never calls a service port directly */
export const api = (path: string) => `${environment.apiBaseUrl}${path}`;

/** Builds query params, leaving out empty filters so "no filter" means "all" */
export function queryParams(
  values: Record<string, string | number | null | undefined>,
): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
