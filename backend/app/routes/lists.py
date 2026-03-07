from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.config.database import get_db
from app.models.list import MovieList
from app.models.list_item import ListItem
from app.models.movie import Movie
from app.models.user import User
from app.schemas.list import (
    ListCreate,
    ListUpdate,
    ListResponse,
    ListItemCreate,
    ListItemResponse,
    ListDetailResponse,
    ListReorderRequest,
    ListItemMovieData,
)
from app.utils.dependencies import get_current_user
from app.utils.auth import decode_access_token
from app.services.tmdb import tmdb_service

router = APIRouter(prefix="/lists", tags=["Lists"])
security = HTTPBearer(auto_error=False)


# --- Helper: optional auth (for public list viewing) ---
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


# --- Helper: build movie data dict ---
def _movie_data(movie: Movie) -> ListItemMovieData:
    return ListItemMovieData(
        id=movie.id,
        tmdb_id=movie.tmdb_id,
        title=movie.title,
        poster_path=movie.poster_path,
        release_date=str(movie.release_date) if movie.release_date else None,
        backdrop_path=movie.backdrop_path,
        runtime=movie.runtime,
    )


# --- Helper: build list response ---
def _list_response(ml: MovieList, db: Session) -> ListResponse:
    item_count = (
        db.query(func.count(ListItem.id)).filter(ListItem.list_id == ml.id).scalar()
        or 0
    )
    owner = db.query(User).filter(User.id == ml.user_id).first()
    return ListResponse(
        id=ml.id,
        user_id=ml.user_id,
        title=ml.title,
        description=ml.description,
        is_public=ml.is_public,
        created_at=ml.created_at,
        updated_at=ml.updated_at,
        item_count=item_count,
        owner_username=owner.username if owner else "",
    )


# =============================================
# LIST CRUD
# =============================================


