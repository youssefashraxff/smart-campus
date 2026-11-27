// Development settings (used by `ng serve`). The Angular app talks ONLY to the gateway.
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5010/api',
  // Services to wake up when the app opens (only used on Render, see environment.render.ts)
  wakeUpUrls: [] as string[],
};
