import { environment } from '../../environments/environment';

// Fire-and-forget ping to every service in environment.wakeUpUrls (empty locally, filled on Render).
// mode 'no-cors': we don't need the answer, only the request reaching Render so the service starts.
// The app does not wait for these; a failed ping is simply ignored.
export function wakeUpServices(): void {
  for (const url of environment.wakeUpUrls) {
    fetch(url, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
  }
}
