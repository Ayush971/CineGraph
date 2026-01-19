from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class DiaryEntry(Base):
    __tablename__ = "diary_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    watched_date = Column(Date, nullable=False)
    rating = Column(Numeric(3, 1), nullable=True)  # 0.0 to 10.0
    review = Column(Text, nullable=True)
    is_rewatch = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="diary_entries")
    movie = relationship("Movie", back_populates="diary_entries")
