import pytest
import math
from core.liquidity_analyzer import LiquidityTracker

def test_liquidity_tracker_warmup():
    """Verifies the system returns safe defaults while filling the initial buffer."""
    tracker = LiquidityTracker(window_size=100)
    
    for _ in range(10):
        tracker.process_tick(volume=1000, bid_price=500.00, ask_price=500.01)
        
    summary = tracker.calculate_summary()
    
    assert summary["liquidity_score"] == 1.0
    assert "Warming up ML Model" in summary["market_regime"]
    assert summary["avg_volume"] == 0.0

def test_liquidity_score_normal_conditions():
    """Verifies the logarithmic equation accurately calculates the IEX baseline."""
    tracker = LiquidityTracker(window_size=100)
    
    for _ in range(50):
        tracker.process_tick(volume=3000, bid_price=500.00, ask_price=500.05)
        
    summary = tracker.calculate_summary()
    
    expected_vol_score = math.log10(3000 + 1) # ~3.477
    expected_spread_multiplier = 0.05 / 0.05   # 1.0
    expected_raw_score = expected_vol_score * expected_spread_multiplier * 1.2
    
    assert summary["avg_volume"] == 3000.0
    assert summary["avg_spread"] == pytest.approx(0.05)
    assert summary["liquidity_score"] == pytest.approx(round(expected_raw_score, 1))
    assert "Moderate Liquidity" in summary["market_regime"]

def test_liquidity_score_wide_spread_penalty():
    """Verifies that a wide spread heavily penalizes the final liquidity score."""
    tracker = LiquidityTracker(window_size=100)
    
    for _ in range(50):
        tracker.process_tick(volume=3000, bid_price=500.00, ask_price=500.10)
        
    summary = tracker.calculate_summary()
    
    expected_vol_score = math.log10(3000 + 1) # ~3.477
    expected_spread_multiplier = 0.05 / 0.10   # 0.5
    expected_raw_score = expected_vol_score * expected_spread_multiplier * 1.2
    
    assert summary["avg_spread"] == pytest.approx(0.10)
    assert summary["liquidity_score"] == pytest.approx(round(expected_raw_score, 1))
    assert "Low Liquidity" in summary["market_regime"]

def test_isolation_forest_anomaly_detection():
    """Verifies the Isolation Forest correctly identifies sudden structural breaks."""
    tracker = LiquidityTracker(window_size=1000)
    
    for _ in range(999):
        tracker.process_tick(volume=3000, bid_price=500.00, ask_price=500.05)
        
    tracker.process_tick(volume=500000, bid_price=500.00, ask_price=500.50)
    
    summary = tracker.calculate_summary()
    
    assert "ANOMALY DETECTED" in summary["market_regime"]