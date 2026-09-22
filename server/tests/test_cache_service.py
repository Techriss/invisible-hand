import json
import pytest
import redis
from unittest.mock import patch
from data.cache_service import (
    get_cached_report,
    set_cached_report,
    get_cached_macro,
    set_cached_clusters
)

@patch("data.cache_service.cache")
def test_get_cached_report_hit_and_miss(mock_cache):
    """Verifies Redis report retrieval on hits and misses."""
    mock_payload = {"executive_summary": "AAPL summary", "hype_index": 0.45}
    mock_cache.get.return_value = json.dumps(mock_payload)

    # Cache hit
    result = get_cached_report("AAPL")
    assert result == mock_payload
    mock_cache.get.assert_called_with("report:AAPL")

    # Cache miss
    mock_cache.get.return_value = None
    assert get_cached_report("NVDA") is None

@patch("data.cache_service.cache")
def test_redis_timeout_resilience(mock_cache):
    """Verifies that Redis read/write timeouts return None rather than raising exceptions."""
    mock_cache.get.side_effect = redis.exceptions.ConnectionError("Connection refused")
    mock_cache.set.side_effect = redis.exceptions.TimeoutError("Write timeout")

    assert get_cached_report("MSFT") is None
    assert get_cached_macro() is None

    set_cached_report("MSFT", {"data": 123}, ttl_seconds=3600)
    set_cached_clusters({"clusters": []}, ttl_seconds=86400)

@patch("data.cache_service.cache")
def test_set_cached_report_ttl(mock_cache):
    """Verifies that cached payloads serialize to JSON with the specified TTL."""
    payload = {"status": "ok"}
    set_cached_report("GOOG", payload, ttl_seconds=1800)
    mock_cache.set.assert_called_once_with("report:GOOG", json.dumps(payload), ex=1800)