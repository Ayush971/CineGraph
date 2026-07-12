"""
Achievement Engine — checks and awards achievements to users.
Called synchronously after diary entry creation.
"""
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.achievement import Achievement, UserAchievement
from app.models.diary_entry import DiaryEntry
from app.models.movie import Movie
from app.config.database import SessionLocal

# Achievement definitions to seed into the database
ACHIEVEMENT_DEFINITIONS = [
    # Movie count achievements (based on unique movies watched)
    {
        "title": "First Steps",
        "description": "Log your first movie",
        "icon": "🎬",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 1}),
        "category": "general",
        "tier": "bronze",
    },
    {
        "title": "Getting Started",
        "description": "Watch 10 movies",
        "icon": "🌟",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 10}),
        "category": "general",
        "tier": "bronze",
    },
    {
        "title": "Movie Buff",
        "description": "Watch 25 movies",
        "icon": "🎭",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 25}),
        "category": "general",
        "tier": "silver",
    },
    {
        "title": "Half Century",
        "description": "Watch 50 movies",
        "icon": "🏆",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 50}),
        "category": "general",
        "tier": "silver",
    },
    {
        "title": "Century Club",
        "description": "Watch 100 movies",
        "icon": "💯",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 100}),
        "category": "general",
        "tier": "gold",
    },
    {
        "title": "Movie Marathon",
        "description": "Watch 250 movies",
        "icon": "🎞️",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 250}),
        "category": "general",
        "tier": "gold",
    },
    {
        "title": "Cinema Legend",
        "description": "Watch 500 movies",
        "icon": "👑",
        "criteria_type": "movie_count",
        "criteria_value": json.dumps({"threshold": 500}),
        "category": "general",
        "tier": "platinum",
    },
    # Diary-specific achievements
    {
        "title": "Dear Diary",
        "description": "Create 5 diary entries",
        "icon": "📖",
        "criteria_type": "diary_count",
        "criteria_value": json.dumps({"threshold": 5}),
        "category": "diary",
        "tier": "bronze",
    },
    {
        "title": "Diary Devotee",
        "description": "Create 50 diary entries",
        "icon": "📚",
        "criteria_type": "diary_count",
        "criteria_value": json.dumps({"threshold": 50}),
        "category": "diary",
        "tier": "silver",
    },
    {
        "title": "Rewatch King",
        "description": "Log 10 rewatches",
        "icon": "🔄",
        "criteria_type": "rewatch_count",
        "criteria_value": json.dumps({"threshold": 10}),
        "category": "diary",
        "tier": "silver",
    },
    {
        "title": "Critic's Eye",
        "description": "Write 10 reviews",
        "icon": "✍️",
        "criteria_type": "review_count",
        "criteria_value": json.dumps({"threshold": 10}),
        "category": "diary",
        "tier": "silver",
    },
    {
        "title": "Hot Streak",
        "description": "Watch a movie 7 days in a row",
        "icon": "🔥",
        "criteria_type": "diary_streak",
        "criteria_value": json.dumps({"threshold": 7}),
        "category": "diary",
        "tier": "gold",
    },
    {
        "title": "Month of Movies",
        "description": "Watch a movie 30 days in a row",
        "icon": "📅",
        "criteria_type": "diary_streak",
        "criteria_value": json.dumps({"threshold": 30}),
        "category": "diary",
        "tier": "platinum",
    },
    # Genre achievements (based on unique movies in a genre)
    {
        "title": "Action Hero",
        "description": "Watch 20 action movies",
        "icon": "💥",
        "criteria_type": "genre_count",
        "criteria_value": json.dumps({"genre": "Action", "threshold": 20}),
        "category": "genre",
        "tier": "silver",
    },
    {
        "title": "Funny Bone",
        "description": "Watch 20 comedy movies",
        "icon": "😂",
        "criteria_type": "genre_count",
        "criteria_value": json.dumps({"genre": "Comedy", "threshold": 20}),
        "category": "genre",
        "tier": "silver",
    },
    {
        "title": "Nightmare Fuel",
        "description": "Watch 20 horror movies",
        "icon": "👻",
        "criteria_type": "genre_count",
        "criteria_value": json.dumps({"genre": "Horror", "threshold": 20}),
        "category": "genre",
        "tier": "silver",
    },
    {
        "title": "Sci-Fi Fanatic",
        "description": "Watch 20 sci-fi movies",
        "icon": "🚀",
        "criteria_type": "genre_count",
        "criteria_value": json.dumps({"genre": "Science Fiction", "threshold": 20}),
        "category": "genre",
        "tier": "silver",
    },
    {
        "title": "Hopeless Romantic",
        "description": "Watch 20 romance movies",
        "icon": "❤️",
        "criteria_type": "genre_count",
        "criteria_value": json.dumps({"genre": "Romance", "threshold": 20}),
        "category": "genre",
        "tier": "silver",
    },
    # Actor achievements (based on movies with a specific actor)
    {
        "title": "Cruise Control",
        "description": "Watch 10 Tom Cruise movies",
        "icon": "✈️",
        "criteria_type": "actor_count",
        "criteria_value": json.dumps({"actor_name": "Tom Cruise", "threshold": 10}),
        "category": "actor",
        "tier": "gold",
    },
    {
        "title": "DiCaprio Fan",
        "description": "Watch 10 Leonardo DiCaprio movies",
        "icon": "🎩",
        "criteria_type": "actor_count",
        "criteria_value": json.dumps({"actor_name": "Leonardo DiCaprio", "threshold": 10}),
        "category": "actor",
        "tier": "gold",
    },
    {
        "title": "Nolan's Universe",
        "description": "Watch 5 Christopher Nolan movies",
        "icon": "🌀",
        "criteria_type": "director_count",
        "criteria_value": json.dumps({"director_name": "Christopher Nolan", "threshold": 5}),
        "category": "actor",
        "tier": "gold",
    },
    {
        "title": "Spielberg Saga",
        "description": "Watch 5 Steven Spielberg movies",
        "icon": "🦖",
        "criteria_type": "director_count",
        "criteria_value": json.dumps({"director_name": "Steven Spielberg", "threshold": 5}),
        "category": "actor",
        "tier": "gold",
    },
    # Rating achievements
    {
        "title": "Picky Viewer",
        "description": "Rate 5 movies below 3/10",
        "icon": "👎",
        "criteria_type": "low_rating_count",
        "criteria_value": json.dumps({"max_rating": 3, "threshold": 5}),
        "category": "general",
        "tier": "bronze",
    },
    {
        "title": "Easy to Please",
        "description": "Rate 10 movies 9/10 or higher",
        "icon": "😍",
        "criteria_type": "high_rating_count",
        "criteria_value": json.dumps({"min_rating": 9, "threshold": 10}),
        "category": "general",
        "tier": "silver",
    },
]


