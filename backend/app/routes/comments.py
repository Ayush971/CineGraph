from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.config.database import get_db
from app.models.comment import Comment
from app.models.movie import Movie
from app.models.user import User
from app.models.like import Like
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentAuthor,
    CommentResponse,
    CommentTreeResponse,
)
from app.utils.dependencies import get_current_user
from app.utils.auth import decode_access_token

router = APIRouter(prefix="/comments", tags=["Comments"])
security = HTTPBearer(auto_error=False)

MAX_NESTING_DEPTH = 10


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


def _get_like_count(db: Session, comment_id: int) -> int:
    return (
        db.query(func.count(Like.id))
        .filter(Like.target_type == "comment", Like.target_id == comment_id)
        .scalar()
        or 0
    )


def _user_liked(db: Session, user_id: Optional[int], comment_id: int) -> bool:
    if not user_id:
        return False
    return (
        db.query(Like)
        .filter(
            Like.user_id == user_id,
            Like.target_type == "comment",
            Like.target_id == comment_id,
        )
        .first()
        is not None
    )


def _get_reply_count(db: Session, comment_id: int) -> int:
    return (
        db.query(func.count(Comment.id))
        .filter(Comment.parent_id == comment_id)
        .scalar()
        or 0
    )


def _build_comment_tree(
    comments: List[Comment],
    db: Session,
    current_user_id: Optional[int],
    depth: int = 0,
) -> List[CommentTreeResponse]:
    """Build a nested comment tree from a flat list."""
    # Group by parent_id
    children_map: dict[Optional[int], List[Comment]] = {}
    for c in comments:
        children_map.setdefault(c.parent_id, []).append(c)

    def build_node(comment: Comment, current_depth: int) -> CommentTreeResponse:
        author = CommentAuthor(
            id=comment.user_id,
            username=comment.user.username if comment.user else "Deleted",
            avatar_url=comment.user.avatar_url if comment.user else None,
        )
        like_count = _get_like_count(db, comment.id)
        user_liked = _user_liked(db, current_user_id, comment.id)

        child_comments = children_map.get(comment.id, [])
        replies = []
        if current_depth < MAX_NESTING_DEPTH:
            replies = [build_node(child, current_depth + 1) for child in child_comments]

        return CommentTreeResponse(
            id=comment.id,
            movie_id=comment.movie_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            content=comment.content,
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author=author,
            like_count=like_count,
            user_liked=user_liked,
            reply_count=len(child_comments),
            replies=replies,
        )

    # Build from top-level (parent_id == None)
    root_comments = children_map.get(None, [])
    return [build_node(c, 0) for c in root_comments]


@router.get("/movie/{tmdb_id}", response_model=List[CommentTreeResponse])
def get_movie_comments(
    tmdb_id: int,
    sort: str = Query("newest", pattern="^(newest|oldest|top)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get all comments for a movie as a threaded tree."""
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        return []

    # Fetch all comments for this movie in one query
    query = db.query(Comment).filter(Comment.movie_id == movie.id)

    # Sort top-level by the chosen order
    if sort == "newest":
        query = query.order_by(Comment.created_at.desc())
    elif sort == "oldest":
        query = query.order_by(Comment.created_at.asc())
    else:  # top - we'll sort after building tree
        query = query.order_by(Comment.created_at.desc())

    all_comments = query.all()

    current_user_id = current_user.id if current_user else None
    tree = _build_comment_tree(all_comments, db, current_user_id)

    # If sorting by "top", sort top-level by like_count
    if sort == "top":
        tree.sort(key=lambda c: c.like_count, reverse=True)

    return tree


@router.get("/movie/{tmdb_id}/count")
def get_movie_comment_count(
    tmdb_id: int,
    db: Session = Depends(get_db),
):
    """Get total comment count for a movie."""
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        return {"count": 0}
    count = (
        db.query(func.count(Comment.id)).filter(Comment.movie_id == movie.id).scalar()
        or 0
    )
    return {"count": count}


@router.post(
    "/movie/{tmdb_id}",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    tmdb_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new comment (top-level or reply)."""
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found. Please view movie details page first.",
        )

    # Validate parent exists and belongs to same movie
    if comment_data.parent_id:
        parent = (
            db.query(Comment)
            .filter(
                Comment.id == comment_data.parent_id,
                Comment.movie_id == movie.id,
            )
            .first()
        )
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found.",
            )

        # Check nesting depth
        depth = 0
        check = parent
        while check.parent_id and depth < MAX_NESTING_DEPTH:
            check = db.query(Comment).filter(Comment.id == check.parent_id).first()
            depth += 1
        if depth >= MAX_NESTING_DEPTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum comment nesting depth reached.",
            )

    new_comment = Comment(
        movie_id=movie.id,
        user_id=current_user.id,
        parent_id=comment_data.parent_id,
        content=comment_data.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return CommentResponse(
        id=new_comment.id,
        movie_id=new_comment.movie_id,
        user_id=new_comment.user_id,
        parent_id=new_comment.parent_id,
        content=new_comment.content,
        is_edited=False,
        created_at=new_comment.created_at,
        updated_at=new_comment.updated_at,
        author=CommentAuthor(
            id=current_user.id,
            username=current_user.username,
            avatar_url=current_user.avatar_url,
        ),
        like_count=0,
        user_liked=False,
        reply_count=0,
    )


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit own comment."""
    comment = (
        db.query(Comment)
        .filter(
            Comment.id == comment_id,
            Comment.user_id == current_user.id,
        )
        .first()
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    comment.content = comment_data.content
    comment.is_edited = True
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        movie_id=comment.movie_id,
        user_id=comment.user_id,
        parent_id=comment.parent_id,
        content=comment.content,
        is_edited=comment.is_edited,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=CommentAuthor(
            id=current_user.id,
            username=current_user.username,
            avatar_url=current_user.avatar_url,
        ),
        like_count=_get_like_count(db, comment.id),
        user_liked=True,
        reply_count=_get_reply_count(db, comment.id),
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete own comment (and all replies via cascade)."""
    comment = (
        db.query(Comment)
        .filter(
            Comment.id == comment_id,
            Comment.user_id == current_user.id,
        )
        .first()
    )
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    db.delete(comment)
    db.commit()
    return None
