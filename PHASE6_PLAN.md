# Phase 6 — Recommendations & Discovery

Implementation plan. Build in the stages below, in order.

## Context / reality check

- **Data we have:** `DiaryEntry` (user, movie, 0–10 rating, rewatch, date, review) and `Movie` with cached `genres_json` / `cast_json` / `directors_json`. Plus follows, likes, lists.
- **Collaborative filtering** ("users who liked X also liked Y") needs many users with overlapping ratings — cold-start problem. Defer it until there's a real user base. Start with content signals + TMDB, which work for a single active user.
- **Redis** is already provisioned in `docker-compose.yml` but unused — Stage 2 finally puts it to work.
- Skip TensorFlow. `numpy` (optionally `scikit-learn`'s `cosine_similarity`) is plenty.

---

## Stage 1 — Related Films (TMDB-backed) — do first

Zero ML, no new tables. TMDB's own recommendation endpoints are backed by millions of users.

### Backend
- **`app/services/tmdb.py`** — add two methods mirroring the existing `_make_request` pattern:
  - `get_recommendations(movie_id, page=1)` → `movie/{id}/recommendations`
  - `get_similar(movie_id, page=1)` → `movie/{id}/similar`
- **`app/routes/movies.py`** — add `GET /movies/{movie_id}/recommendations`. Return the TMDB response directly (same shape as `MovieListResponse`, reuses existing schema). No auth needed — public data.

### Frontend
- **`src/services/api.tsx`** — add `moviesAPI.getRecommendations(movieId)`.
- **`src/pages/MovieDetailPage.tsx`** — fetch on load, render a horizontal carousel below the Comments section, reusing the existing `MovieCard` component.

---

## Stage 2 — Content-based "For You" (the real personalization)

Works for a single active user. Uses the cached genre/cast/director data.

### The algorithm

1. **Taste profile** (`build_taste_profile(user_id, db)`): dict of `{"genre:Action": w, "director:Nolan": w, "actor:Tom Cruise": w, ...}`.
   - For each rated diary entry: `weight = rating − user_avg_rating` (9/10 → positive, 3/10 → negative).
   - Accumulate weight across each movie's features, with **type multipliers** (director > actor > genre).
   - Optionally decay older entries so recent taste dominates.
2. **Candidate generation** (`generate_candidates(user_id, db)`): take the user's top-rated movies → call TMDB `similar`/`recommendations` for each → union → dedupe → **subtract already-watched tmdb_ids**. Bounds the pool to a few hundred relevant movies (don't score all of TMDB).
3. **Scoring** (`score_candidates(candidates, profile)`): for each candidate, parse its genre+cast+director features and compute profile dot-product (or cosine similarity between profile vector and candidate multi-hot vector). Sort, return top N.

**Wrinkle to handle:** candidate movies from TMDB won't be in the `movies` table yet (we only cache on detail-page view). Fetch + cache their details lazily inside the engine so future scoring is cheap.

### New model + migration
- **`app/models/watchlist.py`** *(optional but recommended)* — `Watchlist` (`user_id`, `movie_id`, `added_at`) so users can save recs. Register in `app/models/__init__.py`.
- **`migrate_phase6.py`** — same style as `migrate_phase5.py`; create new table(s). No changes to `movies` (genres/cast/directors already cached).

### New service — the engine
`app/services/recommendation_engine.py`, structured like `achievement_engine.py`:
- `build_taste_profile(user_id, db)`
- `generate_candidates(user_id, db)`
- `score_candidates(candidates, profile)`
- `get_recommendations(user_id, db, limit)` — orchestrates the above, checks Redis cache first.

### Redis (finally used)
- **`app/config/redis.py`** *(new)* — small client wrapper (`redis` package, host from env; service already in `docker-compose.yml`).
- In the engine: cache per-user recs under `recs:user:{id}` with a TTL (~24h). Recompute when the user logs a new diary entry — hook in at the existing `check_achievements` call site in `app/routes/diary.py`.

### New route
`app/routes/recommendations.py` + register in `app/main.py`:
- `GET /recommendations/for-you` — personalized list (auth required)
- `GET /recommendations/because-you-watched/{tmdb_id}` — same engine, seeded from one movie
- `POST /recommendations/refresh` — force recompute (dev/debug, like `/achievements/check`)

### Schemas
`app/schemas/recommendation.py` — `RecommendationItem` (movie fields + `score` + optional `reason` string like "Because you liked Inception") and a list response.

### Frontend
- **`src/types/index.ts`** — `Recommendation` interface.
- **`src/services/api.tsx`** — `recommendationsAPI.getForYou()`, `.becauseYouWatched(id)`.
- **`src/pages/RecommendationsPage.tsx`** *(new)* + route in `App.tsx` + nav link in `Navbar.tsx`.
- **`src/pages/MovieDetailPage.tsx`** — optionally add a "Because you watched this" row using the seeded endpoint.

---

## Stage 3 — Collaborative filtering (only once there are users)

- Item-item CF: build a user×movie rating matrix, compute movie-to-movie similarity, recommend neighbors of highly-rated movies.
- Lighter interim version at small scale: **co-occurrence from lists** — "people who put X in a list also put Y." Uses data already on hand.

## Stage 4 — Hybrid + digests

- **Hybrid:** blend scores, e.g. `0.7·content + 0.3·CF`; lean on content when history is thin, shift toward CF as data grows.
- **Weekly email digest:** infrastructure task, not an algorithm one — scheduler (cron/APScheduler) + email provider (SendGrid/Resend). Keep separate.

---

## Build order

1. Stage 1 entirely — self-contained, instant value, ship it.
2. Stage 2 backend: model + migration → engine (test via `/docs`) → Redis cache → routes.
3. Stage 2 frontend: types → api → page → nav.

Hardest part is candidate generation + lazy caching of TMDB movie details — the real logic. Everything else is plumbing already done in Phases 4/5.

## Evaluation note

At a small user base, evaluating recs is mostly eyeballing. For a real signal: hold out one watched-and-loved movie and check whether the engine surfaces it.
