from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    overview = Column(Text, nullable=True)
    release_date = Column(Date, nullable=True)
    poster_path = Column(String(255), nullable=True)
    backdrop_path = Column(String(255), nullable=True)
    runtime = Column(Integer, nullable=True)
    # Cached TMDB data for analytics (stored as JSON strings)
    genres_json = Column(Text, nullable=True)  # e.g. '[{"id":28,"name":"Action"},...]'
    cast_json = Column(Text, nullable=True)  # Top 10 cast: '[{"id":123,"name":"Tom Cruise","character":"Ethan Hunt","profile_path":"/..."},...]'
    directors_json = Column(Text, nullable=True)  # '[{"id":456,"name":"Christopher Nolan","profile_path":"/..."},...]'
    cached_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    diary_entries = relationship(
        "DiaryEntry", back_populates="movie", cascade="all, delete-orphan"
    )
    list_items = relationship(
        "ListItem", back_populates="movie", cascade="all, delete-orphan"
    )
    comments = relationship(
        "Comment", back_populates="movie", cascade="all, delete-orphan"
    )
