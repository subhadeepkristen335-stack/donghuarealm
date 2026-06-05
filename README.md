# Donghua Realm

Modern dark purple donghua/anime streaming website built with React, Tailwind CSS, Firebase-ready data services, and Vercel routing.

## Features

- YouTube, Rumble, and Dailymotion video hosting through stored video IDs only
- Multi-server embedded player, theater mode, fullscreen, auto-next, and simulated resume progress
- Homepage, anime details, watch page, genres, search, trending, latest, bookmarks, history, static legal pages, 404, and admin dashboard
- Admin login, anime CRUD, episode creation, ad code editing, settings editing, page editing, analytics overview
- Dedicated ad placements: top, bottom, sidebar, and in-video
- Local dummy data fallback for instant development
- Firebase Auth and Firestore integration points
- Responsive Vercel-ready SPA routing
- Dynamic sitemap generation from seed data

## Local Setup

```bash
npm install
npm run dev
```

Admin fallback login for local mode:

```text
admin@donghuarealm.local
admin123
```

## Firebase Setup

Copy `.env.example` to `.env.local` and fill your Firebase web app values. Enable Firebase Authentication with email/password and create your admin user.

The app can read these Firestore collections:

- `anime`
- `episodes`
- `users`
- `comments`
- `bookmarks`
- `watch_history`
- `ads`
- `settings`
- `pages`

When Firebase env vars are absent, the app uses local storage and the dummy data in `src/data/seed.js`.

## Sample Schema

```js
anime: {
  id, slug, title, altTitle, description, genres: [],
  releaseDate, status, rating, views, likes,
  featured, trending, latest, thumbnail, banner
}

episodes: {
  id, animeId, number, title,
  youtube: "VIDEO_ID",
  rumble: "VIDEO_ID",
  dailymotion: "VIDEO_ID",
  duration, createdAt
}

comments: { id, episodeId, userId, name, body, createdAt }
bookmarks: { id, userId, animeId, createdAt }
watch_history: { id, userId, animeId, episodeId, progress, updatedAt }
ads: { top, bottom, sidebar, inVideo }
settings: { title, logo, favicon, seoDescription, nav, footer, socials, colors }
pages: { about, contact, privacy, terms }
```

## Sitemap

```bash
npm run sitemap
```

Set `SITE_URL` to generate production URLs:

```bash
SITE_URL=https://your-domain.com npm run sitemap
```

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add Firebase environment variables from `.env.example`.
4. Use the default Vite build command: `npm run build`.
5. Deploy.

`vercel.json` rewrites all routes to `index.html` so clean React Router URLs work in production.
