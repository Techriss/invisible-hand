<div align="center">
  <img width="200" height="200" alt="logo" src="https://github.com/user-attachments/assets/292fb713-e938-49ac-9042-4d0f7040de5b"/>

  # Invisible Hand
  **Quantitative Market Analysis & AI Intelligence Engine**
</div>

### AI-powered microservice market analyst able to provide short, mid and long term overview of the current market situation for Intelligent Investors.

## Functionality includes:
  - Short-term overview
    - Federal Reserve macroeconomic stance
      - current Federal Funds Rate
      - current CPI
      - current policy stance based on Fed RSS feed and FRED data (analyzed by Gemini)
    - Real-time liquidity scoring
        - Alpaca web socket volume and spread live tick data
        - local Isolation Forest anomaly detection with alerts
  - Mid-term overview
      - Live standard sector momentum heatmap with a composite 50d/20d/5d value
      - Quantitatively generated sector heatmap momentum
        - 1 year closing price analysis of the S&P500 companies
        - PCA K-Means clustering for sector finding
        - major sector contributor list
  - Long-term overview
      - AI news and Yahoo Finance financial metrics analysis with ChromaDB Vector RAG by Gemini
      - bull and bear thesis
      - current upsides and downsides list with timeframes and importance score
      - relative growth to the quantitatively generated sector with outperforming and underperforming peers listed
      - current stock hype via FinBERT news sentiment
      - Benjamin Graham intrinsic value calculation and current premium percentage (from Intelligent Investor)
      - Probability of insolvency based on balance sheet values with Altman Z-Score
      - simple current stock data
  - General
      - stock watchlist for quick access

## Architecture & Services 
### Frontend
  - Typescript
  - [Next.js](https://nextjs.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
### API Gateway
  - Java
  - [Spring Boot](https://spring.io/projects/spring-boot)
  - [gRPC](https://grpc.io/)
### Backend
  - Python
  - [Yahoo Finance API](https://github.com/ranaroussi/yfinance)
  - [Google Gemini API (genai)](https://aistudio.google.com/)
  - FinBERT (HuggingFace)
  - FRED API and FED RSS feed
  - [SEC Edgar API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
  - [Alpaca web socket](https://alpaca.markets/)
  - [S&P500 Companies](https://github.com/datasets/s-and-p-500-companies)
  - [scikit-learn](https://scikit-learn.org/stable/)
  - [Google News (GNews)](https://pypi.org/project/gnews/)
  - ChromaDB (news for vector RAG)
### Caching
  - Redis (AI analysis)
### Build
  - Docker

# Build
### Environment Variables
  - [.env.example](https://github.com/Techriss/invisible-hand/blob/main/.env.example)
  - [.env.local.example (market-dashboard frontend)](https://github.com/Techriss/invisible-hand/blob/main/market-dashboard/.env.local.example)
### Requirements
  - [Docker](https://www.docker.com/products/docker-desktop/)
### Installation
1. clone the repo

   ```bash
   git clone https://github.com/Techriss/invisible-hand.git
   cd invisible-hand
   ```

2. create the .env and market-dashboard/.env.local files with data
3. deploy

   ```bash
   docker compose up --build
   ```

4. open http://localhost:3000


# Shoutout to 
  - Benjamin Graham's The Intelligent Investor
  - Adam Smith's The Wealth of Nations

# Gallery
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/e1fdc36c-d5ac-4909-86c6-5b9cc12b5262" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/f9051ea9-a4ca-4330-8b35-737a095b23f4" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/4329eea5-cd83-42dc-8656-e494504292ef" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/fe31abc2-63e1-4a61-ae3a-ea4cd9ee9211" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/f85f777e-7a57-4c53-9cbc-bebd214ebbfa" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/5cbc2d29-28a2-486b-80fe-edd6d2b9508f" />
<img width="1917" height="1078" alt="image" src="https://github.com/user-attachments/assets/7c8e8fcf-29d2-4b8e-8103-247fe942f17e" />




