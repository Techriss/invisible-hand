import requests

HEADERS = {
    "User-Agent": "MarketAnalystApp user@marketanalyst.com",
    "Accept-Encoding": "gzip, deflate"
}

def get_cik_from_ticker(ticker):
    print(f"  -> [SEC EDGAR] Translating {ticker} to CIK...")
    url = "https://www.sec.gov/files/company_tickers.json"
    
    try:
        response = requests.get(url, headers=HEADERS)
        data = response.json()
        
        for key, company in data.items():
            if company['ticker'].upper() == ticker.upper():
                return str(company['cik_str']).zfill(10)
    except Exception as e:
        print(f"  -> [SEC ERROR] Failed to translate ticker: {e}")
        
    return None

def fetch_recent_sec_filings(ticker):
    cik = get_cik_from_ticker(ticker)
    
    if not cik:
        return "No SEC data found. This company is likely private or unlisted."
        
    print(f"  -> [SEC EDGAR] Fetching official filings for CIK {cik}...")
    url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    
    try:
        response = requests.get(url, headers=HEADERS)
        
        if response.status_code != 200:
            return "Failed to retrieve data from SEC database."
            
        data = response.json()
        filings = data.get("filings", {}).get("recent", {})
        
        if not filings:
            return "No recent SEC filings available."
            
        target_forms = ["10-K", "10-Q", "8-K", "4", "DEF 14A", "S-1", "F-1", "13F-HR"]
        
        extracted_data = []
        for i in range(len(filings.get("form", []))):
            form_type = filings["form"][i]
            if form_type in target_forms:
                date = filings["filingDate"][i]
                desc = filings["primaryDocDescription"][i]
                
                if form_type == "4":
                    desc = "Insider Trading / Change in Ownership"
                    
                extracted_data.append(f"[{date}] Form {form_type}: {desc}")
                
                if len(extracted_data) >= 10: 
                    break
                    
        if not extracted_data:
            return "No recent 10-K, 10-Q, 8-K, or Form 4 filings found."
            
        return "\n".join(extracted_data)
        
    except Exception as e:
        return f"SEC EDGAR extraction failed: {e}"