def seed_achievements(db: Session):
    """Seed achievement definitions into the database if they don't exist."""
    existing = db.query(Achievement.title).all()
    existing_titles = {a.title for a in existing}

    for defn in ACHIEVEMENT_DEFINITIONS:
        if defn["title"] not in existing_titles:
            db.add(Achievement(**defn))

    db.commit()


def _get_unique_movie_count(user_id: int, db: Session) -> int:
    """Count unique movies a user has logged."""
    return (
        db.query(func.count(func.distinct(DiaryEntry.movie_id)))
        .filter(DiaryEntry.user_id == user_id)
        .scalar()
        or 0
    )


def _get_diary_entry_count(user_id: int, db: Session) -> int:
    """Count total diary entries."""
    return (
        db.query(func.count(DiaryEntry.id))
        .filter(DiaryEntry.user_id == user_id)
        .scalar()
        or 0
    )


def _get_rewatch_count(user_id: int, db: Session) -> int:
    """Count diary entries marked as rewatches."""
    return (
        db.query(func.count(DiaryEntry.id))
        .filter(DiaryEntry.user_id == user_id, DiaryEntry.is_rewatch == True)
        .scalar()
        or 0
    )


def _get_review_count(user_id: int, db: Session) -> int:
    """Count diary entries with reviews."""
    return (
        db.query(func.count(DiaryEntry.id))
        .filter(
            DiaryEntry.user_id == user_id,
            DiaryEntry.review.isnot(None),
            DiaryEntry.review != "",
        )
        .scalar()
        or 0
    )


def _get_watch_streak(user_id: int, db: Session) -> int:
    """Calculate the longest consecutive watch streak (days) from diary entries."""
    dates = (
        db.query(func.distinct(DiaryEntry.watched_date))
        .filter(DiaryEntry.user_id == user_id)
        .order_by(DiaryEntry.watched_date.asc())
        .all()
    )

    if not dates:
        return 0

    sorted_dates = sorted([d[0] for d in dates])
    longest = 1
    current = 1

    for i in range(1, len(sorted_dates)):
        diff = (sorted_dates[i] - sorted_dates[i - 1]).days
        if diff == 1:
            current += 1
            longest = max(longest, current)
        elif diff > 1:
            current = 1

    return longest


def _get_genre_movie_count(user_id: int, genre_name: str, db: Session) -> int:
    """Count unique movies of a specific genre that the user has watched."""
    movie_ids = (
        db.query(func.distinct(DiaryEntry.movie_id))
        .filter(DiaryEntry.user_id == user_id)
        .all()
    )

    if not movie_ids:
        return 0

    ids = [m[0] for m in movie_ids]
    count = 0
    for mid in ids:
        movie = db.query(Movie).filter(Movie.id == mid).first()
        if movie and movie.genres_json:
            try:
                genres = json.loads(movie.genres_json)
                if any(g.get("name") == genre_name for g in genres):
                    count += 1
            except (json.JSONDecodeError, TypeError):
                pass

    return count


