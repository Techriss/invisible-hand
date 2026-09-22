from cmath import log
import json
import os
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

from logger_config import setup_logger
from schemas import AnalysisReport, BatchClusterLabels, RiskFactor, KeyOpportunity
from data.sec_edgar import fetch_recent_sec_filings
from data.vector_rag import get_relevant_news
from data.macro_provider import get_live_macro_data
from core.financial_metrics import get_financial_metrics

log = setup_logger("core.liquidity_analyzer")
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)

def generate_batch_cluster_labels(clusters_info: list[dict]) -> dict:
    log.info("Categorizing macro regimes across %d factor clusters via Gemini", len(clusters_info))
    
    prompt = f"""
    You are a Senior Quantitative Factor Strategist. 
    An unsupervised K-Means algorithm clustered S&P 500 stocks based on identical daily return co-movement over 252 trading days.
    
    Here are the clusters and their anchor constituents:
    {json.dumps(clusters_info, indent=2)}
    
    TASK:
    For EACH cluster, provide:
    1. A concise, institutional 2-4 word "theme_name" (e.g., 'Hyperscaler AI Infrastructure', 'Short-Duration Yield Stalwarts').
    2. A 1-sentence "description" explaining the underlying FINANCIAL or MACROECONOMIC MECHANISM driving their correlation.
    
    STRICT RULES:
    - DO NOT be tautological. (e.g., NEVER say 'Banks trade together because they are banking companies').
    - Focus on balance sheet mechanics: duration risk, net interest margin sensitivity, capital expenditure cycles, raw material input elasticity, or regulatory pricing.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a quantitative strategist.",
                response_mime_type="application/json",
                response_schema=BatchClusterLabels,
                temperature=0.1
            )
        )
        return {
            label.cluster_id: {
                "theme_name": label.theme_name,
                "description": label.description
            }
            for label in response.parsed.labels
        }
    except Exception as e:
        log.error("AI batch cluster labeling failed: %s", e, exc_info=True)
        return {}


def generate_deep_analysis(ticker: str) -> dict:
    log.info("Generating deep fundamental report for %s", ticker)
    
    sec_data = fetch_recent_sec_filings(ticker)
    retrieved_news = get_relevant_news(ticker)
    metrics = get_financial_metrics(ticker)

    company_type = "PRIVATE / ETF / PRE-IPO ENTITY" if metrics["is_private"] else "PUBLICLY TRADED CORPORATION"
    exec_summary = f"{ticker} ({company_type}) | Price: {metrics['price_str']} | Market Cap: {metrics['market_cap_str']} | Sector: {metrics['sector']}"
    
    prompt = f"""
    You are a ruthless Wall Street equity analyst & venture capitalist. Analyze real-time data for {ticker} ({company_type}):
    
    MARKET METRICS:
    - Price: {metrics['price_str']}
    - Market Cap: {metrics['market_cap_str']}
    - Profit Margin: {metrics['profit_margin_str']}
    - Sector: {metrics['sector']}
    - Beta: {metrics['beta']}

    OFFICIAL SEC EDGAR FILINGS (GROUND TRUTH):
    {sec_data}

    RECENT NEWS & VECTOR DB CONTEXT (Dates are explicitly tagged):
    {retrieved_news}

    INSTRUCTIONS:
    - Return a clear, punchy 1-sentence bull thesis using simple English.
    - Return a clear, ruthless 1-sentence bear thesis using simple English.
    - If PRIVATE/PRE-IPO, address valuation hype vs actual technological moat/backlog rather than traditional stock ratios.
    - Identify EXACTLY 3 to 5 distinct, critical risk factors (covering Valuation, Regulatory, or Fundamental risks). 
    - Severity score must be a float between 1.0 and 10.0. Scale: 1.0-3.0=Noise, 4.0-6.0=Headwinds, 7.0-8.5=Severe Drag, 9.0-10.0=Existential.
    - Map the exact YYYY-MM-DD date from the RECENT NEWS or EDGAR FILINGS context to each risk factor you generate.
    - Identify EXACTLY 3 to 5 distinct key opportunities (Structural Moats & Catalysts).
    - For opportunities, conviction score must be a float between 1.0 and 10.0. Timeframe should be 'Near-Term', 'Mid-Term', or 'Deep Moat'.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a ruthless Wall Street analyst.",
                response_mime_type="application/json",
                response_schema=AnalysisReport,
                temperature=0.2
            )
        )
        parsed_report = response.parsed 
    except Exception as e:
        log.error("Deep analysis generation failed for %s: %s", ticker, e, exc_info=True)
        parsed_report = AnalysisReport(
            bull_case="AI Generation temporarily unavailable due to API timeout.",
            bear_case="AI Generation temporarily unavailable due to API timeout.",
            key_risks=[RiskFactor(risk_description="API Timeout Error", severity_score=5.0, timestamp="N/A")],
            key_opportunities=[KeyOpportunity(description="API Timeout Error", conviction_score=5.0, timeframe="N/A")]
        )
    
    return {
        "executive_summary": exec_summary,
        "bull_case": parsed_report.bull_case,
        "bear_case": parsed_report.bear_case,
        "risk_factors": [
            {"description": r.risk_description, "severity_score": round(float(r.severity_score), 1), "timestamp": r.timestamp} 
            for r in parsed_report.key_risks
        ],
        "opportunities": [
            {"description": o.description, "conviction_score": round(float(o.conviction_score), 1), "timeframe": o.timeframe} 
            for o in parsed_report.key_opportunities
        ],
        "is_private": metrics["is_private"],
        "graham_number": round(metrics["graham_number"], 2),
        "margin_of_safety": round(metrics["margin_of_safety"], 4),
        "altman_z_score": round(metrics["altman_z_score"], 2),
        "altman_z_status": metrics["altman_z_status"]
    }

def generate_macro_sentiment() -> dict:
    log.info("Synthesizing live Federal Reserve macro data via Gemini")
    live_fed_data = get_live_macro_data()
    
    prompt = f"""
    You are the Chief Global Economist at a top-tier quantitative hedge fund. 
    Analyze this LIVE data pulled directly from the US Federal Reserve:
    
    {live_fed_data}
    
    INSTRUCTIONS:
    - Determine the overall structural stance on the global equity market: BULLISH, NEUTRAL, or BEARISH based on this monetary policy data.
    - Write exactly 3 hard-hitting, concise bullet points summarizing the current state of monetary policy, inflation, and economic health.
    - Speak like an institutional portfolio manager. 
    
    Return a strict JSON object with this exact schema:
    {{
        "market_stance": "NEUTRAL",
        "bullets": [
            "First macro bullet point.",
            "Second macro bullet point.",
            "Third macro bullet point."
        ]
    }}
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction="You are a Chief Economist. Return ONLY valid JSON.",
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        parsed = json.loads(response.text)
    except Exception as e:
        log.error("Macro sentiment generation failed: %s", e, exc_info=True)
        parsed = {
            "market_stance": "NEUTRAL",
            "bullets": ["Federal Reserve data parsing failed due to AI API timeout.", "Awaiting system recovery."]
        }

    return {
        "market_stance": parsed.get("market_stance", "NEUTRAL"),
        "bullets": parsed.get("bullets", []),
        "sources_cited": ["Federal Reserve Economic Data (FRED)", "US Federal Reserve Press RSS", "Gemini 3.5 Flash Lite"]
    }