"use client";

import { useState, useEffect } from "react";

type StreamLog = { time: string; score: string; regime: string; };

export default function ShortTermLiquidity() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [score, setScore] = useState<string>("--");
  const [regime, setRegime] = useState<string>("AWAITING DATA");
  const [logs, setLogs] = useState<StreamLog[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    const startStream = () => {
      if (eventSource || document.hidden || !isStreaming) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      eventSource = new EventSource(`${API_URL}/api/stream/liquidity?ticker=SPY`);

      eventSource.onopen = () => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), score: "CONN", regime: "Connected to Gateway" }, ...prev].slice(0, 8));
      };

      eventSource.addEventListener("liquidity", (event) => {
        try {
          const liveData = JSON.parse(event.data);
          setScore(liveData.score);
          setRegime(liveData.regime);
          setLogs(prev => [{ time: new Date().toLocaleTimeString(), score: liveData.score, regime: liveData.regime }, ...prev].slice(0, 8));
        } catch (error) {
          console.error("Failed to parse live liquidity frame:", error);
        }
      });

      eventSource.onerror = () => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), score: "ERR", regime: "Connection Failed" }, ...prev].slice(0, 8));
        eventSource?.close();
        eventSource = null;
      };
    };

    const stopStream = () => { if (eventSource) { eventSource.close(); eventSource = null; } };
    if (isStreaming) startStream(); else stopStream();
    return () => stopStream();
  }, [isStreaming]);

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/10 p-8 lg:p-10 rounded-[2rem] shadow-2xl grid grid-cols-1 lg:grid-cols-2 gap-8">      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-serif text-white tracking-wide">
              Real-Time Liquidity
            </h3>
            <p className="text-[10px] text-white/50 font-mono mt-2 uppercase tracking-[0.1em]">IEX Order-Book Velocity (SPY)</p>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-4 py-2 rounded-full text-[10px] font-mono font-bold tracking-widest transition-all ${
              isStreaming
                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20"
                : "bg-white text-black border border-white hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            }`}
          >
            {isStreaming ? "STOP" : "CONNECT"}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 text-center space-y-4 shadow-xl">
          <p className="text-[10px] font-bold font-mono text-white/50 uppercase tracking-[0.2em]">
            Algorithmic Score
          </p>
          <p className="text-7xl font-serif text-white tracking-wide">
            {score}
            <span className="text-3xl text-white/30 font-serif">/10</span>
          </p>
          <div
            className={`inline-block mt-4 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold border tracking-widest uppercase ${
              regime.includes("ANOMALY")
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                : score !== "--" && parseFloat(score) >= 7.0
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : score !== "--" && parseFloat(score) >= 4.0
                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                : score !== "--"
                ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                : "bg-white/5 text-white/40 border-white/10"
            }`}
          >
            {regime}
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col shadow-xl">
        <div className="border-b border-white/10 pb-4 mb-4 flex justify-between items-center">
          <span className="text-[10px] font-mono text-white/50 uppercase font-bold tracking-[0.2em]">Decision Log</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 tracking-widest">IEX FEED</span>
            <div className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" : "bg-white/20"}`} />
          </div>
        </div>

        <div className="flex-grow space-y-2.5 font-mono text-[10px] overflow-hidden">
          {logs.length === 0 && <p className="text-white/30 tracking-wider">AWAITING EXCHANGE CONNECTION...</p>}
          {logs.map((log, i) => {
            const isAnomaly = log.regime.includes("ANOMALY");
            return (
              <div
                key={i}
                className={`flex justify-between p-2 rounded-lg ${
                  isAnomaly
                    ? "text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20"
                    : "text-emerald-300 bg-black/20 border border-white/5"
                }`}
              >
                <span className="text-white/40 tracking-wider">[{log.time}]</span>
                <span className="font-bold">{log.score}</span>
                <span className="text-white/80 truncate ml-3">{log.regime}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}