from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class ListItem(Base):
    __tablename__ = "list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("lists.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    rank = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Prevent duplicate movies in the same list
    __table_args__ = (UniqueConstraint("list_id", "movie_id", name="uq_list_movie"),)

    # Relationships
    movie_list = relationship("MovieList", back_populates="items")
    movie = relationship("Movie", back_populates="list_items")
