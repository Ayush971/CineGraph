import os
import math
import requests
from PIL import Image

TMDB_API_KEY = "de98dcde1f4a3873a3346aed6d04e89b"

TOP_50_TV_SHOWS = [
    "How to Get Away with Murder"
]

SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

POSTER_DIR = "TV shows"
OUTPUT_FILE = "tv_show_collage.jpg"

POSTER_WIDTH = 300
POSTER_HEIGHT = 450
COLUMNS = 10

os.makedirs(POSTER_DIR, exist_ok=True)

def fetch_and_save_poster(title):
    params = {
        "api_key": TMDB_API_KEY,
        "query": title
    }
    res = requests.get(SEARCH_URL, params=params).json()
    if res["results"]:
        poster_path = res["results"][0].get("poster_path")
        if poster_path:
            url = IMAGE_BASE + poster_path
            img_data = requests.get(url).content
            filename = title.replace(":", "").replace(" ", "_") + ".jpg"
            with open(os.path.join(POSTER_DIR, filename), "wb") as f:
                f.write(img_data)
            return True
    return False

def create_collage():
    posters = [
        os.path.join(POSTER_DIR, f)
        for f in os.listdir(POSTER_DIR)
        if f.endswith(".jpg")
    ]

    rows = math.ceil(len(posters) / COLUMNS)
    collage = Image.new(
        "RGB",
        (COLUMNS * POSTER_WIDTH, rows * POSTER_HEIGHT),
        color=(0, 0, 0)
    )

    for idx, poster in enumerate(posters):
        img = Image.open(poster).resize((POSTER_WIDTH, POSTER_HEIGHT))
        x = (idx % COLUMNS) * POSTER_WIDTH
        y = (idx // COLUMNS) * POSTER_HEIGHT
        collage.paste(img, (x, y))

    collage.save(OUTPUT_FILE)

# -------- Run --------
for tv_show in TOP_50_TV_SHOWS:
    success = fetch_and_save_poster(tv_show)
    print("Fetched" if success else "Skipped", tv_show)

create_collage()
print("Collage created:", OUTPUT_FILE)
