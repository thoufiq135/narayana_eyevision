# Canteen Watch

A facility/campus recognition-monitoring product: a marketing site plus the
live monitoring dashboard, in one React app.

```
/            Marketing landing page (hero, features, pricing, FAQ, etc.)
/login       Placeholder sign-in screen (see "About /login" below)
/dashboard   The real monitoring app: known/unknown detections, camera
             view, day-wise history, employee grid, live notifications
```

## Run it

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Backend connection

The **dashboard** talks to your real recognition backend — there is no mock
or seed data anywhere in this project. Set the backend host in `.env`
(already present at the project root):

```
VITE_API_BASE_URL=http://192.168.0.8:8000
```

`src/api/api.js` is the **only** file that talks to the network. See the
comments in that file for the expected `/recognition/events` /
`/recognition/summary` response shape — it's defensive about field-name
differences (`name` vs `employee_name`, `camera_name` vs `camera_id`, etc.).

The **marketing site** (`/` and `/login`) has no backend dependency at all —
it's fully static content, safe to deploy even before your backend is live.

## Project layout

```
src/
  api/api.js                 <- every backend call in the app, in one place
  components/ToastStack.jsx  <- detection-notification toasts
  pages/
    LandingPage.jsx + landing.css   <- marketing site
    LoginPage.jsx                  <- placeholder sign-in (uses landing.css)
    Dashboard.jsx                  <- the monitoring app (was previously App.jsx)
  App.jsx                    <- routes "/", "/login", "/dashboard"
  index.css                  <- dashboard styling + design tokens shared
                                 by the whole app (colors, fonts, radii)
  main.jsx                   <- wraps <App /> in <BrowserRouter>
```

## About `/login`

There's no auth backend wired up yet, so this screen is intentionally
labeled **"Demo mode"** rather than pretending to check a password against
anything real — submitting the form just navigates into `/dashboard`. When
you have a real auth endpoint, replace the `handleSubmit` in
`LoginPage.jsx` with an actual request, and gate the `/dashboard` route
(e.g. redirect to `/login` if there's no valid session).

## Design notes

- The landing page's hero and feature visuals are **original CSS/SVG
  graphics** (animated camera-tile mockup, floating status chips), not
  hotlinked stock photography — this avoids licensing risk and broken
  external image links. Swap in your own product screenshots or licensed
  photography under `public/` if you want real imagery instead.
- Testimonials use fictional names and generic roles (hostel warden,
  facilities manager, security lead) as placeholder social proof — replace
  with real customer quotes (with permission) before shipping publicly.
- Landing-page classes are prefixed `lp-` so they never collide with the
  dashboard's own class names, since both stylesheets load globally.
- Google Fonts (IBM Plex Sans/Mono) load via a CDN `@import` in `index.css`;
  self-host them instead if your deployment has no internet access.

## Before a real production launch

- [ ] Wire `/login` to a real authentication backend and protect `/dashboard`
- [ ] Replace hero/testimonial placeholder content with real product photos
      and real customer quotes
- [ ] Add a privacy policy / terms page — this product stores identities and
      images of employees and unrecognized visitors, which has real legal
      and organizational-policy implications
- [ ] Self-host fonts if the deployment target has no internet access
- [ ] Point `VITE_API_BASE_URL` at your production backend, not a LAN IP
