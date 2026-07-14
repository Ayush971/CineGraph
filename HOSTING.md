# Hosting CineGraph — Vercel (frontend) + Render (backend, Postgres, Redis)

The app has four parts: a static React frontend, a FastAPI backend, PostgreSQL,
and Redis. The frontend goes on Vercel; everything else goes on Render.

Prerequisites: the repo pushed to GitHub, a [TMDB API key](https://www.themoviedb.org/settings/api),
a Vercel account, and a Render account.

---

## Step 1 — Deploy the backend + DB + Redis (Render)

The repo includes [`render.yaml`](render.yaml), a Blueprint that creates all three
Render resources at once.

1. Render dashboard → **New → Blueprint** → connect this GitHub repo.
2. Render reads `render.yaml` and shows: `cinegraph-api` (web), `cinegraph-db`
   (Postgres), `cinegraph-redis`. Click **Apply**.
3. When prompted for the `sync: false` secrets, set:
   - `TMDB_API_KEY` → your TMDB key
   - `CORS_ORIGINS` → leave blank for now (you don't have the Vercel URL yet)
4. Wait for the first deploy. `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET` are
   wired/generated automatically. On boot the app auto-creates all tables and
   seeds achievements — no migration step needed.
5. Copy the backend URL, e.g. `https://cinegraph-api.onrender.com`. Confirm
   `…/health` returns `{"status":"OK"}` and `…/docs` loads.

> Free tier notes: the web service **sleeps after 15 min idle** (first request
> then takes ~50s), and Render **deletes free Postgres after 90 days**. Upgrade
> those two to paid (~$7/mo each) when you want it always-on and durable.

## Step 2 — Deploy the frontend (Vercel)

1. Vercel → **Add New → Project** → import this repo.
2. Set **Root Directory = `frontend`**. Framework preset auto-detects as **Vite**
   (build `npm run build`, output `dist`). [`frontend/vercel.json`](frontend/vercel.json)
   handles SPA routing.
3. Add an Environment Variable:
   - `VITE_API_BASE_URL` → your Render backend URL from Step 1
     (e.g. `https://cinegraph-api.onrender.com`, no trailing slash)
4. **Deploy.** Copy the resulting URL, e.g. `https://cinegraph.vercel.app`.

## Step 3 — Close the CORS loop

The backend must allow requests from the Vercel domain.

1. Render → `cinegraph-api` → **Environment** → set
   `CORS_ORIGINS = https://cinegraph.vercel.app` (comma-separate if you add more,
   e.g. preview domains). No trailing slash.
2. Save — Render redeploys. Done.

## Step 4 — Smoke test

Open the Vercel URL and check: register an account, browse movies (proves TMDB +
backend), open a movie and log it (proves DB writes), visit **For You** (proves
Redis + recommendations). If browsing fails with a CORS error in the console,
re-check Step 3; if it fails with a network error, the backend is asleep — wait
~50s and retry.

---

## What each service needs (reference)

**Render backend env vars** (most set by `render.yaml`):

| Var | Source |
|---|---|
| `DATABASE_URL` | auto — from `cinegraph-db` |
| `REDIS_URL` | auto — from `cinegraph-redis` |
| `JWT_SECRET` | auto-generated |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | preset |
| `TMDB_BASE_URL`, `TMDB_IMAGE_BASE_URL` | preset |
| `TMDB_API_KEY` | **you set it** |
| `CORS_ORIGINS` | **you set it** (Vercel URL) |

**Vercel frontend env var:** `VITE_API_BASE_URL` = Render backend URL.

## Redeploys

Both platforms auto-deploy on push to your default branch. Backend changes →
Render rebuilds; frontend changes → Vercel rebuilds. Env-var changes require a
manual redeploy (both dashboards have a button).

## Cost summary

Fully free to start. To remove the sleep + 90-day DB expiry: Render web service
Starter (~$7/mo) + Postgres (~$7/mo). Vercel and Render Redis free tiers are fine
for a personal project.
