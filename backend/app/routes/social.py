from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime
from app.config.database import get_db
from app.models.user import User
from app.models.follow import Follow
from app.models.diary_entry import DiaryEntry
from app.models.comment import Comment
from app.models.movie import Movie
from app.models.list import MovieList
from app.models.list_item import ListItem
from app.schemas.social import (
    FollowUserInfo,
    FollowResponse,
    UserProfileResponse,
    ActivityItem,
    ActivityFeedResponse,
)
from app.utils.dependencies import get_current_user
from app.utils.auth import decode_access_token

router = APIRouter(prefix="/social", tags=["Social"])
security = HTTPBearer(auto_error=False)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None
    user_id = payload.get("user_id")
    if user_id is None:
        return None
    return db.query(User).filter(User.id == user_id).first()


def _user_info(user: User) -> FollowUserInfo:
    return FollowUserInfo(
        id=user.id,
        username=user.username,
        avatar_url=user.avatar_url,
        bio=user.bio,
    )


# =============================================
# FOLLOW / UNFOLLOW
# =============================================


@router.post("/follow/{user_id}", status_code=status.HTTP_201_CREATED)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Follow a user."""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot follow yourself.",
        )

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    existing = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already following this user.",
        )

    new_follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(new_follow)
    db.commit()

    return {"message": "Followed successfully", "following": True}


@router.delete("/follow/{user_id}", status_code=status.HTTP_200_OK)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unfollow a user."""
    follow = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == user_id,
        )
        .first()
    )
    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not following this user.",
        )

    db.delete(follow)
    db.commit()

    return {"message": "Unfollowed successfully", "following": False}


# =============================================
# FOLLOWERS / FOLLOWING LISTS
# =============================================


@router.get("/followers/{user_id}", response_model=List[FollowUserInfo])
def get_followers(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Get a user's followers."""
    follows = db.query(Follow).filter(Follow.following_id == user_id).all()
    result = []
    for f in follows:
        user = db.query(User).filter(User.id == f.follower_id).first()
        if user:
            result.append(_user_info(user))
    return result


@router.get("/following/{user_id}", response_model=List[FollowUserInfo])
def get_following(
    user_id: int,
    db: Session = Depends(get_db),
):
    """Get who a user is following."""
    follows = db.query(Follow).filter(Follow.follower_id == user_id).all()
    result = []
    for f in follows:
        user = db.query(User).filter(User.id == f.following_id).first()
        if user:
            result.append(_user_info(user))
    return result


# =============================================
# USER PROFILE
# =============================================


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get user profile with social stats."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    follower_count = (
        db.query(func.count(Follow.id)).filter(Follow.following_id == user_id).scalar()
        or 0
    )
    following_count = (
        db.query(func.count(Follow.id)).filter(Follow.follower_id == user_id).scalar()
        or 0
    )

    is_following = False
    if current_user and current_user.id != user_id:
        is_following = (
            db.query(Follow)
            .filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id,
            )
            .first()
            is not None
        )

    total_movies = (
        db.query(func.count(func.distinct(DiaryEntry.movie_id)))
        .filter(DiaryEntry.user_id == user_id)
        .scalar()
        or 0
    )

    total_lists = (
        db.query(func.count(MovieList.id)).filter(MovieList.user_id == user_id).scalar()
        or 0
    )

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        bio=user.bio,
        created_at=user.created_at,
        follower_count=follower_count,
        following_count=following_count,
        is_following=is_following,
        total_movies_watched=total_movies,
        total_lists=total_lists,
    )


# =============================================
# ACTIVITY FEED
# =============================================


@router.get("/feed", response_model=ActivityFeedResponse)
def get_activity_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity feed from followed users."""
    # Get list of followed user IDs
    following_ids = [
        f.following_id
        for f in db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    ]

    if not following_ids:
        return ActivityFeedResponse(items=[], has_more=False)

    activities: List[ActivityItem] = []

    # Diary entries (watched / reviewed)
    diary_entries = (
        db.query(DiaryEntry)
        .filter(DiaryEntry.user_id.in_(following_ids))
        .order_by(DiaryEntry.created_at.desc())
        .limit(limit * 2)
        .all()
    )
    for entry in diary_entries:
        user = db.query(User).filter(User.id == entry.user_id).first()
        movie = db.query(Movie).filter(Movie.id == entry.movie_id).first()
        if not user or not movie:
            continue

        activity_type = "reviewed" if entry.review else "watched"
        detail = None
        if entry.review:
            detail = entry.review[:100] + ("..." if len(entry.review) > 100 else "")
        elif entry.rating:
            detail = f"Rated {float(entry.rating)}/10"

        activities.append(
            ActivityItem(
                type=activity_type,
                user=_user_info(user),
                movie_title=movie.title,
                movie_id=movie.tmdb_id,
                movie_poster=movie.poster_path,
                detail=detail,
                timestamp=entry.created_at,
            )
        )

    # Comments
    comments = (
        db.query(Comment)
        .filter(Comment.user_id.in_(following_ids))
        .order_by(Comment.created_at.desc())
        .limit(limit)
        .all()
    )
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        movie = db.query(Movie).filter(Movie.id == comment.movie_id).first()
        if not user or not movie:
            continue

        activities.append(
            ActivityItem(
                type="commented",
                user=_user_info(user),
                movie_title=movie.title,
                movie_id=movie.tmdb_id,
                movie_poster=movie.poster_path,
                detail=comment.content[:100]
                + ("..." if len(comment.content) > 100 else ""),
                timestamp=comment.created_at,
            )
        )

    # Sort all by timestamp
    activities.sort(key=lambda a: a.timestamp, reverse=True)

    # Paginate
    paginated = activities[skip : skip + limit]
    has_more = len(activities) > skip + limit

    return ActivityFeedResponse(items=paginated, has_more=has_more)
