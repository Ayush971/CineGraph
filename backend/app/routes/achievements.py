from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.user import User
from app.models.achievement import Achievement, UserAchievement
from app.schemas.achievement import (
    AchievementResponse,
    UserAchievementResponse,
    AchievementProgress,
)
from app.services.achievement_engine import (
    seed_achievements,
    check_achievements,
    get_progress_for_achievement,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/achievements", tags=["Achievements"])


@router.get("/", response_model=List[AchievementProgress])
def get_all_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all achievements with user's progress."""
    seed_achievements(db)

    all_achievements = db.query(Achievement).all()
    earned_map = {}
    for ua in (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .all()
    ):
        earned_map[ua.achievement_id] = ua.earned_at

    results = []
    for ach in all_achievements:
        current, target = get_progress_for_achievement(ach, current_user.id, db)
        earned = ach.id in earned_map

        results.append(
            AchievementProgress(
                achievement=AchievementResponse(
                    id=ach.id,
                    title=ach.title,
                    description=ach.description,
                    icon=ach.icon,
                    criteria_type=ach.criteria_type,
                    category=ach.category,
                    tier=ach.tier,
                ),
                earned=earned,
                earned_at=earned_map.get(ach.id),
                current=min(current, target),
                target=target,
                progress_text=f"{min(current, target)}/{target}",
            )
        )

    # Sort: earned first (by earned_at desc), then by progress % desc
    results.sort(
        key=lambda r: (
            not r.earned,
            -(r.earned_at.timestamp() if r.earned_at else 0),
            -(r.current / r.target if r.target > 0 else 0),
        )
    )

    return results


@router.get("/my", response_model=List[UserAchievementResponse])
def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the current user's earned achievements."""
    user_achievements = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
        .all()
    )

    results = []
    for ua in user_achievements:
        ach = db.query(Achievement).filter(Achievement.id == ua.achievement_id).first()
        if ach:
            results.append(
                UserAchievementResponse(
                    achievement=AchievementResponse(
                        id=ach.id,
                        title=ach.title,
                        description=ach.description,
                        icon=ach.icon,
                        criteria_type=ach.criteria_type,
                        category=ach.category,
                        tier=ach.tier,
                    ),
                    earned_at=ua.earned_at,
                )
            )

    return results


@router.post("/check")
def trigger_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger achievement check (debug/dev)."""
    newly_earned = check_achievements(current_user.id, db)
    return {"newly_earned": newly_earned, "count": len(newly_earned)}
