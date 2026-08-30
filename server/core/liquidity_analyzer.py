import numpy as np
from sklearn.ensemble import IsolationForest
from collections import deque

WINDOW_SIZE = 1000  # Number of ticks to consider for moving averages and anomaly detection
MIN_SIZE = 50  # Minimum number of ticks required to calculate metrics
CONTAMINATION = 0.01  # Proportion of outliers in the data set for Isolation Forest
RANDOM_STATE = 42  # Random state for reproducibility in Isolation Forest

class LiquidityTracker:
    def __init__(self, window_size=WINDOW_SIZE):
        self.volume_pipe = deque(maxlen=window_size)
        self.spread_pipe = deque(maxlen=window_size)

    def process_tick(self, volume: int, bid_price: float, ask_price: float):
        """Processes a single tick and pushes its metrics into the rolling window."""
        spread = ask_price - bid_price
        self.volume_pipe.append(volume)
        self.spread_pipe.append(spread)

    def calculate_summary(self) -> dict:
        """Calculates moving averages and computes a quantitative Liquidity Score."""
        
        if len(self.volume_pipe) < MIN_SIZE:
            return {
                "liquidity_score": 1.0, 
                "market_regime": f"Warming up ML Model ({len(self.volume_pipe)}/{MIN_SIZE} ticks)",
                "avg_volume": 0.0,
                "avg_spread": 0.0
            }

        avg_volume = sum(self.volume_pipe) / len(self.volume_pipe)
        avg_spread = sum(self.spread_pipe) / len(self.spread_pipe)

        raw_score = (avg_volume / WINDOW_SIZE) * (0.05 / max(avg_spread, 0.01))
        final_score = min(10.0, max(1.0, raw_score))

        X = np.column_stack((self.volume_pipe, self.spread_pipe))

        clf = IsolationForest(contamination=CONTAMINATION, random_state=RANDOM_STATE)
        clf.fit(X)

        latest_tick = X[-1].reshape(1, -1)
        prediction = clf.predict(latest_tick)[0]

        is_anomaly = (prediction == -1)

        if is_anomaly:
            regime = "⚠️ ANOMALY DETECTED (Spoofing/Dark Pool)"
        elif final_score >= 7.0:
            regime = "High Liquidity (Low Slippage Risk)"
        elif final_score >= 4.0:
            regime = "Moderate Liquidity (Normal Market Conditions)"
        else:
            regime = "Low Liquidity (High Slippage Risk)"

        return {
            "liquidity_score": round(final_score, 1),
            "market_regime": regime,
            "avg_volume": round(avg_volume, 1),
            "avg_spread": round(avg_spread, 4)
        }