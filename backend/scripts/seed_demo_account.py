"""
Seed a demo CineGraph account with a realistic diary and a few lists.

Talks to the HTTP API rather than the database directly, which means:
  * it works against any deployment (local or Render) with no DB credentials
  * movies get cached through the normal /movies/{id} path
  * achievements are awarded by the real engine as entries are created

Usage
-----
    # against a local backend (default)
    python scripts/seed_demo_account.py

    # against production
    python scripts/seed_demo_account.py --api https://cinegraph-api-48a2.onrender.com

Re-running is safe: it logs in if the account already exists, skips diary
entries for films already logged, and skips lists that already exist.
"""

import argparse
import sys
import time
from datetime import date

import requests

# --- Demo account -----------------------------------------------------------
DEMO = {
    "username": "cinephile",
    "email": "demo@cinegraph.app",
    "password": "CineGraphDemo2026!",
}

# --- Diary: (title, year, watched_date, rating out of 10, is_rewatch, review)
# Letterboxd stars doubled: 4 stars -> 8.0, 4.5 -> 9.0, 5 -> 10.0
DIARY = [
    ("Drishyam 2", 2022, date(2026, 9, 18), 8.0, True, None),
    ("Backrooms", 2026, date(2026, 8, 9), 6.0, False, None),
    ("Pretty Woman", 1990, date(2026, 8, 7), 8.0, False, None),
    ("Supergirl", 2026, date(2026, 8, 6), 6.0, False, None),
    ("The Mandalorian and Grogu", 2026, date(2026, 8, 5), 7.0, False, None),
    ("Spider-Man: Brand New Day", 2026, date(2026, 7, 30), 9.0, False, None),
    ("The Odyssey", 2026, date(2026, 7, 28), 10.0, False,
     "Nolan doing Homer. Saw it twice in a week and still thinking about it."),
    ("Toy Story", 1995, date(2026, 7, 10), 8.0, True, None),
    ("Obsession", 2025, date(2026, 7, 9), 8.0, False, None),
    ("The Hangover Part II", 2011, date(2026, 6, 1), 6.0, False, None),
    ("Rain Man", 1988, date(2026, 5, 25), 9.0, False,
     "Hoffman is extraordinary, but it's Cruise's film really - he's the one "
     "who has to change. That last scene at the station wrecked me."),
    ("The Hangover", 2009, date(2026, 5, 24), 9.0, True, None),
    ("Baby Driver", 2017, date(2026, 5, 23), 8.0, False, None),
    ("Love, Rosie", 2014, date(2026, 5, 16), 8.0, False, None),
    ("Little Miss Sunshine", 2006, date(2026, 5, 3), 8.0, False, None),
]

# --- Lists: title, description, public, [(film, year), ...] in rank order ----
LISTS = [
    (
        "MCU : Ranked",
        "My Rankings 🤔",
        True,
        [
            ("Avengers: Infinity War", 2018),
            ("Avengers: Endgame", 2019),
            ("Captain America: The Winter Soldier", 2014),
            ("Guardians of the Galaxy", 2014),
            ("Spider-Man: No Way Home", 2021),
            ("Iron Man", 2008),
            ("Thor: Ragnarok", 2017),
            ("Black Panther", 2018),
            ("Captain America: Civil War", 2016),
            ("The Avengers", 2012),
            ("Doctor Strange", 2016),
            ("Guardians of the Galaxy Vol. 3", 2023),
            ("Spider-Man: Homecoming", 2017),
            ("Ant-Man", 2015),
            ("Thor", 2011),
        ],
    ),
    (
        "Masterpiece",
        "Films that are just 'WOW'",
        True,
        [
            ("Dune: Part Two", 2024),
            ("Interstellar", 2014),
            ("Dune", 2021),
            ("Oppenheimer", 2023),
            ("The Dark Knight", 2008),
            ("Parasite", 2019),
            ("Inception", 2010),
            ("Whiplash", 2014),
            ("The Prestige", 2006),
            ("Spider-Man: Across the Spider-Verse", 2023),
            ("Blade Runner 2049", 2017),
            ("The Social Network", 2010),
        ],
    ),
    (
        "My Favorite Movies",
        "I can't rank them. They are just incredibly exciting to watch. "
        "U may think some of the movies are just shit but those were the "
        "movies I grew up watching to.",
        True,
        [
            ("The Karate Kid", 2010),
            ("Ford v Ferrari", 2019),
            ("Spider-Man: Across the Spider-Verse", 2023),
            ("Avengers: Endgame", 2019),
            ("Spider-Man: No Way Home", 2021),
            ("3 Idiots", 2009),
            ("Top Gun: Maverick", 2022),
            ("Baby Driver", 2017),
            ("Catch Me If You Can", 2002),
        ],
    ),
    (
        "Horror",
        None,
        True,
        [
            ("Hereditary", 2018),
            ("Annabelle: Creation", 2017),
            ("Annabelle Comes Home", 2019),
            ("Annabelle", 2014),
            ("The Conjuring", 2013),
            ("The Conjuring 2", 2016),
            ("Sinister", 2012),
            ("It", 2017),
            ("A Quiet Place", 2018),
            ("Get Out", 2017),
        ],
    ),
    (
        "Star Wars Ranked",
        None,
        True,
        [
            ("Star Wars: Episode III - Revenge of the Sith", 2005),
            ("The Empire Strikes Back", 1980),
            ("Rogue One: A Star Wars Story", 2016),
            ("Star Wars", 1977),
            ("Star Wars: Episode II - Attack of the Clones", 2002),
            ("Return of the Jedi", 1983),
            ("Star Wars: Episode I - The Phantom Menace", 1999),
            ("The Force Awakens", 2015),
        ],
    ),
]


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip("/")
        self.s = requests.Session()
        self.token = None

    def _h(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    def get(self, path, **kw):
        return self.s.get(self.base + path, headers=self._h(), timeout=60, **kw)

    def post(self, path, json=None):
        return self.s.post(self.base + path, json=json, headers=self._h(), timeout=60)


def log(msg, indent=0):
    """
    Print safely on a Windows console.

    The default Windows code page is cp1252, which cannot encode characters
    that appear in film titles and emoji. Without this guard the script dies
    mid-seed on a UnicodeEncodeError.
    """
    line = ("  " * indent) + msg
    enc = sys.stdout.encoding or "utf-8"
    try:
        print(line, flush=True)
    except UnicodeEncodeError:
        print(line.encode(enc, "replace").decode(enc), flush=True)


def find_movie(api: Api, title: str, year: int):
    """Resolve a title+year to a TMDB id via search, preferring an exact match."""
    r = api.get("/movies/search", params={"query": title, "page": 1})
    if r.status_code != 200:
        return None
    results = r.json().get("results", [])
    if not results:
        return None

    def score(item):
        t = (item.get("title") or "").lower()
        rd = item.get("release_date") or ""
        y = int(rd[:4]) if rd[:4].isdigit() else 0
        s = 0
        if t == title.lower():
            s += 10
        elif title.lower() in t or t in title.lower():
            s += 4
        if y == year:
            s += 8
        elif abs(y - year) <= 1:
            s += 3
        s += min(item.get("popularity", 0) / 500, 1)
        return s

    best = max(results, key=score)
    rd = best.get("release_date") or ""
    got_year = rd[:4] if rd else "?"
    return best["id"], best.get("title"), got_year


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://127.0.0.1:8000",
                    help="Base URL of the CineGraph API")
    args = ap.parse_args()
    api = Api(args.api)

    log(f"Target: {api.base}")
    try:
        h = api.get("/health")
        log(f"Health: {h.status_code} {h.json().get('database', '')}", 1)
    except Exception as e:
        sys.exit(f"Cannot reach the API: {e}")

    # ---- account ----
    log("\n[1/3] Account")
    r = api.post("/auth/register", DEMO)
    if r.status_code == 201:
        log(f"Registered '{DEMO['username']}'", 1)
    else:
        r = api.post("/auth/login",
                     {"email": DEMO["email"], "password": DEMO["password"]})
        if r.status_code != 200:
            sys.exit(f"Could not register or log in: {r.status_code} {r.text[:200]}")
        log(f"Account already existed — logged in as '{DEMO['username']}'", 1)
    api.token = r.json()["access_token"]

    # films already logged, so re-runs don't duplicate
    existing = api.get("/diary/entries", params={"limit": 100})
    logged = {e["movie"]["tmdb_id"] for e in existing.json()} if existing.status_code == 200 else set()

    # ---- diary ----
    log("\n[2/3] Diary")
    added = skipped = failed = 0
    for title, year, watched, rating, rewatch, review in DIARY:
        found = find_movie(api, title, year)
        if not found:
            log(f"[not found] {title} ({year})", 1); failed += 1; continue
        tmdb_id, real_title, real_year = found

        if tmdb_id in logged:
            log(f"[skip] {real_title} — already logged", 1); skipped += 1; continue

        # Caching the movie is required: POST /diary/entries 404s unless the
        # film already exists locally.
        api.get(f"/movies/{tmdb_id}")

        r = api.post("/diary/entries", {
            "movie_id": tmdb_id,
            "watched_date": watched.isoformat(),
            "rating": rating,
            "review": review,
            "is_rewatch": rewatch,
        })
        if r.status_code == 201:
            flag = " (rewatch)" if rewatch else ""
            log(f"[ok]   {real_title} ({real_year})  {rating}/10  {watched}{flag}", 1)
            added += 1
        else:
            log(f"[fail] {real_title}: {r.status_code} {r.text[:120]}", 1); failed += 1
        time.sleep(0.15)

    # ---- lists ----
    log("\n[3/3] Lists")
    mine = api.get("/lists/")
    have = {l["title"] for l in mine.json()} if mine.status_code == 200 else set()

    for title, desc, public, films in LISTS:
        if title in have:
            log(f"[skip] {title} — already exists", 1); continue
        r = api.post("/lists/", {"title": title, "description": desc,
                                 "is_public": public})
        if r.status_code != 201:
            log(f"[fail] {title}: {r.status_code}", 1); continue
        list_id = r.json()["id"]

        count = 0
        for rank, (ftitle, fyear) in enumerate(films, start=1):
            found = find_movie(api, ftitle, fyear)
            if not found:
                continue
            # Lists auto-cache from TMDB, so no /movies/{id} call needed here.
            ar = api.post(f"/lists/{list_id}/items",
                          {"movie_id": found[0], "rank": rank})
            if ar.status_code == 201:
                count += 1
            time.sleep(0.1)
        log(f"[ok]   {title} — {count} films", 1)

    # ---- summary ----
    stats = api.get("/diary/stats")
    ach = api.get("/achievements/my")
    log("\n" + "=" * 52)
    log(f"Diary: {added} added, {skipped} skipped, {failed} failed")
    if stats.status_code == 200:
        s = stats.json()
        log(f"Films: {s['total_movies']}  Entries: {s['total_entries']}  "
            f"Avg: {s['average_rating']}  Rewatches: {s['total_rewatches']}")
    if ach.status_code == 200:
        names = [a["achievement"]["title"] for a in ach.json()]
        log(f"Achievements earned: {len(names)} — {', '.join(names[:6])}"
            + ("..." if len(names) > 6 else ""))
    log("=" * 52)
    log(f"\nLog in at your site with:")
    log(f"  email:    {DEMO['email']}", 1)
    log(f"  password: {DEMO['password']}", 1)


if __name__ == "__main__":
    main()
