import pandas_datareader as pdr
import feedparser
from datetime import datetime, timedelta

def get_live_macro_data() -> str:
    print("  -> [MACRO] Contacting US Federal Reserve Databases (FRED & RSS)...")
    macro_context = []

    try:
        end = datetime.now()
        start = end - timedelta(days=90)
        
        # FEDFUNDS = Effective Federal Funds Rate
        # CPIAUCSL = Consumer Price Index (Inflation)
        df = pdr.get_data_fred(['FEDFUNDS', 'CPIAUCSL'], start, end)
        
        latest_rate = df['FEDFUNDS'].dropna().iloc[-1]
        latest_cpi = df['CPIAUCSL'].dropna().iloc[-1]
        
        macro_context.append("### QUANTITATIVE MACRO METRICS (Source: FRED) ###")
        macro_context.append(f"- Current Federal Funds Rate: {latest_rate:.2f}%")
        macro_context.append(f"- Latest CPI (Inflation) Index: {latest_cpi:.2f}")
        macro_context.append("")
    except Exception as e:
        macro_context.append(f"[FRED DATA UNAVAILABLE]: {e}")

    try:
        feed = feedparser.parse("https://www.federalreserve.gov/feeds/press_all.xml")
        
        macro_context.append("### RECENT FEDERAL RESERVE PRESS RELEASES ###")
        
        for entry in feed.entries[:5]: 
            pub_date = entry.published
            title = entry.title
            macro_context.append(f"[{pub_date}] {title}")
            
    except Exception as e:
        macro_context.append(f"[FED RSS UNAVAILABLE]: {e}")

    return "\n".join(macro_context)