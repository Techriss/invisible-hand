import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from data.market_data import fetch_sp500_universe, fetch_batch_history

@patch("data.market_data.requests.get")
def test_fetch_sp500_universe_success(mock_get):
    """Verifies CSV parsing and ticker symbol sanitization."""
    mock_csv = "Symbol,Security,GICS Sector\nAAPL,Apple Inc.,Information Technology\nBRK.B,Berkshire Hathaway,Financials\n"
    mock_res = MagicMock()
    mock_res.text = mock_csv
    mock_get.return_value = mock_res

    universe = fetch_sp500_universe()

    assert "AAPL" in universe
    assert universe["AAPL"] == "Apple Inc."
    assert "BRK-B" in universe
    assert universe["BRK-B"] == "Berkshire Hathaway"

@patch("data.market_data.requests.get")
def test_fetch_sp500_universe_fallback(mock_get):
    """Verifies hardcoded default dictionary returned on HTTP error."""
    mock_get.side_effect = Exception("GitHub 404/Timeout")

    universe = fetch_sp500_universe()
    assert universe == {"AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA", "JPM": "JPMorgan"}

@patch("data.market_data.yf.download")
def test_fetch_batch_history_cleans_nan_data(mock_download):
    """Verifies forward-fill and back-fill logic on batch Close and Volume matrices."""
    dates = pd.date_range("2026-01-01", periods=5)
    
    close_raw = pd.DataFrame({
        "AAPL": [150.0, None, 152.0, 153.0, 155.0],
        "MSFT": [300.0, 302.0, None, 305.0, 306.0]
    }, index=dates)

    volume_raw = pd.DataFrame({
        "AAPL": [1000, 1100, 1200, None, 1400],
        "MSFT": [2000, None, 2200, 2300, 2400]
    }, index=dates)

    mock_download.return_value = {"Close": close_raw, "Volume": volume_raw}

    clean_close, clean_volume = fetch_batch_history(["AAPL", "MSFT"], period="5d")

    assert clean_close["AAPL"].isna().sum() == 0
    assert clean_close["AAPL"].iloc[1] == 150.0
    assert clean_volume["MSFT"].isna().sum() == 0
    assert clean_volume["MSFT"].iloc[1] == 2000