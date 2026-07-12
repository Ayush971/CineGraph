from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.config.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)  # Emoji or icon name
    criteria_type = Column(String(50), nullable=False)  # "movie_count", "actor_count", "genre_count", "diary_streak", etc.
    criteria_value = Column(Text, nullable=False)  # JSON string with threshold/params
    category = Column(String(50), nullable=False, default="general")  # "general", "diary", "social", "genre", "actor"
    tier = Column(String(20), nullable=False, default="bronze")  # "bronze", "silver", "gold", "platinum"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False, index=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )
