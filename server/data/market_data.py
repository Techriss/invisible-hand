import io
import requests
import yfinance as yf
import requests
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})
yf.set_tz_cache_location("/tmp/yfinance_cache")
import pandas as pd
from logger_config import setup_logger

log = setup_logger("data.market_data")

def fetch_sp500_universe() -> dict:
    """Fetches S&P 500 constituents and returns a mapping of ticker to company name."""
    url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
    headers = {'User-Agent': 'MarketAnalyst/1.0'}
    ticker_to_name = {}
    
    try:
        res = requests.get(url, headers=headers, timeout=5)
        df = pd.read_csv(io.StringIO(res.text))
        for _, row in df.iterrows():
            symbol = str(row.get("Symbol", row.get("symbol", ""))).replace('.', '-')
            name = str(row.get("Security", row.get("Name", symbol)))
            ticker_to_name[symbol] = name
        return ticker_to_name
    except Exception as e:
        log.warning(f"CSV Fetch Failed: {e}")
        return {"AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA", "JPM": "JPMorgan"}

def fetch_batch_history(tickers: list, period="1y", interval="1d"):
    """Downloads historical data and returns clean Close and Volume dataframes."""
    log.info(f"Downloading {period} history for {len(tickers)} stocks...")
    raw_data = yf.download(tickers, period=period, interval=interval, progress=False, session=session)
    close_data = raw_data["Close"].dropna(axis=1, thresh=int(len(raw_data) * 0.95)).ffill().bfill()
    volume_data = raw_data["Volume"][close_data.columns].ffill().bfill()
    return close_data, volume_data