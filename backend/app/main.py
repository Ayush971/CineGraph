from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the backend directory to sys.path to allow imports from "app"
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.database import engine, Base
from app.routes import auth, movies, diary, lists, comments, social, likes, achievements, analytics, recommendations
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables.
# Deliberately non-fatal: if the database is briefly unreachable at boot (a
# cloud DB still waking, a transient network blip), we must NOT crash the
# process — that turns a temporary DB problem into a crash-loop where the
# whole API is unreachable and /health can't even report why.
try:
    Base.metadata.create_all(bind=engine)
    DB_INIT_ERROR = None
except Exception as exc:  # pragma: no cover - startup path
    DB_INIT_ERROR = str(exc)
    print(f"[startup] WARNING: could not initialize database tables: {exc}")

# Initialize FastAPI
app = FastAPI(
    title="CineGraph API",
    description="Movie tracking and social platform API",
    version="1.0.0",
)

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *cors_origins,
    ],
    # Dev convenience: allow any localhost port (preview servers, alt dev ports)
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(diary.router)
app.include_router(lists.router)
app.include_router(comments.router)
app.include_router(social.router)
app.include_router(likes.router)
app.include_router(achievements.router)
app.include_router(analytics.router)
app.include_router(recommendations.router)


# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to CineGraph API 🎬",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "movies": "/movies",
            "diary": "/diary",
            "lists": "/lists",
            "comments": "/comments",
            "social": "/social",
            "likes": "/likes",
            "achievements": "/achievements",
            "analytics": "/analytics",
            "recommendations": "/recommendations",
        },
    }


# Health check — actually probes the database and cache rather than assuming.
@app.get("/health")
def health_check():
    from sqlalchemy import text
    from app.config.redis import get_redis

    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"error: {exc}"

    # Redis is optional — the app degrades gracefully without it.
    redis_status = "connected" if get_redis() else "unavailable"

    healthy = db_status == "connected"
    return {
        "status": "OK" if healthy else "DEGRADED",
        "database": db_status,
        "redis": redis_status,
        "startup_db_error": DB_INIT_ERROR,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
