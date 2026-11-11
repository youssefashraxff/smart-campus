# Smart Campus — Frontend

Angular 22, Tailwind CSS 4, Spartan/ng (components in `libs/ui`, add more with `npx ng g @spartan-ng/cli:ui <name>`), FullCalendar 7.

```bash
npm install
npm start        # http://localhost:4200, talks to the gateway on http://localhost:5000
npm run build
```

The app calls only the API gateway (`src/environments`). Pages live in `src/app/features`, shared API code in `src/app/core`.
