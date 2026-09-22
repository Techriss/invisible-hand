import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch
from core.sector_analyzer import analyze_sector_rotation, SECTOR_ETFS

@patch("core.sector_analyzer.yf.download")
@patch("core.sector_analyzer.get_dynamic_weights")
def test_sector_rotation_empty_data_handling(mock_weights, mock_download):
    """Verifies safe empty return when Yahoo Finance returns no price data."""
    mock_weights.return_value = {ticker: 10.0 for ticker in SECTOR_ETFS}
    mock_download.return_value = pd.DataFrame()

    results = analyze_sector_rotation()
    assert results == []

@patch("core.sector_analyzer.yf.download")
@patch("core.sector_analyzer.get_dynamic_weights")
def test_composite_momentum_calculation(mock_weights, mock_download):
    """Verifies moving-average window calculation and composite weighting math."""
    tickers = list(SECTOR_ETFS.keys())
    mock_weights.return_value = {ticker: 10.0 for ticker in tickers}

    dates = pd.date_range(end="2026-03-01", periods=60, freq="B")
    data = {}
    
    for ticker in tickers:
        if ticker == "XLK":
            data[ticker] = np.linspace(100.0, 160.0, 60)
        else:
            data[ticker] = np.full(60, 100.0)

    close_df = pd.DataFrame(data, index=dates)
    mock_download.return_value = pd.concat({"Close": close_df}, axis=1)

    results = analyze_sector_rotation()
    
    assert len(results) == len(tickers)
    
    xlk_entry = next(r for r in results if r["name"] == "Technology")
    assert xlk_entry["size"] == 10.0
    assert xlk_entry["momentum"] > 0.0

    other_entry = next(r for r in results if r["name"] != "Technology")
    assert other_entry["momentum"] == 0.0