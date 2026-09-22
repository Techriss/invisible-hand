import pandas as pd
import yfinance as yf
import requests
from logger_config import setup_logger

log = setup_logger("core.sector_analyzer")

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
yf.set_tz_cache_location("/tmp/yfinance_cache")

SECTOR_ETFS = {
    "XLK": "Technology", 
    "XLF": "Financials", 
    "XLV": "Health Care",
    "XLY": "Cons. Disc.", 
    "XLC": "Comm Svcs", 
    "XLI": "Industrials",
    "XLP": "Cons. Staples", 
    "XLE": "Energy", 
    "XLRE": "Real Estate",
    "XLU": "Utilities", 
    "XLB": "Materials"
}

_cached_weights = {}

def get_dynamic_weights():
    global _cached_weights
    if _cached_weights:
        return _cached_weights
    
    log.info("Fetching dynamic sector weights (AUM) from Wall Street...")
    weights = {}
    total_market_assets = 0.0
    
    for ticker in SECTOR_ETFS.keys():
        try:
            info = yf.Ticker(ticker, session=session).info
            assets = info.get('totalAssets') or info.get('marketCap') or 1.0
            weights[ticker] = assets
            total_market_assets += assets
        except Exception as e:
            log.warning("Could not fetch AUM for %s. Defaulting to 1.0. Error: %s", ticker, e)
            weights[ticker] = 1.0 
            
    for ticker in weights:
        _cached_weights[ticker] = (weights[ticker] / total_market_assets) * 100
        
    return _cached_weights

def analyze_sector_rotation():
    tickers = list(SECTOR_ETFS.keys())
    dynamic_weights = get_dynamic_weights()
    
    log.info("Calculating Composite Mid-Term Momentum (50d/20d/5d)...")
    
    raw_data = yf.download(tickers, period="6mo", interval="1d", progress=False, session=session)

    is_empty = getattr(raw_data, "empty", len(raw_data) == 0)
    if is_empty or "Close" not in raw_data:
        log.warning("Yahoo Finance returned empty data for sector rotation.")
        return []

    data = raw_data["Close"].ffill()

    sma_5 = data.rolling(window=5).mean().iloc[-1]
    sma_20 = data.rolling(window=20).mean().iloc[-1]
    sma_50 = data.rolling(window=50).mean().iloc[-1]

    sectors_data = []
    
    for ticker in tickers:
        name = SECTOR_ETFS[ticker]
        weight = dynamic_weights[ticker]
        
        short_term_momentum = ((sma_5[ticker] - sma_20[ticker]) / sma_20[ticker]) * 100
        core_momentum = ((sma_20[ticker] - sma_50[ticker]) / sma_50[ticker]) * 100
        composite_score = (0.40 * short_term_momentum) + (0.60 * core_momentum)
        
        safe_momentum = 0.0 if pd.isna(composite_score) else round(composite_score, 2)
        
        sectors_data.append({
            "name": name,
            "size": round(weight, 2),
            "momentum": safe_momentum
        })

    return sectors_data