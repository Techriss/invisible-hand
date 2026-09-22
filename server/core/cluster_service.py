import numpy as np

from data.market_data import fetch_sp500_universe, fetch_batch_history
from core.quant_math import optimize_and_cluster
from core.ai_engine import generate_batch_cluster_labels
from data.cache_service import get_cached_clusters, set_cached_clusters
from logger_config import setup_logger

log = setup_logger("core.cluster_service")

class HiddenSectorEngine:
    def __init__(self):
        self.cluster_summaries = []
        self.ticker_to_cluster = {}
        self.ticker_returns = {}
        self.ticker_dollar_vol = {}
        self.ticker_to_name = {}
        self.is_warmed_up = False

    def warmup_engine(self):
        if self.is_warmed_up: return

        cached_data = get_cached_clusters()
        if cached_data:
            log.info("Redis cache hit for S&P 500 clusters; loading cached cluster data")
            self.cluster_summaries = cached_data["cluster_summaries"]
            self.ticker_to_cluster = cached_data["ticker_to_cluster"]
            self.ticker_returns = cached_data["ticker_returns"]
            self.ticker_dollar_vol = cached_data["ticker_dollar_vol"]
            self.ticker_to_name = cached_data["ticker_to_name"]
            self.is_warmed_up = True
            return

        self.ticker_to_name = fetch_sp500_universe()
        tickers = list(self.ticker_to_name.keys())
        close_data, volume_data = fetch_batch_history(tickers)

        returns = close_data.pct_change().dropna()
        lookback_idx = min(90, len(close_data) - 1)
        momentum_90d = (close_data.iloc[-1] - close_data.iloc[-lookback_idx]) / close_data.iloc[-lookback_idx]
        momentum_90d = momentum_90d.replace([np.inf, -np.inf], np.nan).fillna(0.0)
        
        self.ticker_returns = {str(k): float(v) for k, v in momentum_90d.to_dict().items()}
        dollar_vol = (close_data.iloc[-30:] * volume_data.iloc[-30:]).mean()
        self.ticker_dollar_vol = {str(k): float(v) for k, v in dollar_vol.to_dict().items()}

        best_k, self.ticker_to_cluster = optimize_and_cluster(returns)

        clusters_to_name = []
        cluster_temp_data = {}
        
        for i in range(best_k):
            cluster_tickers = [t for t, c in self.ticker_to_cluster.items() if c == i]
            cluster_tickers.sort(key=lambda t: self.ticker_dollar_vol.get(t, 0.0), reverse=True)
            
            top_company_names = [f"{t} ({self.ticker_to_name.get(t, t)})" for t in cluster_tickers[:8]]
            clusters_to_name.append({
                "cluster_id": i,
                "top_anchors": top_company_names
            })
            
            momentums = [self.ticker_returns.get(t, 0.0) for t in cluster_tickers if not np.isnan(self.ticker_returns.get(t, 0.0))]
            avg_mom = float(np.mean(momentums)) if momentums else 0.0
            
            cluster_temp_data[i] = {
                "constituent_count": len(cluster_tickers),
                "average_momentum": avg_mom,
                "top_tickers": [f"{t} ({self.ticker_to_name.get(t, t)})" for t in cluster_tickers[:15]]
            }

        ai_labels = generate_batch_cluster_labels(clusters_to_name)

        self.cluster_summaries = []
        for i in range(best_k):
            temp = cluster_temp_data[i]
            label = ai_labels.get(i, {"theme_name": f"Regime {i}", "description": "Systematic factor basket."})
            
            self.cluster_summaries.append({
                "cluster_id": i,
                "theme_name": label["theme_name"],
                "description": label["description"],
                "constituent_count": temp["constituent_count"],
                "average_momentum": round(temp["average_momentum"], 4),
                "top_tickers": temp["top_tickers"]
            })
            
        self.cluster_summaries.sort(key=lambda c: c["constituent_count"], reverse=True)

        cache_payload = {
            "cluster_summaries": self.cluster_summaries,
            "ticker_to_cluster": self.ticker_to_cluster,
            "ticker_returns": self.ticker_returns,
            "ticker_dollar_vol": self.ticker_dollar_vol,
            "ticker_to_name": self.ticker_to_name
        }
        set_cached_clusters(cache_payload)
        
        self.is_warmed_up = True
        log.info("Factor Engine Warmed Up and saved to Redis.")

    def get_relative_value(self, ticker: str) -> dict:
        """Calculates mathematical peer divergence for a specific ticker."""
        if ticker not in self.ticker_to_cluster:
            return {
                "target_ticker": ticker, "target_name": ticker, "cluster_id": -1,
                "theme_name": "Unknown", "cluster_average_return": 0.0,
                "outperformers": [], "laggards": []
            }
            
        cluster_id = self.ticker_to_cluster[ticker]
        target_momentum = self.ticker_returns.get(ticker, 0.0)
        target_name = self.ticker_to_name.get(ticker, ticker)
        
        summary = next((s for s in self.cluster_summaries if s["cluster_id"] == cluster_id), None)
        theme_name = summary["theme_name"] if summary else "Unknown"
        cluster_avg_return = summary["average_momentum"] if summary else 0.0
        
        peers = [t for t, c in self.ticker_to_cluster.items() if c == cluster_id and t != ticker]
        peer_list = []
        for p in peers:
            spread = self.ticker_returns.get(p, 0.0) - target_momentum 
            peer_list.append({
                "ticker": p, "company_name": self.ticker_to_name.get(p, p), "performance_spread": spread
            })
            
        peer_list.sort(key=lambda x: x["performance_spread"], reverse=True)
        
        return {
            "target_ticker": ticker,
            "target_name": target_name,
            "cluster_id": cluster_id,
            "theme_name": theme_name,
            "cluster_average_return": cluster_avg_return,
            "outperformers": [p for p in peer_list if p["performance_spread"] > 0][:5],
            "laggards": list(reversed([p for p in peer_list if p["performance_spread"] < 0][-5:]))
        }

cluster_engine = HiddenSectorEngine()