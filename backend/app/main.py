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

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(
    title="CineGraph API",
    description="Movie tracking and social platform API",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
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


# Health check
@app.get("/health")
def health_check():
    return {"status": "OK", "database": "Connected"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
