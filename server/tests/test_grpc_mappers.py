import pytest
from grpc_mappers import (
    map_liquidity_summary_pb,
    map_to_analysis_report_pb,
    map_rotation_alert_pb,
    map_cluster_overview_pb,
    map_relative_value_pb,
    map_macro_report_pb
)

def test_map_liquidity_summary_pb():
    """Verifies that liquidity summary dict maps to LiquiditySummary protobuf."""
    summary = {
        "liquidity_score": 7.6,
        "market_regime": "High Liquidity (Low Slippage Risk)",
        "avg_volume": 4200.5,
        "avg_spread": 0.0125
    }
    
    pb = map_liquidity_summary_pb(summary)
    
    assert pb.asset_class == "Equities"
    assert pb.liquidity_score == pytest.approx(7.6, rel=1e-3)
    assert pb.market_regime == "High Liquidity (Low Slippage Risk)"

def test_map_to_analysis_report_pb_complete():
    """Verifies full report dictionary maps into AnalysisReport protobuf."""
    sample_data = {
        "executive_summary": "AAPL | Price: $180.00",
        "bull_case": "Ecosystem lock-in and services acceleration.",
        "bear_case": "Hardware replacement cycle slowdown.",
        "risk_factors": [
            {"description": "Regulatory antitrust pressure", "severity_score": 7.5, "timestamp": "2026-03-10"}
        ],
        "opportunities": [
            {"description": "AI-assisted services monetization", "conviction_score": 8.0, "timeframe": "Deep Moat"}
        ],
        "hype_index": 0.35,
        "graham_number": 65.4,
        "margin_of_safety": -1.75,
        "altman_z_score": 4.12,
        "altman_z_status": "SAFE"
    }
    sources = ["Yahoo Finance", "SEC EDGAR Database"]
    
    pb = map_to_analysis_report_pb("AAPL", sample_data, sources)
    
    assert pb.ticker == "AAPL"
    assert pb.executive_summary == "AAPL | Price: $180.00"
    assert pb.bull_case == "Ecosystem lock-in and services acceleration."
    assert pb.bear_case == "Hardware replacement cycle slowdown."
    
    assert len(pb.key_risks) == 1
    assert pb.key_risks[0].risk_description == "Regulatory antitrust pressure"
    assert pb.key_risks[0].severity_score == pytest.approx(7.5)
    assert pb.key_risks[0].timestamp == "2026-03-10"
    
    assert len(pb.key_opportunities) == 1
    assert pb.key_opportunities[0].description == "AI-assisted services monetization"
    assert pb.key_opportunities[0].conviction_score == pytest.approx(8.0)
    assert pb.key_opportunities[0].timeframe == "Deep Moat"
    
    assert list(pb.sources_cited) == sources
    assert pb.hype_index == pytest.approx(0.35)
    assert pb.graham_number == pytest.approx(65.4)
    assert pb.altman_z_score == pytest.approx(4.12)
    assert pb.altman_z_status == "SAFE"

def test_map_to_analysis_report_pb_fallbacks():
    """Verifies fallback report dictionary safely fills default values."""
    fallback_data = {
        "executive_summary": "Analysis failed for GOOG.",
        "bull_case": "Error generating AI data.",
        "bear_case": "Error generating AI data.",
        "risk_factors": [{"description": "Pipeline Error", "severity_score": 10.0}],
        "opportunities": [{"description": "Pipeline Error", "conviction_score": 1.0}]
    }
    
    pb = map_to_analysis_report_pb("GOOG", fallback_data, ["Error"])
    
    assert pb.ticker == "GOOG"
    assert pb.key_risks[0].timestamp == "Recent"
    assert pb.key_opportunities[0].timeframe == "Long-Term Moat"
    assert pb.hype_index == 0.0
    assert pb.altman_z_status == "UNKNOWN"

def test_map_rotation_alert_pb():
    """Verifies sector performance entries map to RotationAlert protobuf."""
    sectors_data = [
        {"name": "Technology", "size": 31.5, "momentum": 2.45},
        {"name": "Financials", "size": 13.2, "momentum": -0.80}
    ]
    
    pb = map_rotation_alert_pb(sectors_data, timestamp=1700000000)
    
    assert pb.timestamp == 1700000000
    assert len(pb.sectors) == 2
    assert pb.sectors[0].name == "Technology"
    assert pb.sectors[0].size == pytest.approx(31.5)
    assert pb.sectors[0].momentum == pytest.approx(2.45)

def test_map_cluster_overview_pb():
    """Verifies cluster summaries map to ClusterOverviewResponse protobuf."""
    summaries = [
        {
            "cluster_id": 0,
            "theme_name": "Hyperscaler Cloud",
            "description": "High capex co-movement.",
            "constituent_count": 12,
            "average_momentum": 0.045,
            "top_tickers": ["MSFT", "AMZN", "GOOG"]
        }
    ]
    
    pb = map_cluster_overview_pb(summaries)
    
    assert len(pb.clusters) == 1
    assert pb.clusters[0].cluster_id == 0
    assert pb.clusters[0].theme_name == "Hyperscaler Cloud"
    assert pb.clusters[0].constituent_count == 12
    assert list(pb.clusters[0].top_tickers) == ["MSFT", "AMZN", "GOOG"]

def test_map_relative_value_pb():
    """Verifies peer spread data maps to RelativeValueResponse protobuf."""
    data = {
        "target_ticker": "NVDA",
        "target_name": "NVIDIA Corporation",
        "cluster_id": 2,
        "theme_name": "Semiconductor Capital Equipment",
        "cluster_average_return": 0.082,
        "outperformers": [
            {"ticker": "AVGO", "company_name": "Broadcom", "performance_spread": 0.031}
        ],
        "laggards": [
            {"ticker": "INTC", "company_name": "Intel", "performance_spread": -0.054}
        ]
    }
    
    pb = map_relative_value_pb(data)
    
    assert pb.target_ticker == "NVDA"
    assert pb.target_name == "NVIDIA Corporation"
    assert len(pb.outperformers) == 1
    assert pb.outperformers[0].ticker == "AVGO"
    assert pb.outperformers[0].performance_spread == pytest.approx(0.031)
    assert len(pb.laggards) == 1
    assert pb.laggards[0].ticker == "INTC"

def test_map_macro_report_pb():
    """Verifies macroeconomic dict maps to MacroReport protobuf using summary_bullets."""
    macro_data = {
        "market_stance": "BULLISH",
        "bullets": ["Federal funds rate steady.", "CPI index stabilizing."],
        "sources_cited": ["FRED", "Federal Reserve Press RSS"]
    }
    
    pb = map_macro_report_pb(macro_data)
    
    assert pb.market_stance == "BULLISH"
    assert len(pb.summary_bullets) == 2
    assert pb.summary_bullets[0] == "Federal funds rate steady."
    assert list(pb.sources_cited) == ["FRED", "Federal Reserve Press RSS"]