def _get_actor_movie_count(user_id: int, actor_name: str, db: Session) -> int:
    """Count unique movies with a specific actor that the user has watched."""
    movie_ids = (
        db.query(func.distinct(DiaryEntry.movie_id))
        .filter(DiaryEntry.user_id == user_id)
        .all()
    )

    if not movie_ids:
        return 0

    ids = [m[0] for m in movie_ids]
    count = 0
    for mid in ids:
        movie = db.query(Movie).filter(Movie.id == mid).first()
        if movie and movie.cast_json:
            try:
                cast = json.loads(movie.cast_json)
                if any(c.get("name") == actor_name for c in cast):
                    count += 1
            except (json.JSONDecodeError, TypeError):
                pass

    return count


def _get_director_movie_count(user_id: int, director_name: str, db: Session) -> int:
    """Count unique movies by a specific director that the user has watched."""
    movie_ids = (
        db.query(func.distinct(DiaryEntry.movie_id))
        .filter(DiaryEntry.user_id == user_id)
        .all()
    )

    if not movie_ids:
        return 0

    ids = [m[0] for m in movie_ids]
    count = 0
    for mid in ids:
        movie = db.query(Movie).filter(Movie.id == mid).first()
        if movie and movie.directors_json:
            try:
                directors = json.loads(movie.directors_json)
                if any(d.get("name") == director_name for d in directors):
                    count += 1
            except (json.JSONDecodeError, TypeError):
                pass

    return count


def _get_low_rating_count(user_id: int, max_rating: float, db: Session) -> int:
    """Count movies rated at or below max_rating."""
    return (
        db.query(func.count(DiaryEntry.id))
        .filter(
            DiaryEntry.user_id == user_id,
            DiaryEntry.rating.isnot(None),
            DiaryEntry.rating <= max_rating,
        )
        .scalar()
        or 0
    )


def _get_high_rating_count(user_id: int, min_rating: float, db: Session) -> int:
    """Count movies rated at or above min_rating."""
    return (
        db.query(func.count(DiaryEntry.id))
        .filter(
            DiaryEntry.user_id == user_id,
            DiaryEntry.rating.isnot(None),
            DiaryEntry.rating >= min_rating,
        )
        .scalar()
        or 0
    )


def get_progress_for_achievement(
    achievement: Achievement, user_id: int, db: Session
) -> tuple:
    """Get current progress (current_value, target_value) for an achievement."""
    criteria = json.loads(achievement.criteria_value)
    threshold = criteria.get("threshold", 0)

    if achievement.criteria_type == "movie_count":
        current = _get_unique_movie_count(user_id, db)
    elif achievement.criteria_type == "diary_count":
        current = _get_diary_entry_count(user_id, db)
    elif achievement.criteria_type == "rewatch_count":
        current = _get_rewatch_count(user_id, db)
    elif achievement.criteria_type == "review_count":
        current = _get_review_count(user_id, db)
    elif achievement.criteria_type == "diary_streak":
        current = _get_watch_streak(user_id, db)
    elif achievement.criteria_type == "genre_count":
        genre_name = criteria.get("genre", "")
        current = _get_genre_movie_count(user_id, genre_name, db)
    elif achievement.criteria_type == "actor_count":
        actor_name = criteria.get("actor_name", "")
        current = _get_actor_movie_count(user_id, actor_name, db)
    elif achievement.criteria_type == "director_count":
        director_name = criteria.get("director_name", "")
        current = _get_director_movie_count(user_id, director_name, db)
    elif achievement.criteria_type == "low_rating_count":
        max_rating = criteria.get("max_rating", 3)
        current = _get_low_rating_count(user_id, max_rating, db)
    elif achievement.criteria_type == "high_rating_count":
        min_rating = criteria.get("min_rating", 9)
        current = _get_high_rating_count(user_id, min_rating, db)
    else:
        current = 0

    return current, threshold


def check_achievements(user_id: int, db: Session) -> list:
    """
    Check all achievements for a user and award any newly earned ones.
    Returns a list of newly earned achievement titles.
    """
    # Seed achievements if needed
    seed_achievements(db)

    all_achievements = db.query(Achievement).all()
    earned_ids = {
        ua.achievement_id
        for ua in db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id)
        .all()
    }

    newly_earned = []

    for achievement in all_achievements:
        if achievement.id in earned_ids:
            continue

        current, threshold = get_progress_for_achievement(achievement, user_id, db)

        if current >= threshold:
            ua = UserAchievement(user_id=user_id, achievement_id=achievement.id)
            db.add(ua)
            newly_earned.append(achievement.title)

    if newly_earned:
        db.commit()

    return newly_earned
