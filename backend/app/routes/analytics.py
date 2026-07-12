import json
import calendar
from collections import Counter
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.config.database import get_db
from app.models.user import User
from app.models.diary_entry import DiaryEntry
from app.models.movie import Movie
from app.schemas.analytics import (
    GenreBreakdown,
    MonthlyCount,
    DecadeCount,
    PersonCount,
    WatchStreak,
    RatingDistribution,
    AnalyticsOverview,
    YearInReviewResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _get_user_movies(user_id: int, db: Session, year: int = None):
    """Get all unique movies a user has watched, with optional year filter."""
    query = db.query(func.distinct(DiaryEntry.movie_id)).filter(
        DiaryEntry.user_id == user_id
    )
    if year:
        query = query.filter(
            extract("year", DiaryEntry.watched_date) == year
        )
    movie_ids = [m[0] for m in query.all()]
    movies = db.query(Movie).filter(Movie.id.in_(movie_ids)).all() if movie_ids else []
    return movies


def _calc_genres(movies) -> list:
    """Calculate genre breakdown from cached movie data."""
    genre_counter = Counter()
    for movie in movies:
        if movie.genres_json:
            try:
                genres = json.loads(movie.genres_json)
                for g in genres:
                    genre_counter[g.get("name", "Unknown")] += 1
            except (json.JSONDecodeError, TypeError):
                pass

    total = sum(genre_counter.values())
    return [
        GenreBreakdown(
            genre=genre,
            count=count,
            percentage=round((count / total) * 100, 1) if total > 0 else 0,
        )
        for genre, count in genre_counter.most_common(15)
    ]


def _calc_monthly(user_id: int, db: Session, year: int) -> list:
    """Calculate movies per month for a given year."""
    results = []
    for month in range(1, 13):
        count = (
            db.query(func.count(DiaryEntry.id))
            .filter(
                DiaryEntry.user_id == user_id,
                extract("year", DiaryEntry.watched_date) == year,
                extract("month", DiaryEntry.watched_date) == month,
            )
            .scalar()
            or 0
        )
        results.append(
            MonthlyCount(
                month=month,
                year=year,
                count=count,
                label=calendar.month_abbr[month],
            )
        )
    return results


def _calc_decades(movies) -> list:
    """Calculate decade distribution from movie release dates."""
    decade_counter = Counter()
    for movie in movies:
        if movie.release_date:
            decade = (movie.release_date.year // 10) * 10
            decade_counter[f"{decade}s"] += 1

    return [
        DecadeCount(decade=decade, count=count)
        for decade, count in sorted(decade_counter.items())
    ]


def _calc_people(movies, field: str, key: str = "name") -> list:
    """Calculate most-watched people from cached cast/director data."""
    person_counter = Counter()
    person_info = {}

    for movie in movies:
        data_field = getattr(movie, field, None)
        if data_field:
            try:
                people = json.loads(data_field)
                for p in people:
                    name = p.get(key, "Unknown")
                    person_counter[name] += 1
                    if name not in person_info:
                        person_info[name] = {
                            "person_id": p.get("id", 0),
                            "profile_path": p.get("profile_path"),
                        }
            except (json.JSONDecodeError, TypeError):
                pass

    return [
        PersonCount(
            person_id=person_info[name]["person_id"],
            name=name,
            profile_path=person_info[name]["profile_path"],
            count=count,
        )
        for name, count in person_counter.most_common(10)
    ]


def _calc_streaks(user_id: int, db: Session) -> WatchStreak:
    """Calculate current and longest watch streaks."""
    dates = (
        db.query(func.distinct(DiaryEntry.watched_date))
        .filter(DiaryEntry.user_id == user_id)
        .order_by(DiaryEntry.watched_date.asc())
        .all()
    )

    if not dates:
        return WatchStreak(current_streak=0, longest_streak=0, last_watched=None)

    sorted_dates = sorted([d[0] for d in dates])
    today = datetime.now().date()

    longest = 1
    current = 1

    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i - 1]).days
        if diff == 1:
            current += 1
            longest = max(longest, current)
        elif diff > 1:
            current = 1

    # Check if current streak is still active (last watched was yesterday or today)
    last_date = sorted_dates[-1]
    days_since = (today - last_date).days

    if days_since > 1:
        # Streak is broken, recalculate current streak from the end
        current_active = 1
        for i in range(len(sorted_dates) - 1, 0, -1):
            diff = (sorted_dates[i] - sorted_dates[i - 1]).days
            if diff == 1:
                current_active += 1
            else:
                break
        if days_since <= 1:
            current_streak = current_active
        else:
            current_streak = 0
    else:
        # Calculate current active streak
        current_streak = 1
        for i in range(len(sorted_dates) - 1, 0, -1):
            diff = (sorted_dates[i] - sorted_dates[i - 1]).days
            if diff == 1:
                current_streak += 1
            else:
                break

    return WatchStreak(
        current_streak=current_streak,
        longest_streak=longest,
        last_watched=str(last_date),
    )


