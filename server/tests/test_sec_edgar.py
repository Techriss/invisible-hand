import pytest
from unittest.mock import patch, MagicMock
from data.sec_edgar import get_cik_from_ticker, fetch_recent_sec_filings

@patch("data.sec_edgar.requests.get")
def test_get_cik_from_ticker(mock_get):
    """Verifies that ticker symbols resolve to 10-digit padded CIK strings."""
    mock_get.return_value.json.return_value = {
        "0": {"cik_str": 320193, "ticker": "AAPL", "title": "Apple Inc."},
        "1": {"cik_str": 789019, "ticker": "MSFT", "title": "MICROSOFT CORP"}
    }

    cik = get_cik_from_ticker("AAPL")
    assert cik == "0000320193"

    cik_msft = get_cik_from_ticker("msft")
    assert cik_msft == "0000789019"

    assert get_cik_from_ticker("NONEXISTENT") is None

@patch("data.sec_edgar.requests.get")
@patch("data.sec_edgar.get_cik_from_ticker")
def test_fetch_recent_sec_filings_parses_forms(mock_cik, mock_get):
    """Verifies that target forms like 10-K and Form 4 are isolated and labeled."""
    mock_cik.return_value = "0000320193"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "filings": {
            "recent": {
                "form": ["10-K", "4", "UNKNOWN_FORM"],
                "filingDate": ["2026-02-15", "2026-02-20", "2026-02-22"],
                "primaryDocDescription": ["Annual Report", "Statement of Changes in Beneficial Ownership", "Ignored"]
            }
        }
    }
    mock_get.return_value = mock_response

    filings_text = fetch_recent_sec_filings("AAPL")

    assert "[2026-02-15] Form 10-K: Annual Report" in filings_text
    assert "[2026-02-20] Form 4: Insider Trading / Change in Ownership" in filings_text
    assert "UNKNOWN_FORM" not in filings_text

@patch("data.sec_edgar.get_cik_from_ticker")
def test_fetch_recent_sec_filings_unlisted(mock_cik):
    """Verifies handling for unlisted or private tickers."""
    mock_cik.return_value = None
    output = fetch_recent_sec_filings("PRIVATE_CO")
    assert "This company is likely private or unlisted" in output