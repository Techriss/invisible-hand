import pytest
from unittest.mock import patch, MagicMock
from core.sentiment_analyzer import SentimentEngine

@pytest.fixture
def mock_sentiment_engine():
    """Instantiates SentimentEngine with a mocked FinBERT pipeline."""
    with patch("core.sentiment_analyzer.pipeline") as mock_pipeline:
        mock_nlp = MagicMock()
        mock_pipeline.return_value = mock_nlp
        engine = SentimentEngine()
        engine.analyzer = mock_nlp
        yield engine

def test_calculate_hype_index_empty_input(mock_sentiment_engine):
    """Verifies that an empty headline list yields a neutral 0.0 score."""
    score = mock_sentiment_engine._calculate_hype_index([])
    assert score == 0.0

def test_calculate_hype_index_formula(mock_sentiment_engine):
    """Verifies weighted calculation across positive, negative, and neutral labels."""
    headlines = [
        "Company breaks all-time quarterly revenue records",
        "Company faces regulatory antitrust lawsuit",
        "Company hosts routine annual shareholder meeting"
    ]
    
    mock_sentiment_engine.analyzer.return_value = [
        {"label": "positive", "score": 0.90},
        {"label": "negative", "score": 0.60},
        {"label": "neutral", "score": 0.80}
    ]

    score = mock_sentiment_engine._calculate_hype_index(headlines)
    assert score == pytest.approx(0.100)

@patch("core.sentiment_analyzer.news_collection.query")
def test_get_ticker_hype_database_lookup(mock_query, mock_sentiment_engine):
    """Verifies vector DB integration and sentiment extraction flow."""
    mock_query.return_value = {
        "documents": [["Strong enterprise adoption drives margins higher"]]
    }
    mock_sentiment_engine.analyzer.return_value = [
        {"label": "positive", "score": 0.85}
    ]

    score = mock_sentiment_engine.get_ticker_hype("NVDA")
    assert score == 0.85
    mock_query.assert_called_once()