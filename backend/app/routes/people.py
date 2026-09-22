from fastapi import APIRouter, HTTPException, Query

from app.schemas.person import PersonDetail, PersonCredit, CreditGroup
from app.services.tmdb import tmdb_service

router = APIRouter(prefix="/people", tags=["People"])

# Crew jobs that get their own section, in the order they should appear.
# Everything else is folded into a single "Other Work" group so the page
# doesn't sprawl into 20 near-empty sections.
FEATURED_JOBS = [
    ("Director", "Directing"),
    ("Producer", "Producing"),
    ("Executive Producer", "Producing"),
    ("Writer", "Writing"),
    ("Screenplay", "Writing"),
    ("Original Music Composer", "Music"),
]

GROUP_ORDER = ["Acting", "Directing", "Producing", "Writing", "Music", "Other Work"]


def _to_credit(item: dict, role: str | None) -> PersonCredit:
    return PersonCredit(
        tmdb_id=item.get("id"),
        title=item.get("title") or item.get("original_title") or "Untitled",
        poster_path=item.get("poster_path"),
        release_date=item.get("release_date") or None,
        vote_average=item.get("vote_average"),
        vote_count=item.get("vote_count"),
        role=role or None,
    )


# A film needs at least this many votes for its rating to be trusted. Without
# this guard an obscure short with a single 10/10 vote would outrank Inception.
MIN_VOTES_FOR_RANKING = 50


def _sort_key(credit: PersonCredit):
    """
    Best-rated first.

    Films with too few votes (or none at all — unreleased titles) are pushed
    below every properly-rated film rather than being ranked on noise. Within
    each band, higher rating wins, then more votes, then newer.
    """
    rating = credit.vote_average or 0.0
    votes = credit.vote_count or 0
    trusted = 1 if votes >= MIN_VOTES_FOR_RANKING else 0
    return (trusted, rating, votes, credit.release_date or "")


@router.get("/{person_id}", response_model=PersonDetail)
def get_person(person_id: int, limit_per_group: int = Query(60, ge=1, le=200)):
    """
    A person's profile: biography plus their filmography, grouped by what they
    did (acting, directing, producing, ...).
    """
    try:
        details = tmdb_service.get_person_details(person_id)
    except HTTPException:
        raise HTTPException(status_code=404, detail="Person not found")

    try:
        credits = tmdb_service.get_person_movie_credits(person_id)
    except HTTPException:
        credits = {"cast": [], "crew": []}

    # ---- Acting ----
    groups: dict[str, list[PersonCredit]] = {}
    seen_acting: set[int] = set()
    for item in credits.get("cast", []):
        mid = item.get("id")
        if mid is None or mid in seen_acting:
            continue
        seen_acting.add(mid)
        groups.setdefault("Acting", []).append(_to_credit(item, item.get("character")))

    # ---- Crew, bucketed by job ----
    job_to_group = dict(FEATURED_JOBS)
    # A person can be credited several times on one film (e.g. Writer and
    # Producer). Dedupe per group so a title appears once in each section.
    seen_by_group: dict[str, set[int]] = {}
    for item in credits.get("crew", []):
        mid = item.get("id")
        job = item.get("job") or "Crew"
        if mid is None:
            continue
        group = job_to_group.get(job, "Other Work")
        if mid in seen_by_group.setdefault(group, set()):
            continue
        seen_by_group[group].add(mid)
        groups.setdefault(group, []).append(_to_credit(item, job))

    credit_groups = []
    total = 0
    for label in GROUP_ORDER:
        items = groups.get(label)
        if not items:
            continue
        items.sort(key=_sort_key, reverse=True)
        total += len(items)
        credit_groups.append(
            CreditGroup(label=label, credits=items[:limit_per_group])
        )

    return PersonDetail(
        tmdb_id=details.get("id"),
        name=details.get("name") or "Unknown",
        biography=details.get("biography") or None,
        birthday=details.get("birthday"),
        deathday=details.get("deathday"),
        place_of_birth=details.get("place_of_birth"),
        profile_path=details.get("profile_path"),
        known_for_department=details.get("known_for_department"),
        also_known_as=details.get("also_known_as") or [],
        imdb_id=details.get("imdb_id"),
        homepage=details.get("homepage"),
        credit_groups=credit_groups,
        total_credits=total,
    )