def _calc_total_runtime(movies) -> float:
    """Calculate total runtime in hours."""
    total_minutes = sum(m.runtime or 0 for m in movies)
    return round(total_minutes / 60, 1)


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete analytics overview for the current user."""
    current_year = datetime.now().year
    movies = _get_user_movies(current_user.id, db)

    avg_rating = (
        db.query(func.avg(DiaryEntry.rating))
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.rating.isnot(None),
        )
        .scalar()
    )

    return AnalyticsOverview(
        genres=_calc_genres(movies),
        monthly=_calc_monthly(current_user.id, db, current_year),
        decades=_calc_decades(movies),
        top_actors=_calc_people(movies, "cast_json"),
        top_directors=_calc_people(movies, "directors_json"),
        streaks=_calc_streaks(current_user.id, db),
        total_runtime_hours=_calc_total_runtime(movies),
        average_rating=round(float(avg_rating), 1) if avg_rating else None,
        total_movies=len(movies),
    )


@router.get("/genres", response_model=list)
def get_genre_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get genre breakdown."""
    movies = _get_user_movies(current_user.id, db)
    return _calc_genres(movies)


@router.get("/monthly", response_model=list)
def get_monthly_counts(
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get movies per month."""
    if year is None:
        year = datetime.now().year
    return _calc_monthly(current_user.id, db, year)


@router.get("/decades", response_model=list)
def get_decade_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get decade distribution."""
    movies = _get_user_movies(current_user.id, db)
    return _calc_decades(movies)


@router.get("/people", response_model=dict)
def get_top_people(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get most-watched actors and directors."""
    movies = _get_user_movies(current_user.id, db)
    return {
        "top_actors": _calc_people(movies, "cast_json"),
        "top_directors": _calc_people(movies, "directors_json"),
    }


@router.get("/streaks", response_model=WatchStreak)
def get_watch_streaks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get watch streak data."""
    return _calc_streaks(current_user.id, db)


@router.get("/year-in-review", response_model=YearInReviewResponse)
def get_year_in_review(
    year: int = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Year in Review (Spotify Wrapped style) for a given year."""
    if year is None:
        year = datetime.now().year

    movies = _get_user_movies(current_user.id, db, year=year)

    # Total entries (including rewatches) for the year
    total_entries = (
        db.query(func.count(DiaryEntry.id))
        .filter(
            DiaryEntry.user_id == current_user.id,
            extract("year", DiaryEntry.watched_date) == year,
        )
        .scalar()
        or 0
    )

    # Average rating for the year
    avg_rating = (
        db.query(func.avg(DiaryEntry.rating))
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.rating.isnot(None),
            extract("year", DiaryEntry.watched_date) == year,
        )
        .scalar()
    )

    # Genre breakdown
    genres = _calc_genres(movies)
    top_genre = genres[0].genre if genres else None

    # Top actor/director
    top_actors = _calc_people(movies, "cast_json")
    top_directors = _calc_people(movies, "directors_json")

    # Top rated movie (highest rating for the year)
    top_rated_entry = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.rating.isnot(None),
            extract("year", DiaryEntry.watched_date) == year,
        )
        .order_by(DiaryEntry.rating.desc())
        .first()
    )

    top_rated_movie = None
    if top_rated_entry:
        movie = db.query(Movie).filter(Movie.id == top_rated_entry.movie_id).first()
        if movie:
            top_rated_movie = {
                "title": movie.title,
                "tmdb_id": movie.tmdb_id,
                "poster_path": movie.poster_path,
                "rating": float(top_rated_entry.rating),
            }

    # Monthly breakdown
    monthly = _calc_monthly(current_user.id, db, year)

    # Most watched month
    max_month = max(monthly, key=lambda m: m.count) if monthly else None
    most_watched_month = (
        calendar.month_name[max_month.month]
        if max_month and max_month.count > 0
        else None
    )

    # Rating distribution
    rating_dist = Counter()
    entries = (
        db.query(DiaryEntry.rating)
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.rating.isnot(None),
            extract("year", DiaryEntry.watched_date) == year,
        )
        .all()
    )
    for (rating,) in entries:
        # Round to nearest 0.5
        rounded = round(float(rating) * 2) / 2
        rating_dist[rounded] += 1

    rating_distribution = [
        RatingDistribution(rating=r, count=c)
        for r, c in sorted(rating_dist.items())
    ]

    # Longest streak for the year
    dates = (
        db.query(func.distinct(DiaryEntry.watched_date))
        .filter(
            DiaryEntry.user_id == current_user.id,
            extract("year", DiaryEntry.watched_date) == year,
        )
        .order_by(DiaryEntry.watched_date.asc())
        .all()
    )
    sorted_dates = sorted([d[0] for d in dates]) if dates else []
    longest_streak = 1 if sorted_dates else 0
    current_s = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            current_s += 1
            longest_streak = max(longest_streak, current_s)
        else:
            current_s = 1

    return YearInReviewResponse(
        year=year,
        total_movies=len(movies),
        total_hours=_calc_total_runtime(movies),
        total_entries=total_entries,
        average_rating=round(float(avg_rating), 1) if avg_rating else None,
        top_genre=top_genre,
        top_actor=top_actors[0] if top_actors else None,
        top_director=top_directors[0] if top_directors else None,
        top_rated_movie=top_rated_movie,
        monthly=monthly,
        genres=genres,
        rating_distribution=rating_distribution,
        most_watched_month=most_watched_month,
        longest_streak=longest_streak,
    )
