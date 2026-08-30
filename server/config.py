import os
import redis
import chromadb

REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

cache = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=0, 
    decode_responses=True, 
    socket_timeout=1
)

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, "market_db")

vector_db = chromadb.PersistentClient(path=DB_PATH)
news_collection = vector_db.get_or_create_collection(name="financial_news")