@router.post("/", response_model=ListResponse, status_code=status.HTTP_201_CREATED)
def create_list(
    list_data: ListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_list = MovieList(
        user_id=current_user.id,
        title=list_data.title,
        description=list_data.description,
        is_public=list_data.is_public,
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return _list_response(new_list, db)


@router.get("/", response_model=List[ListResponse])
def get_my_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lists = (
        db.query(MovieList)
        .filter(MovieList.user_id == current_user.id)
        .order_by(MovieList.updated_at.desc().nullslast(), MovieList.created_at.desc())
        .all()
    )
    return [_list_response(ml, db) for ml in lists]


@router.get("/discover", response_model=List[ListResponse])
def discover_lists(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Browse popular public lists."""
    query = db.query(MovieList).filter(MovieList.is_public == True)

    if search:
        query = query.filter(MovieList.title.ilike(f"%{search}%"))

    # Order by item count (popularity proxy)
    item_count_sub = (
        db.query(ListItem.list_id, func.count(ListItem.id).label("cnt"))
        .group_by(ListItem.list_id)
        .subquery()
    )
    query = query.outerjoin(
        item_count_sub, MovieList.id == item_count_sub.c.list_id
    ).order_by(item_count_sub.c.cnt.desc().nullslast(), MovieList.created_at.desc())

    lists = query.offset(skip).limit(limit).all()
    return [_list_response(ml, db) for ml in lists]


@router.get("/{list_id}", response_model=ListDetailResponse)
def get_list_detail(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    ml = db.query(MovieList).filter(MovieList.id == list_id).first()
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    # Check access
    is_owner = current_user and current_user.id == ml.user_id
    if not ml.is_public and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This list is private"
        )

    owner = db.query(User).filter(User.id == ml.user_id).first()

    # Build items with movie data
    items = (
        db.query(ListItem)
        .filter(ListItem.list_id == ml.id)
        .order_by(ListItem.rank.asc())
        .all()
    )

    item_responses = []
    for item in items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            item_responses.append(
                ListItemResponse(
                    id=item.id,
                    list_id=item.list_id,
                    movie_id=item.movie_id,
                    rank=item.rank,
                    notes=item.notes,
                    added_at=item.added_at,
                    movie=_movie_data(movie),
                )
            )

    return ListDetailResponse(
        id=ml.id,
        user_id=ml.user_id,
        title=ml.title,
        description=ml.description,
        is_public=ml.is_public,
        created_at=ml.created_at,
        updated_at=ml.updated_at,
        owner_username=owner.username if owner else "",
        items=item_responses,
    )


@router.get("/share/{list_id}", response_model=ListDetailResponse)
def get_shared_list(
    list_id: int,
    db: Session = Depends(get_db),
):
    """Public share link — no auth required, list must be public."""
    ml = db.query(MovieList).filter(MovieList.id == list_id).first()
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    if not ml.is_public:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This list is private"
        )

    owner = db.query(User).filter(User.id == ml.user_id).first()

    items = (
        db.query(ListItem)
        .filter(ListItem.list_id == ml.id)
        .order_by(ListItem.rank.asc())
        .all()
    )

    item_responses = []
    for item in items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            item_responses.append(
                ListItemResponse(
                    id=item.id,
                    list_id=item.list_id,
                    movie_id=item.movie_id,
                    rank=item.rank,
                    notes=item.notes,
                    added_at=item.added_at,
                    movie=_movie_data(movie),
                )
            )

    return ListDetailResponse(
        id=ml.id,
        user_id=ml.user_id,
        title=ml.title,
        description=ml.description,
        is_public=ml.is_public,
        created_at=ml.created_at,
        updated_at=ml.updated_at,
        owner_username=owner.username if owner else "",
        items=item_responses,
    )


@router.put("/{list_id}", response_model=ListResponse)
def update_list(
    list_id: int,
    list_data: ListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ml = (
        db.query(MovieList)
        .filter(MovieList.id == list_id, MovieList.user_id == current_user.id)
        .first()
    )
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    if list_data.title is not None:
        ml.title = list_data.title
    if list_data.description is not None:
        ml.description = list_data.description
    if list_data.is_public is not None:
        ml.is_public = list_data.is_public

    db.commit()
    db.refresh(ml)
    return _list_response(ml, db)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_list(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ml = (
        db.query(MovieList)
        .filter(MovieList.id == list_id, MovieList.user_id == current_user.id)
        .first()
    )
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    db.delete(ml)
    db.commit()
    return None


# =============================================
# LIST ITEMS
# =============================================


@router.post(
    "/{list_id}/items",
    response_model=ListItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_item_to_list(
    list_id: int,
    item_data: ListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ml = (
        db.query(MovieList)
        .filter(MovieList.id == list_id, MovieList.user_id == current_user.id)
        .first()
    )
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    # Resolve movie by tmdb_id — auto-cache from TMDB if not found
    movie = db.query(Movie).filter(Movie.tmdb_id == item_data.movie_id).first()
    if not movie:
        try:
            movie_data = tmdb_service.get_movie_details(item_data.movie_id)
            movie = Movie(
                tmdb_id=item_data.movie_id,
                title=movie_data.get("title"),
                overview=movie_data.get("overview"),
                release_date=movie_data.get("release_date") or None,
                poster_path=movie_data.get("poster_path"),
                backdrop_path=movie_data.get("backdrop_path"),
                runtime=movie_data.get("runtime"),
            )
            db.add(movie)
            db.commit()
            db.refresh(movie)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found on TMDB.",
            )

    # Check for duplicates
    existing = (
        db.query(ListItem)
        .filter(ListItem.list_id == list_id, ListItem.movie_id == movie.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Movie already in this list"
        )

    # Auto-assign rank if not provided
    if item_data.rank is not None:
        rank = item_data.rank
    else:
        max_rank = (
            db.query(func.max(ListItem.rank))
            .filter(ListItem.list_id == list_id)
            .scalar()
        )
        rank = (max_rank or 0) + 1

    new_item = ListItem(
        list_id=list_id,
        movie_id=movie.id,
        rank=rank,
        notes=item_data.notes,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return ListItemResponse(
        id=new_item.id,
        list_id=new_item.list_id,
        movie_id=new_item.movie_id,
        rank=new_item.rank,
        notes=new_item.notes,
        added_at=new_item.added_at,
        movie=_movie_data(movie),
    )


@router.put("/{list_id}/items/reorder", response_model=List[ListItemResponse])
def reorder_items(
    list_id: int,
    reorder_data: ListReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bulk reorder list items — accepts a list of {item_id, rank} pairs."""
    ml = (
        db.query(MovieList)
        .filter(MovieList.id == list_id, MovieList.user_id == current_user.id)
        .first()
    )
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    for reorder_item in reorder_data.items:
        item = (
            db.query(ListItem)
            .filter(
                ListItem.id == reorder_item.item_id,
                ListItem.list_id == list_id,
            )
            .first()
        )
        if item:
            item.rank = reorder_item.rank

    db.commit()

    # Return updated items
    items = (
        db.query(ListItem)
        .filter(ListItem.list_id == list_id)
        .order_by(ListItem.rank.asc())
        .all()
    )

    result = []
    for item in items:
        movie = db.query(Movie).filter(Movie.id == item.movie_id).first()
        if movie:
            result.append(
                ListItemResponse(
                    id=item.id,
                    list_id=item.list_id,
                    movie_id=item.movie_id,
                    rank=item.rank,
                    notes=item.notes,
                    added_at=item.added_at,
                    movie=_movie_data(movie),
                )
            )

    return result


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_item_from_list(
    list_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ml = (
        db.query(MovieList)
        .filter(MovieList.id == list_id, MovieList.user_id == current_user.id)
        .first()
    )
    if not ml:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="List not found"
        )

    item = (
        db.query(ListItem)
        .filter(ListItem.id == item_id, ListItem.list_id == list_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found"
        )

    db.delete(item)
    db.commit()
    return None
