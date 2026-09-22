import pytest
from unittest.mock import patch
from core.ai_engine import generate_deep_analysis

@patch("core.ai_engine.client.models.generate_content")
@patch("core.ai_engine.fetch_recent_sec_filings")
@patch("core.ai_engine.get_relevant_news")
@patch("core.ai_engine.get_financial_metrics")
def test_deep_analysis_api_timeout_fallback(mock_metrics, mock_news, mock_sec, mock_gemini):
    """Verifies that an AI API error gracefully returns structured fallback data."""
    mock_gemini.side_effect = TimeoutError("Gemini 3.5 API request timed out")
    
    mock_sec.return_value = "SEC filings"
    mock_news.return_value = "News context"
    mock_metrics.return_value = {
        "is_private": False,
        "price_str": "$150.00",
        "market_cap_str": "$2.00T",
        "profit_margin_str": "25.00%",
        "sector": "Technology",
        "beta": "1.1",
        "graham_number": 80.0,
        "margin_of_safety": -0.875,
        "altman_z_score": 3.5,
        "altman_z_status": "SAFE"
    }
    
    report = generate_deep_analysis("AAPL")
    
    assert "temporarily unavailable" in report["bull_case"]
    assert "temporarily unavailable" in report["bear_case"]
    assert len(report["risk_factors"]) == 1
    assert report["risk_factors"][0]["description"] == "API Timeout Error"
    assert report["risk_factors"][0]["severity_score"] == 5.0
    assert report["graham_number"] == 80.0
    assert report["altman_z_status"] == "SAFE"