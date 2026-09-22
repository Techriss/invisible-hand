import pytest
import time
from unittest.mock import patch
from data.vector_rag import calculate_days_ago, format_news_for_llm, get_relevant_news

def test_calculate_days_ago():
    """Verifies day delta calculation from Unix timestamps."""
    now = int(time.time())
    one_day_ago = now - 86400
    three_days_ago = now - (3 * 86400)

    assert calculate_days_ago(now) == 0
    assert calculate_days_ago(one_day_ago) == 1
    assert calculate_days_ago(three_days_ago) == 3

def test_format_news_for_llm_tagging():
    """Verifies LLM context formatting and historical prefix labeling."""
    now = int(time.time())
    docs = ["Fed keeps target rate unchanged."]
    metas = [{"date_str": "2026-03-10", "timestamp": now}]

    recent_output = format_news_for_llm(docs, metas, is_fallback=False)
    assert "[RECENT NEWS]" in recent_output
    assert "Published: 2026-03-10" in recent_output
    assert "TODAY" in recent_output

    fallback_output = format_news_for_llm(docs, metas, is_fallback=True)
    assert "[HISTORICAL ARCHIVE]" in fallback_output

@patch("data.vector_rag.ingest_live_news")
@patch("data.vector_rag.news_collection.query")
def test_get_relevant_news_fallback_trigger(mock_query, mock_ingest):
    """Verifies that vector search triggers historical archive when recent window is empty."""
    mock_query.side_effect = [
        {"documents": [[]], "metadatas": [[]]},
        {
            "documents": [["Historical acquisition completed."]],
            "metadatas": [[{"date_str": "2025-11-01", "timestamp": int(time.time()) - (100 * 86400)}]]
        }
    ]

    result = get_relevant_news("MSFT", max_days_old=14, n_results=5)

    assert mock_query.call_count == 2
    assert "[HISTORICAL ARCHIVE]" in result
    assert "Historical acquisition completed." in result