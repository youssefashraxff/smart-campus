// Production settings (used by `ng build`)
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  // Services to wake up when the app opens (only used on Render, see environment.render.ts)
  wakeUpUrls: [] as string[],
};
