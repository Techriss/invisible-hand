from logger_config import setup_logger
from transformers import pipeline
from config import news_collection

log = setup_logger("core.sentiment_analyzer")
N_NEWS = 20

class SentimentEngine:
    def __init__(self):
        log.info("Loading FinBERT Neural Network into memory...")
        self.analyzer = pipeline("sentiment-analysis", model="ProsusAI/finbert")
        log.info("FinBERT successfully loaded and ready.")

    def _calculate_hype_index(self, headlines: list[str]) -> float:
        """Processes text headlines into a sentiment score (-1.0 to 1.0)."""
        if not headlines:
            return 0.0

        results = self.analyzer(headlines)
        total_score = 0.0

        for result in results:
            if result['label'] == 'positive':
                total_score += result['score']
            elif result['label'] == 'negative':
                total_score -= result['score']

        return round(total_score / len(headlines), 3)

    def get_ticker_hype(self, ticker: str) -> float:
        """Queries the vector DB for recent news and scores it via FinBERT."""
        log.info(f"Calculating Neural Sentiment Hype Index for {ticker}...")
        try:
            db_results = news_collection.query(
                query_texts=[f"Market news for {ticker}"],
                n_results=N_NEWS,
                where={"ticker": {"$eq": ticker.upper()}}
            )
            raw_snippets = db_results.get("documents", [[]])[0]
            return self._calculate_hype_index(raw_snippets)
        except Exception as e:
            log.error(f"Failed to calculate hype for {ticker}: {e}")
            return 0.0

finbert_engine = SentimentEngine()