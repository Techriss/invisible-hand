import yfinance as yf
import requests
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
yf.set_tz_cache_location("/tmp/yfinance_cache")

GRAHAM_MULTIPLIER = 22.5 # 15 (earnings per share) * 1.5 (book value per share)
ALTMAN_WEIGHTS = {"X1": 1.2, "X2": 1.4, "X3": 3.3, "X4": 0.6, "X5": 1.0}

def format_market_cap(value):
    if value == "N/A": return value
    if value >= 1_000_000_000_000: return f"${value / 1_000_000_000_000:.2f}T"
    if value >= 1_000_000_000: return f"${value / 1_000_000_000:.2f}B"
    if value >= 1_000_000: return f"${value / 1_000_000:.2f}M"
    return f"${value:,}"

def get_financial_metrics(ticker: str) -> dict:
    print(f"  -> [QUANT METRICS] Fetching balance sheet and calculating forensic metrics for {ticker}...")
    
    metrics = {
        "is_private": True,
        "price_str": "N/A (Private / ETF)",
        "market_cap_str": "N/A (Estimated or N/A)",
        "profit_margin_str": "N/A",
        "sector": "Alternative Asset / Private",
        "beta": "N/A",
        "graham_number": 0.0,
        "margin_of_safety": 0.0,
        "altman_z_score": 0.0,
        "altman_z_status": "N/A"
    }

    try:
        stock = yf.Ticker(ticker, session=session)
        info = stock.info or {}
        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        
        if not current_price:
            print(f"  -> [FALLBACK] {ticker} lacks standard pricing (likely private).")
            return metrics 
            
        metrics["is_private"] = False
        metrics["price_str"] = f"${current_price:.2f}"
        metrics["market_cap_str"] = format_market_cap(info.get("marketCap", "N/A"))
        metrics["profit_margin_str"] = f"{(info.get('profitMargins', 0) or 0) * 100:.2f}%"
        metrics["sector"] = info.get("sector", "General Business")
        metrics["beta"] = str(info.get("beta", 1.0))

        # Graham Number
        eps = info.get("trailingEps", 0)
        bvps = info.get("bookValue", 0)
        if eps and bvps and eps > 0 and bvps > 0:
            metrics["graham_number"] = (GRAHAM_MULTIPLIER * eps * bvps) ** 0.5
            metrics["margin_of_safety"] = ((metrics["graham_number"] - current_price) / metrics["graham_number"])
            
        # Altman Z-Score
        try:
            bs = stock.balance_sheet
            inc = stock.financials
            
            if not bs.empty and not inc.empty:
                latest_bs = bs.iloc[:, 0]
                latest_inc = inc.iloc[:, 0]
                
                total_assets = latest_bs.get("Total Assets", 0)
                current_assets = latest_bs.get("Current Assets", 0)
                current_liabilities = latest_bs.get("Current Liabilities", 0)
                working_capital = current_assets - current_liabilities
                
                retained_earnings = latest_bs.get("Retained Earnings", 0)
                ebit = latest_inc.get("EBIT", latest_inc.get("Operating Income", 0))
                total_liabilities = latest_bs.get("Total Liabilities Net Minority Interest", latest_bs.get("Total Liabilities", 0))
                market_cap = info.get("marketCap", 0)
                sales = latest_inc.get("Total Revenue", 0)
                
                if total_assets > 0:
                    x1 = working_capital / total_assets
                    x2 = retained_earnings / total_assets
                    x3 = ebit / total_assets
                    x4 = market_cap / total_liabilities if total_liabilities > 0 else 0
                    x5 = sales / total_assets
                    
                    z_score = (ALTMAN_WEIGHTS["X1"] * x1) + (ALTMAN_WEIGHTS["X2"] * x2) + (ALTMAN_WEIGHTS["X3"] * x3) + (ALTMAN_WEIGHTS["X4"] * x4) + (ALTMAN_WEIGHTS["X5"] * x5)
                    metrics["altman_z_score"] = z_score
                    
                    if z_score >= 3.0:
                        metrics["altman_z_status"] = "SAFE"
                    elif z_score >= 1.8:
                        metrics["altman_z_status"] = "WARNING"
                    else:
                        metrics["altman_z_status"] = "DISTRESS"
        except Exception as e:
            print(f"  -> [WARNING] Altman Z-Score calculation skipped: {e}")

    except Exception as e:
        print(f"  -> [FALLBACK] Exception caught for {ticker}: {e}")

    return metrics