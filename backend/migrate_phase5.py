"""
Database migration script for Phase 5.
Adds new columns to the movies table and creates new achievement tables.
Run this once, then delete or ignore it.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config.database import engine, Base
# Import all models to register them
from app.models import *

def run_migration():
    from sqlalchemy import text

    with engine.connect() as conn:
        # Add new columns to movies table
        columns_to_add = [
            ("genres_json", "TEXT"),
            ("cast_json", "TEXT"),
            ("directors_json", "TEXT"),
        ]

        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE movies ADD COLUMN {col_name} {col_type}"))
                print(f"  Added column: movies.{col_name}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  Column movies.{col_name} already exists, skipping")
                else:
                    print(f"  Error adding movies.{col_name}: {e}")
                conn.rollback()
                continue

        conn.commit()
        print("Movies table updated!")

    # Create new tables (achievements, user_achievements)
    Base.metadata.create_all(bind=engine)
    print("New tables created (achievements, user_achievements)!")
    print("Migration complete!")


if __name__ == "__main__":
    print("Running Phase 5 migration...")
    run_migration()
