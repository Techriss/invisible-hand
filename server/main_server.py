import os
import sys
import time
import json
import asyncio
from concurrent import futures
import grpc
import websockets
from dotenv import load_dotenv
from logger_config import setup_logger


load_dotenv()
log = setup_logger("server.grpc")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(CURRENT_DIR, 'grpc_generated'))

import structural_analysis_pb2_grpc
import liquidity_pb2_grpc
import sector_rotation_pb2_grpc
import macro_sentiment_pb2_grpc

from grpc_mappers import (
    map_to_analysis_report_pb, 
    map_liquidity_summary_pb, 
    map_rotation_alert_pb, 
    map_cluster_overview_pb, 
    map_relative_value_pb, 
    map_macro_report_pb 
)
from core.ai_engine import generate_macro_sentiment, generate_deep_analysis
from core.sector_analyzer import analyze_sector_rotation
from core.liquidity_analyzer import LiquidityTracker
from core.sentiment_analyzer import finbert_engine
from core.cluster_service import cluster_engine
from data.cache_service import (
    get_cached_report, 
    set_cached_report, 
    get_cached_macro, 
    set_cached_macro
)

class StructuralAnalysisService(structural_analysis_pb2_grpc.StructuralAnalyzerServicer): 
    async def GenerateDeepReport(self, request, context):
        ticker = request.ticker.upper()
        
        cached_data = get_cached_report(ticker)
        if cached_data:
            log.info(f"Redis cache hit for {ticker}; returning cached intelligence report")
            return map_to_analysis_report_pb(ticker, cached_data, ["Redis In-Memory Cache (1h TTL)"])

        log.info(f"Initiating multi-source intelligence analysis for: {ticker}")
        try:
            ai_data = generate_deep_analysis(ticker)
            hype_score = finbert_engine.get_ticker_hype(ticker)
            ai_data["hype_index"] = hype_score
            
            set_cached_report(ticker, ai_data)
            
            sources = ["Yahoo Finance", "SEC EDGAR Database", "ChromaDB RAG", "Gemini 3.5 Flash Lite"]
            if ai_data.get("is_private"):
                sources[0] = "Private Funding & Venture Analytics"

            log.info("AI Analysis Complete. Streaming to Java Gateway.")
            
            return map_to_analysis_report_pb(ticker, ai_data, sources)
        
        except Exception as e:
            log.error("Pipeline failure while generating deep report for %s: %s", ticker, e, exc_info=True)
            fallback_data = {
                "executive_summary": f"Analysis failed for {ticker}.",
                "bull_case": "Error generating AI data.",
                "bear_case": "Error generating AI data.",
                "risk_factors": [{"description": "Pipeline Error", "severity_score": 10.0, "timestamp": "N/A"}],
                "opportunities": [{"description": "Pipeline Error", "conviction_score": 1.0, "timeframe": "N/A"}]
            }

            return map_to_analysis_report_pb(ticker, fallback_data, ["Error"])
        
