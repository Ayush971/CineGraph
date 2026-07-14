"""
Redis client wrapper with graceful fallback.

If Redis is unavailable, get_redis() returns None and callers should simply
skip caching — the app must keep working without it.
"""
import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

_client = None
_checked = False


def get_redis():
    """Return a live Redis client, or None if Redis can't be reached."""
    global _client, _checked

    if _client is not None:
        return _client

    if _checked:
        # We already failed to connect once this run; don't keep retrying.
        return None

    _checked = True
    try:
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        client.ping()
        _client = client
        return _client
    except Exception:
        return None
