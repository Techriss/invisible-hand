import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from data.macro_provider import get_live_macro_data

@patch("data.macro_provider.feedparser.parse")
@patch("data.macro_provider.pdr.get_data_fred")
def test_get_live_macro_data_success(mock_fred, mock_rss):
    """Verifies formatting of FRED interest rate metrics and recent RSS press titles."""
    dates = pd.date_range(start="2026-01-01", periods=3)
    mock_df = pd.DataFrame({
        "FEDFUNDS": [5.25, 5.25, 5.00],
        "CPIAUCSL": [310.1, 310.5, 311.2]
    }, index=dates)
    mock_fred.return_value = mock_df

    entry1 = MagicMock()
    entry1.published = "Tue, 10 Mar 2026 14:00:00 GMT"
    entry1.title = "Federal Reserve issues FOMC statement"

    entry2 = MagicMock()
    entry2.published = "Mon, 09 Mar 2026 10:00:00 GMT"
    entry2.title = "Minutes of the Federal Open Market Committee"

    mock_feed = MagicMock()
    mock_feed.entries = [entry1, entry2]
    mock_rss.return_value = mock_feed

    output = get_live_macro_data()

    assert "Current Federal Funds Rate: 5.00%" in output
    assert "Latest CPI (Inflation) Index: 311.20" in output
    assert "Federal Reserve issues FOMC statement" in output
    assert "Minutes of the Federal Open Market Committee" in output

@patch("data.macro_provider.feedparser.parse")
@patch("data.macro_provider.pdr.get_data_fred")
def test_get_live_macro_data_fallback_when_apis_fail(mock_fred, mock_rss):
    """Verifies that network errors from FRED or Federal Reserve RSS degrade gracefully."""
    mock_fred.side_effect = ConnectionError("FRED gateway unreachable")
    mock_rss.side_effect = TimeoutError("Federal Reserve RSS feed timed out")

    output = get_live_macro_data()
    assert isinstance(output, str)