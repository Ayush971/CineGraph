from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL — accepts a single DATABASE_URL (cloud providers like Render/Neon)
# or falls back to individual DB_* vars (local Docker dev)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{os.getenv('DB_USER', 'cinegraph_user')}:{os.getenv('DB_PASSWORD', 'cinegraph_password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'cinegraph_db')}"
)

# Some providers (Render, Heroku) hand out a "postgres://" URL, which
# SQLAlchemy 2.0 no longer accepts — normalize it to "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine.
#  - pool_pre_ping recycles dead connections dropped by cloud DBs
#  - connect_timeout is essential: without it, an unreachable database makes
#    psycopg2 hang indefinitely instead of raising. At import time that means
#    the app never finishes booting, never binds a port, and every request
#    hangs until the platform times it out — a total outage caused by what
#    should be a recoverable DB blip.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()