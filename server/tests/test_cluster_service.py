import pytest
from unittest.mock import patch
from core.cluster_service import HiddenSectorEngine

@pytest.fixture
def mock_engine():
    """Initializes a populated HiddenSectorEngine instance without network or Redis dependencies."""
    engine = HiddenSectorEngine()
    
    engine.cluster_summaries = [
        {
            "cluster_id": 0,
            "theme_name": "Hyperscaler Cloud",
            "description": "High capex co-movement.",
            "constituent_count": 8,
            "average_momentum": 0.15,
            "top_tickers": ["MSFT", "AMZN", "GOOG", "ORCL", "CRM", "IBM", "NOW", "SNOW"]
        }
    ]
    
    engine.ticker_to_cluster = {
        "MSFT": 0, "AMZN": 0, "GOOG": 0, "ORCL": 0, 
        "CRM": 0, "IBM": 0, "NOW": 0, "SNOW": 0
    }
    
    engine.ticker_returns = {
        "MSFT": 0.10,  # Target baseline
        "AMZN": 0.25,  # Spread: +0.15 (Outperformer)
        "GOOG": 0.18,  # Spread: +0.08 (Outperformer)
        "ORCL": 0.12,  # Spread: +0.02 (Outperformer)
        "CRM": 0.09,   # Spread: -0.01 (Laggard)
        "IBM": 0.05,   # Spread: -0.05 (Laggard)
        "NOW": 0.02,   # Spread: -0.08 (Laggard)
        "SNOW": -0.05  # Spread: -0.15 (Laggard)
    }
    
    engine.ticker_to_name = {
        "MSFT": "Microsoft", "AMZN": "Amazon", "GOOG": "Alphabet",
        "ORCL": "Oracle", "CRM": "Salesforce", "IBM": "IBM Corp",
        "NOW": "ServiceNow", "SNOW": "Snowflake"
    }
    
    engine.is_warmed_up = True
    return engine

def test_relative_value_unknown_ticker(mock_engine):
    """Verifies that unindexed tickers fall back cleanly without breaking."""
    result = mock_engine.get_relative_value("UNKNOWN_TICKER")
    
    assert result["cluster_id"] == -1
    assert result["theme_name"] == "Unknown"
    assert result["cluster_average_return"] == 0.0
    assert result["outperformers"] == []
    assert result["laggards"] == []

def test_relative_value_spread_calculation(mock_engine):
    """Verifies peer performance spread math and top-5 slicing."""
    result = mock_engine.get_relative_value("MSFT")
    
    assert result["target_ticker"] == "MSFT"
    assert result["target_name"] == "Microsoft"
    assert result["cluster_id"] == 0
    assert result["theme_name"] == "Hyperscaler Cloud"
    assert result["cluster_average_return"] == 0.15
    
    assert len(result["outperformers"]) == 3
    assert result["outperformers"][0]["ticker"] == "AMZN"
    assert result["outperformers"][0]["performance_spread"] == pytest.approx(0.15)
    assert result["outperformers"][1]["ticker"] == "GOOG"
    assert result["outperformers"][1]["performance_spread"] == pytest.approx(0.08)
    
    assert len(result["laggards"]) == 4
    assert result["laggards"][0]["ticker"] == "SNOW"
    assert result["laggards"][0]["performance_spread"] == pytest.approx(-0.15)

@patch("core.cluster_service.get_cached_clusters")
def test_warmup_engine_cache_hit(mock_get_cache):
    """Verifies that engine startup bypasses S&P 500 download when Redis has cached clusters."""
    mock_payload = {
        "cluster_summaries": [{"cluster_id": 1, "theme_name": "Semiconductors"}],
        "ticker_to_cluster": {"NVDA": 1},
        "ticker_returns": {"NVDA": 0.45},
        "ticker_dollar_vol": {"NVDA": 50000000.0},
        "ticker_to_name": {"NVDA": "NVIDIA"}
    }
    mock_get_cache.return_value = mock_payload
    
    fresh_engine = HiddenSectorEngine()
    fresh_engine.warmup_engine()
    
    assert fresh_engine.is_warmed_up is True
    assert fresh_engine.cluster_summaries == mock_payload["cluster_summaries"]
    assert fresh_engine.ticker_to_cluster == {"NVDA": 1}
    assert fresh_engine.ticker_returns == {"NVDA": 0.45}