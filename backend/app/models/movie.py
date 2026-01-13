from sqlalchemy import Column, Integer, String, Text, Date, DateTime
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
    cached_at = Column(DateTime(timezone=True), server_default=func.now())