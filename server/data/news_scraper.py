import time
from datetime import datetime, timezone
from gnews import GNews

def fetch_live_google_news(ticker: str) -> list[dict]:
    """Scrapes Google News and returns structured, database-agnostic news items."""
    print(f"  -> [GNEWS] Scraping live Google News for {ticker}...")
    results = []
    
    try:
        google_news = GNews(period='14d', max_results=20)
        news_items = google_news.get_news(f"{ticker} stock")
        
        for item in news_items:
            title = item.get('title', '')
            publisher = item.get('publisher', {}).get('title', 'Unknown Publisher')
            pub_date_str = item.get('published date', '')
            snippet = item.get('description', '') 
            
            try:
                pub_date_obj = datetime.strptime(pub_date_str, '%a, %d %b %Y %H:%M:%S %Z')
                pub_timestamp = pub_date_obj.replace(tzinfo=timezone.utc).timestamp()
            except ValueError:
                pub_timestamp = time.time()
                
            results.append({
                "title": title,
                "snippet": snippet,
                "publisher": publisher,
                "timestamp": pub_timestamp
            })
    except Exception as e:
        print(f"  -> [GNEWS ERROR] Failed to fetch live news: {e}")
        
    return results