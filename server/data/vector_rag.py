import time
from datetime import datetime, timezone
from config import news_collection
from data.news_scraper import fetch_live_google_news
from logger_config import setup_logger

log = setup_logger("data.vector_rag")

def ingest_live_news(ticker: str):
    """Ingests fetched news into the vector database."""
    news_items = fetch_live_google_news(ticker)
    
    for item in news_items:
        doc_id = f"{ticker}_{int(item['timestamp'])}_{abs(hash(item['title']))}"
        content = f"Headline: {item['title']} | Snippet: {item['snippet']} | Publisher: {item['publisher']}"
        date_str = datetime.fromtimestamp(item['timestamp'], tz=timezone.utc).strftime('%Y-%m-%d')

        news_collection.upsert(
            ids=[doc_id],
            documents=[content],
            metadatas=[{
                "ticker": ticker.upper(),
                "timestamp": int(item['timestamp']),
                "date_str": date_str
            }]
        )

def calculate_days_ago(pub_timestamp: int) -> int:
    """Calculates relative days passed since publication."""
    now = int(time.time())
    return max(0, now - pub_timestamp) // 86400

def format_news_for_llm(documents: list, metadatas: list, is_fallback: bool = False) -> str:
    """Formats retrieved news items with explicit publication dates for Gemini."""
    formatted_snippets = []
    
    for doc, meta in zip(documents, metadatas):
        pub_date = meta.get("date_str", "Unknown Date")
        timestamp = meta.get("timestamp", int(time.time()))
        days_ago = calculate_days_ago(timestamp)
        
        if days_ago == 0:
            age_label = "TODAY"
        elif days_ago == 1:
            age_label = "YESTERDAY"
        else:
            age_label = f"{days_ago} DAYS AGO"

        prefix = "[HISTORICAL ARCHIVE]" if is_fallback else "[RECENT NEWS]"
        formatted_snippets.append(f"{prefix} (Published: {pub_date} | {age_label}):\n\"{doc}\"")
        
    return "\n\n".join(formatted_snippets)

def get_relevant_news(ticker: str, max_days_old: int = 14, n_results: int = 5) -> str:
    """
    Meticulous RAG Query Pipeline:
    1. Injects live data.
    2. Attempts strict query with Unix timestamp filter.
    3. Falls back to historical data if no recent news exists.
    """
    ingest_live_news(ticker)
    
    current_time = int(time.time())
    cutoff_timestamp = current_time - (max_days_old * 86400)
    query_text = f"Market news, earnings, analysis, regulatory events for {ticker}"

    try:
        results = news_collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={
                "$and": [
                    {"ticker": {"$eq": ticker.upper()}},
                    {"timestamp": {"$gte": cutoff_timestamp}}
                ]
            }
        )
        
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]

        if docs:
            log.info(f"Found {len(docs)} recent news items for {ticker} (within {max_days_old} days).")
            return format_news_for_llm(docs, metas, is_fallback=False)

        log.warning(f"No news found within {max_days_old} days for {ticker}. Running historical fallback...")
        fallback_results = news_collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"ticker": {"$eq": ticker.upper()}}
        )
        
        fallback_docs = fallback_results.get("documents", [[]])[0]
        fallback_metas = fallback_results.get("metadatas", [[]])[0]

        if fallback_docs:
            log.info(f"Retrieved {len(fallback_docs)} historical news items for {ticker}.")
            return format_news_for_llm(fallback_docs, fallback_metas, is_fallback=True)

        return f"No news articles or media commentary found in Vector DB for {ticker}."

    except Exception as e:
        log.error(f"Query failed: {e}", exc_info=True)
        return f"Vector Database lookup error for {ticker}."