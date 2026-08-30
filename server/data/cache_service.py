import json
import redis
from config import cache

def get_cached_report(ticker: str):
    """Tries to fetch and parse a cached report from Redis."""
    try:
        cached_data = cache.get(f"report:{ticker}")
        if cached_data:
            return json.loads(cached_data)
    except redis.exceptions.RedisError as e:
        print(f"  -> [CACHE WARNING] Redis unavailable (Read Timeout): {e}")
    return None

def set_cached_report(ticker: str, data: dict, ttl_seconds: int = 3600):
    """Saves a report payload into Redis with a 1-hour expiration."""
    try:
        cache.set(f"report:{ticker}", json.dumps(data), ex=ttl_seconds)
    except redis.exceptions.RedisError as e:
        print(f"  -> [CACHE WARNING] Redis unavailable (Write Timeout): {e}")

def get_cached_macro():
    """Tries to fetch the global macro overview from Redis."""
    try:
        cached_data = cache.get("macro_overview")
        if cached_data:
            return json.loads(cached_data)
    except redis.exceptions.RedisError:
        pass
    return None

def set_cached_macro(data: dict, ttl_seconds: int = 3600):
    """Saves the macro payload into Redis with a 1-hour expiration."""
    try:
        cache.set("macro_overview", json.dumps(data), ex=ttl_seconds)
    except redis.exceptions.RedisError:
        pass

def get_cached_clusters():
    """Tries to fetch the trained K-Means state from Redis."""
    try:
        cached_data = cache.get("ml_clusters")
        if cached_data:
            return json.loads(cached_data)
    except redis.exceptions.RedisError:
        pass
    return None

def set_cached_clusters(data: dict, ttl_seconds: int = 86400):
    """Saves the cluster engine state into Redis with a 24-hour expiration."""
    try:
        cache.set("ml_clusters", json.dumps(data), ex=ttl_seconds)
    except redis.exceptions.RedisError:
        pass