class MacroLiquidityService(liquidity_pb2_grpc.MacroLiquidityAnalyzerServicer):
    async def SubscribeToLiquidity(self, request, context):
        log.info(f"Connecting to Alpaca IEX stream for {request.ticker}.")
        api_key, secret_key = os.getenv("ALPACA_API_KEY"), os.getenv("ALPACA_SECRET_KEY")
        tracker = LiquidityTracker(window_size=1000) 
        queue = asyncio.Queue()

        async def listen_to_alpaca():
            try:
                async with websockets.connect("wss://stream.data.alpaca.markets/v2/iex") as ws:
                    welcome = await ws.recv()
                    log.info(f"Alpaca IEX Stream Connected: {welcome}")

                    log.info("Alpaca Auth Request.")
                    await ws.send(json.dumps({"action": "auth", "key": api_key, "secret": secret_key}))
                    
                    auth_response_str = await ws.recv()
                    auth_response = json.loads(auth_response_str)
                    log.info(f"Alpaca Auth Response: {auth_response}")
                    
                    if not auth_response or auth_response[0].get("T") != "success" or auth_response[0].get("msg") != "authenticated":
                        log.error(f"Authentication failed! Check your API Keys. Aborting.")
                        return

                    log.info(f"Subscribing to quotes for {request.ticker}...")
                    await ws.send(json.dumps({"action": "subscribe", "quotes": [request.ticker]}))
                    
                    sub_response_str = await ws.recv()
                    sub_response = json.loads(sub_response_str)
                    log.info(f"Alpaca Subscription Response: {sub_response}")
                    log.info(f"Subscribed to {request.ticker} quote stream. Listening for live ticks...")

                    while True:
                        msg = await ws.recv()
                        await queue.put(msg)
                        
            except websockets.exceptions.ConnectionClosed as e:
                log.warning("Alpaca WebSocket closed: %s", e)
            except Exception as e:
                log.error("Fatal exception in Alpaca listener task: %s", e, exc_info=True)

        listener_task = asyncio.create_task(listen_to_alpaca())
        last_emission_time = 0.0

        try:
            while True:
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=1.0)
                    for event in json.loads(message):
                        if event.get("T") == "q": 
                            tracker.process_tick(
                                volume=(event.get("bs", 0) + event.get("as", 0)) * 100, 
                                bid_price=event.get("bp"), ask_price=event.get("ap")
                            )
                except asyncio.TimeoutError:
                    pass
                
                current_time = time.time()
                if current_time - last_emission_time >= 1.0:
                    last_emission_time = current_time
                    summary = tracker.calculate_summary()
                    yield map_liquidity_summary_pb(summary)
                    
        except asyncio.CancelledError:
            log.info(f"Browser disconnected. Cleaning up.")
        finally:
            listener_task.cancel()

class SectorRotationService(sector_rotation_pb2_grpc.SectorRotationMonitorServicer):
    async def SubscribeToSector(self, request, context):
        log.info("Client subscribed to Sector Heatmap (Urgency: %s)", request.urgency_level)
        try:
            while True:
                sectors_data = analyze_sector_rotation()
                if not sectors_data:
                    break
                yield map_rotation_alert_pb(sectors_data, int(time.time()))
                await asyncio.sleep(10)
        except asyncio.CancelledError:
            log.info("Client unsubscribed from Sector Heatmap stream")
        except Exception as e:
            log.error("Sector Heatmap stream aborted unexpectedly: %s", e, exc_info=True)

    async def GetRelativeValue(self, request, context):
        data = cluster_engine.get_relative_value(request.ticker.upper())
        return map_relative_value_pb(data)
        
    async def GetMidTermClusters(self, request, context):
        return map_cluster_overview_pb(cluster_engine.cluster_summaries)

class MacroSentimentService(macro_sentiment_pb2_grpc.MacroSentimentAnalyzerServicer):
    async def GetGlobalMacro(self, request, context):
        log.info("Frontend requested Global Market Overview...")

        cached_macro = get_cached_macro()
        if cached_macro:
            log.info("Redis cache hit for Global Macro; returning 1-hour snapshot")
            macro_data = cached_macro
        else:
            try:
                macro_data = generate_macro_sentiment()
                set_cached_macro(macro_data)
            except Exception as e:
                log.error("Macro Engine Failed: %s", e, exc_info=True)
                macro_data = {"market_stance": "ERROR", "bullets": [f"Generation failed: {e}"]}

        return map_macro_report_pb(macro_data)

async def serve():
    server = grpc.aio.server(futures.ThreadPoolExecutor(max_workers=10))
    structural_analysis_pb2_grpc.add_StructuralAnalyzerServicer_to_server(StructuralAnalysisService(), server)
    liquidity_pb2_grpc.add_MacroLiquidityAnalyzerServicer_to_server(MacroLiquidityService(), server)
    sector_rotation_pb2_grpc.add_SectorRotationMonitorServicer_to_server(SectorRotationService(), server)
    macro_sentiment_pb2_grpc.add_MacroSentimentAnalyzerServicer_to_server(MacroSentimentService(), server)
    server.add_insecure_port('0.0.0.0:50051')
    log.info("Python gRPC engine initialized on port 50051")
    await server.start()
    await server.wait_for_termination()

if __name__ == '__main__':
    log.info("Starting Quantitative AI Engine...")
    log.info("Warming up ML factor clusters...")
    cluster_engine.warmup_engine()
    asyncio.run(serve())