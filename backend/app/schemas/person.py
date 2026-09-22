from pydantic import BaseModel
from typing import Optional, List


class PersonCredit(BaseModel):
    """One film a person worked on."""

    tmdb_id: int
    title: str
    poster_path: Optional[str] = None
    release_date: Optional[str] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    # What they did on it: a character name for cast, a job title for crew.
    role: Optional[str] = None


class CreditGroup(BaseModel):
    """A titled section of the filmography, e.g. 'Acting' or 'Directing'."""

    label: str
    credits: List[PersonCredit]


class PersonDetail(BaseModel):
    tmdb_id: int
    name: str
    biography: Optional[str] = None
    birthday: Optional[str] = None
    deathday: Optional[str] = None
    place_of_birth: Optional[str] = None
    profile_path: Optional[str] = None
    known_for_department: Optional[str] = None
    also_known_as: List[str] = []
    imdb_id: Optional[str] = None
    homepage: Optional[str] = None

    # Filmography, split into sections. Acting first, then Directing /
    # Producing / Writing, then everything else.
    credit_groups: List[CreditGroup] = []
    total_credits: int = 0
