// Render deployment settings (used by `ng build --configuration production,render`, see render.yaml).
// The app calls the gateway's public URL directly.
export const environment = {
  production: true,
  apiBaseUrl: 'https://sc-ya-gateway.onrender.com/api',
  // Free Render services sleep after 15 idle minutes, and only traffic from outside Render wakes them:
  // the gateway's own calls to a sleeping service just get a 502. So the browser pings every service
  // when the app opens (core/wake-up.ts); they boot in parallel (~1 min) while the user types.
  wakeUpUrls: [
    'https://sc-ya-gateway.onrender.com',
    'https://sc-ya-auth.onrender.com',
    'https://sc-ya-catalog.onrender.com',
    'https://sc-ya-booking.onrender.com',
    'https://sc-ya-notify.onrender.com',
    'https://sc-ya-chatbot.onrender.com',
  ],
};
