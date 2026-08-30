import structural_analysis_pb2
import liquidity_pb2
import sector_rotation_pb2
import macro_sentiment_pb2

def map_to_analysis_report_pb(ticker: str, data: dict, sources: list[str]) -> structural_analysis_pb2.AnalysisReport:
    protobuf_risks = [
        structural_analysis_pb2.RiskFactor(
            risk_description=r["description"], severity_score=float(r["severity_score"]), timestamp=str(r.get("timestamp", "Recent"))
        ) for r in data.get("risk_factors", [])
    ]

    protobuf_opportunities = [
        structural_analysis_pb2.KeyOpportunity(
            description=opp["description"], conviction_score=float(opp["conviction_score"]), timeframe=str(opp.get("timeframe", "Long-Term Moat"))
        ) for opp in data.get("opportunities", [])
    ]

    return structural_analysis_pb2.AnalysisReport(
        ticker=ticker, executive_summary=data.get("executive_summary", ""), bull_case=data.get("bull_case", ""),
        bear_case=data.get("bear_case", ""), key_risks=protobuf_risks, key_opportunities=protobuf_opportunities,
        sources_cited=sources, hype_index=data.get("hype_index", 0.0), graham_number=data.get("graham_number", 0.0),
        margin_of_safety=data.get("margin_of_safety", 0.0), altman_z_score=data.get("altman_z_score", 0.0), altman_z_status=data.get("altman_z_status", "UNKNOWN")
    )

def map_liquidity_summary_pb(summary: dict) -> liquidity_pb2.LiquiditySummary:
    return liquidity_pb2.LiquiditySummary(
        asset_class="Equities",
        liquidity_score=summary["liquidity_score"],
        market_regime=summary["market_regime"]
    )

def map_rotation_alert_pb(sectors_data: list, timestamp: int) -> sector_rotation_pb2.RotationAlert:
    protobuf_sectors = [
        sector_rotation_pb2.SectorData(name=s["name"], size=s["size"], momentum=s["momentum"]) 
        for s in sectors_data
    ]

    return sector_rotation_pb2.RotationAlert(sectors=protobuf_sectors, timestamp=timestamp)

def map_cluster_overview_pb(summaries: list) -> sector_rotation_pb2.ClusterOverviewResponse:
    clusters = [
        sector_rotation_pb2.ClusterSummary(
            cluster_id=s["cluster_id"], theme_name=s["theme_name"], description=s["description"],
            constituent_count=s["constituent_count"], average_momentum=s["average_momentum"], top_tickers=s["top_tickers"]
        ) for s in summaries
    ]

    return sector_rotation_pb2.ClusterOverviewResponse(clusters=clusters)

def map_relative_value_pb(data: dict) -> sector_rotation_pb2.RelativeValueResponse:
    outperformers = [
        sector_rotation_pb2.ClusterPeer(ticker=p["ticker"], company_name=p["company_name"], performance_spread=p["performance_spread"]) 
        for p in data["outperformers"]
    ]

    laggards = [
        sector_rotation_pb2.ClusterPeer(ticker=p["ticker"], company_name=p["company_name"], performance_spread=p["performance_spread"]) 
        for p in data["laggards"]
    ]
    
    return sector_rotation_pb2.RelativeValueResponse(
        target_ticker=data["target_ticker"], target_name=data["target_name"], cluster_id=data["cluster_id"],
        theme_name=data["theme_name"], cluster_average_return=data["cluster_average_return"],
        outperformers=outperformers, laggards=laggards
    )

def map_macro_report_pb(macro_data: dict) -> macro_sentiment_pb2.MacroReport:
    return macro_sentiment_pb2.MacroReport(
        market_stance=macro_data.get("market_stance", "ERROR"),
        summary_bullets=macro_data.get("bullets", []),
        sources_cited=macro_data.get("sources_cited", [])
    )