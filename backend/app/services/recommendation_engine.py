"""
Content-based recommendation engine.

Pipeline:
  1. build_taste_profile  — weight genres/actors/directors by how the user rated
     the movies containing them (relative to their own average rating).
  2. generate_candidates  — pull TMDB recommendations seeded from the user's
     top-rated movies, dedupe, drop already-watched films.
  3. score_candidates     — cheap genre pre-score on all candidates, then fetch
     full details for the top slice and re-score with actor/director signals.

Results are cached per-user in Redis (24h) when Redis is available.
"""
import json
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.diary_entry import DiaryEntry
from app.models.movie import Movie
from app.services.tmdb import tmdb_service
from app.config.redis import get_redis

# How much each feature type counts toward a movie's score.
GENRE_MULT = 1.0
ACTOR_MULT = 1.5
DIRECTOR_MULT = 3.0

# Tuning knobs
SEED_LIMIT = 10          # how many top-rated movies seed the candidate pool
PRESCORE_KEEP = 50       # candidates kept after the cheap genre pre-score
CACHE_TTL_SECONDS = 60 * 60 * 24  # 24h
NEUTRAL_RATING = 6.0     # fallback baseline if the user has no rated entries


def _parse(json_str):
    if not json_str:
        return []
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return []


def _watched_tmdb_ids(user_id: int, db: Session) -> set:
    """All TMDB ids the user has a diary entry for."""
    rows = (
        db.query(Movie.tmdb_id)
        .join(DiaryEntry, DiaryEntry.movie_id == Movie.id)
        .filter(DiaryEntry.user_id == user_id)
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


def build_taste_profile(user_id: int, db: Session) -> dict:
    """
    Build a weighted taste profile from the user's rated diary entries.

    Returns a dict with weight maps keyed by TMDB id, plus name lookups used
    to explain recommendations.
    """
    # Average rating = the user's personal baseline.
    rated = (
        db.query(DiaryEntry.movie_id, DiaryEntry.rating)
        .filter(DiaryEntry.user_id == user_id, DiaryEntry.rating.isnot(None))
        .all()
    )

    genres = defaultdict(float)
    actors = defaultdict(float)
    directors = defaultdict(float)
    names = {"genre": {}, "actor": {}, "director": {}}

    if not rated:
        return {
            "genres": genres,
            "actors": actors,
            "directors": directors,
            "names": names,
            "has_data": False,
        }

    avg = sum(float(r) for _, r in rated) / len(rated)

    for movie_id, rating in rated:
        weight = float(rating) - avg
        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            continue

        for g in _parse(movie.genres_json):
            gid = g.get("id")
            if gid is not None:
                genres[gid] += weight
                names["genre"][gid] = g.get("name")

        for c in _parse(movie.cast_json):
            cid = c.get("id")
            if cid is not None:
                actors[cid] += weight
                names["actor"][cid] = c.get("name")

        for d in _parse(movie.directors_json):
            did = d.get("id")
            if did is not None:
                directors[did] += weight
                names["director"][did] = d.get("name")

    return {
        "genres": genres,
        "actors": actors,
        "directors": directors,
        "names": names,
        "has_data": True,
    }


def generate_candidates(user_id: int, db: Session) -> list:
    """
    Seed from the user's top-rated movies, pull TMDB recommendations, dedupe,
    and drop anything already watched. Returns raw TMDB result dicts.
    """
    seeds = (
        db.query(Movie)
        .join(DiaryEntry, DiaryEntry.movie_id == Movie.id)
        .filter(DiaryEntry.user_id == user_id, DiaryEntry.rating.isnot(None))
        .order_by(DiaryEntry.rating.desc())
        .limit(SEED_LIMIT)
        .all()
    )

    watched = _watched_tmdb_ids(user_id, db)
    seen = set()
    candidates = []

    for seed in seeds:
        try:
            data = tmdb_service.get_recommendations(seed.tmdb_id)
        except Exception:
            continue
        for item in data.get("results", []):
            tid = item.get("id")
            if tid is None or tid in watched or tid in seen:
                continue
            seen.add(tid)
            item["_seed_title"] = seed.title  # for the "because you watched" reason
            candidates.append(item)

    return candidates


def _get_or_cache_movie(tmdb_id: int, db: Session) -> Movie:
    """
    Return the cached Movie row for a TMDB id, fetching + caching full details
    (including cast/directors) from TMDB if we don't have them yet.
    """
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if movie and movie.cast_json and movie.directors_json:
        return movie

    # Import here to avoid a circular import at module load.
    from app.routes.movies import _extract_cache_data

    try:
        details = tmdb_service.get_movie_details(tmdb_id)
        credits = tmdb_service.get_movie_credits(tmdb_id)
    except Exception:
        return movie  # may be None; caller handles it

    genres_json, cast_json, directors_json = _extract_cache_data(details, credits)

    if movie:
        movie.genres_json = genres_json
        movie.cast_json = cast_json
        movie.directors_json = directors_json
    else:
        movie = Movie(
            tmdb_id=tmdb_id,
            title=details.get("title"),
            overview=details.get("overview"),
            release_date=details.get("release_date") or None,
            poster_path=details.get("poster_path"),
            backdrop_path=details.get("backdrop_path"),
            runtime=details.get("runtime"),
            genres_json=genres_json,
            cast_json=cast_json,
            directors_json=directors_json,
        )
        db.add(movie)

    db.commit()
    return movie


def _genre_prescore(candidate: dict, profile: dict) -> float:
    """Cheap score using only the genre_ids TMDB already returns."""
    score = 0.0
    for gid in candidate.get("genre_ids", []):
        score += profile["genres"].get(gid, 0.0)
    return score * GENRE_MULT


def _full_score(movie: Movie, profile: dict) -> tuple:
    """
    Full score using cached genre/actor/director data.
    Returns (score, reason_string).
    """
    contributions = []  # (contribution, reason) — used to explain the pick

    genre_score = 0.0
    for g in _parse(movie.genres_json):
        w = profile["genres"].get(g.get("id"), 0.0)
        genre_score += w
        if w > 0:
            contributions.append((w * GENRE_MULT, f"More {g.get('name')} films"))

    actor_score = 0.0
    for c in _parse(movie.cast_json):
        w = profile["actors"].get(c.get("id"), 0.0)
        actor_score += w
        if w > 0:
            contributions.append((w * ACTOR_MULT, f"Because you like {c.get('name')}"))

    director_score = 0.0
    for d in _parse(movie.directors_json):
        w = profile["directors"].get(d.get("id"), 0.0)
        director_score += w
        if w > 0:
            contributions.append(
                (w * DIRECTOR_MULT, f"Because you like {d.get('name')}")
            )

    total = (
        genre_score * GENRE_MULT
        + actor_score * ACTOR_MULT
        + director_score * DIRECTOR_MULT
    )

    reason = max(contributions, key=lambda c: c[0])[1] if contributions else None
    return total, reason


def score_candidates(candidates: list, profile: dict, db: Session, limit: int) -> list:
    """Two-pass scoring: cheap genre pre-score, then full score on the top slice."""
    prescored = sorted(
        candidates, key=lambda c: _genre_prescore(c, profile), reverse=True
    )[:PRESCORE_KEEP]

    scored = []
    for cand in prescored:
        movie = _get_or_cache_movie(cand["id"], db)
        if not movie:
            continue
        score, reason = _full_score(movie, profile)
        if score <= 0:
            continue
        scored.append(
            {
                "tmdb_id": movie.tmdb_id,
                "title": movie.title,
                "poster_path": movie.poster_path,
                "release_date": str(movie.release_date) if movie.release_date else None,
                "vote_average": cand.get("vote_average"),
                "score": round(score, 3),
                "reason": reason or f"Because you watched {cand.get('_seed_title')}",
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def get_recommendations(user_id: int, db: Session, limit: int = 20) -> list:
    """Full pipeline with Redis caching."""
    cache_key = f"recs:user:{user_id}"
    r = get_redis()

    if r:
        cached = r.get(cache_key)
        if cached:
            try:
                return json.loads(cached)[:limit]
            except (json.JSONDecodeError, TypeError):
                pass

    profile = build_taste_profile(user_id, db)
    if not profile["has_data"]:
        return []

    candidates = generate_candidates(user_id, db)
    results = score_candidates(candidates, profile, db, limit)

    if r:
        try:
            r.setex(cache_key, CACHE_TTL_SECONDS, json.dumps(results))
        except Exception:
            pass

    return results


def because_you_watched(user_id: int, tmdb_id: int, db: Session, limit: int = 12) -> list:
    """
    Recommendations seeded from a single movie, scored against the user's profile.
    Not cached — it's cheap and movie-specific.
    """
    profile = build_taste_profile(user_id, db)
    watched = _watched_tmdb_ids(user_id, db)

    try:
        data = tmdb_service.get_recommendations(tmdb_id)
    except Exception:
        return []

    seed = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    seed_title = seed.title if seed else "this"

    candidates = []
    seen = set()
    for item in data.get("results", []):
        tid = item.get("id")
        if tid is None or tid in watched or tid in seen:
            continue
        seen.add(tid)
        item["_seed_title"] = seed_title
        candidates.append(item)

    if not profile["has_data"]:
        # No taste profile yet — just return TMDB's raw recommendations.
        return [
            {
                "tmdb_id": c.get("id"),
                "title": c.get("title"),
                "poster_path": c.get("poster_path"),
                "release_date": c.get("release_date"),
                "vote_average": c.get("vote_average"),
                "score": 0.0,
                "reason": f"Because you watched {seed_title}",
            }
            for c in candidates[:limit]
        ]

    return score_candidates(candidates, profile, db, limit)


def invalidate_recommendations(user_id: int):
    """Drop a user's cached recommendations (call after they log a new movie)."""
    r = get_redis()
    if r:
        try:
            r.delete(f"recs:user:{user_id}")
        except Exception:
            pass
