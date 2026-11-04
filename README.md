# Vishwakesh.me

Personal social identity website built with Vite, vanilla JavaScript, CSS, Lucide icons, and Supabase-ready data services.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are optional for the local frontend shell. `VITE_GUESTBOOK_FUNCTION_URL` is recommended for the rate-limited guestbook Edge Function. When configured, approved guestbook entries, projects, view analytics, and admin authentication use Supabase. Never expose a service-role key in the browser.

## Assets

Optional assets live in `public/assets/`: `avatar.webp` (square WebP, 512px+), `background.webp` (landscape WebP, 1920px+), `favicon.svg`, `og-image.webp`, `music/track.mp3`, and project images under `projects/`. Missing assets use graceful CSS placeholders. Replace files without changing their names, or update `src/config.js`.

## Supabase

Run `supabase/migrations/001_initial.sql` in the SQL editor. Create an administrator in Supabase Auth, then add their UUID to `admin_users`. The migration enables RLS, public approved-content reads, validated guestbook inserts, analytics recording, and admin-only writes. Deploy `supabase/functions/guestbook-submit` with `supabase functions deploy guestbook-submit`, set its `ALLOWED_ORIGIN`, and point `VITE_GUESTBOOK_FUNCTION_URL` at it. The `/admin` route uses Supabase Auth and provides project deletion/creation, guestbook approval/deletion, and aggregate analytics.

## Deployment

Run `npm run build` and publish `dist/` to any static host. The included `.github/workflows/deploy-pages.yml` deploys `main` to GitHub Pages automatically. `CNAME` is included in both the repository root and the generated `dist/`; configure the domain at the hosting provider and enable SPA fallback to `index.html` for direct routes.

## Privacy

Analytics records page path, a random first-party session identifier with a seven-day expiry, referral domain, and timestamps. No fingerprinting or raw IP addresses are stored. The admin view exposes aggregate metrics only.
