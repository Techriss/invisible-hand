import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from core.financial_metrics import get_financial_metrics

@patch("core.financial_metrics.yf.Ticker")
def test_private_company_fallback(mock_ticker):
    """Verifies that missing pricing data correctly flags the entity as private."""
    mock_instance = MagicMock()
    # Simulate an empty Yahoo Finance response for a private entity
    mock_instance.info = {"sector": "Aerospace"} 
    mock_ticker.return_value = mock_instance
    
    metrics = get_financial_metrics("SPACEX")
    
    assert metrics["is_private"] is True
    assert metrics["price_str"] == "N/A (Private / ETF)"
    assert metrics["altman_z_status"] == "N/A"

@patch("core.financial_metrics.yf.Ticker")
def test_graham_and_altman_z_calculations(mock_ticker):
    """Mocks a corporate balance sheet to strictly verify forensic accounting math."""
    mock_instance = MagicMock()
    
    mock_instance.info = {
        "currentPrice": 150.0,
        "marketCap": 1_000_000,
        "profitMargins": 0.25,
        "sector": "Technology",
        "beta": 1.2,
        "trailingEps": 5.0,    # For Graham Number
        "bookValue": 50.0      # For Graham Number
    }
    
    mock_instance.balance_sheet = pd.DataFrame({
        "2026-12-31": {
            "Total Assets": 1_000_000,
            "Current Assets": 500_000,
            "Current Liabilities": 200_000,
            "Retained Earnings": 300_000,
            "Total Liabilities Net Minority Interest": 400_000
        }
    })
    
    mock_instance.financials = pd.DataFrame({
        "2026-12-31": {
            "EBIT": 150_000,
            "Total Revenue": 800_000
        }
    })
    
    mock_ticker.return_value = mock_instance
    
    metrics = get_financial_metrics("MOCK_CORP")
    
    assert metrics["is_private"] is False
    assert metrics["price_str"] == "$150.00"
    assert metrics["sector"] == "Technology"
    
    # Formula: sqrt(22.5 * EPS * BVPS) -> sqrt(22.5 * 5.0 * 50.0) -> sqrt(5625)
    assert metrics["graham_number"] == 75.0
    
    # Margin of Safety: (75.0 - 150.0) / 75.0 = -1.0 (-100% margin / severely overvalued)
    assert metrics["margin_of_safety"] == -1.0
    
    # Working Capital (X1) = (500k - 200k) / 1M = 0.3
    # Retained Earnings (X2) = 300k / 1M = 0.3
    # EBIT (X3) = 150k / 1M = 0.15
    # Market Cap vs Liab (X4) = 1M / 400k = 2.5
    # Sales to Assets (X5) = 800k / 1M = 0.8
    # Z = (1.2 * 0.3) + (1.4 * 0.3) + (3.3 * 0.15) + (0.6 * 2.5) + (1.0 * 0.8)
    # Z = 0.36 + 0.42 + 0.495 + 1.5 + 0.8 = 3.575
    
    assert metrics["altman_z_score"] == pytest.approx(3.575)
    assert metrics["altman_z_status"] == "SAFE" # Since 3.575 is >= 3.0