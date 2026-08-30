"use client";

import { useState, useEffect } from "react";

type StreamLog = {
  time: string;
  score: string;
  regime: string;
};

export default function ShortTermLiquidity() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [score, setScore] = useState<string>("--");
  const [regime, setRegime] = useState<string>("Awaiting Data...");
  const [logs, setLogs] = useState<StreamLog[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const startStream = () => {
      if (eventSource || document.hidden || !isStreaming) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      eventSource = new EventSource(`${API_URL}/api/stream/liquidity?ticker=SPY`);

      eventSource.onopen = () => {
        setLogs(prev => [
          { time: new Date().toLocaleTimeString(), score: "CONN", regime: "Connected to Gateway" },
          ...prev
        ].slice(0, 8));
      };

      eventSource.addEventListener("liquidity", (event) => {
        try {
          const liveData = JSON.parse(event.data);
          setScore(liveData.score);
          setRegime(liveData.regime);
          setLogs(prev => [
            { time: new Date().toLocaleTimeString(), score: liveData.score, regime: liveData.regime },
            ...prev
          ].slice(0, 8));
        } catch (error) {
          console.error("Failed to parse live liquidity frame:", error);
        }
      });

      eventSource.onerror = () => {
        setLogs(prev => [
          { time: new Date().toLocaleTimeString(), score: "ERR", regime: "Connection Failed (Port 8080)" },
          ...prev
        ].slice(0, 8));
        eventSource?.close();
        eventSource = null;
      };
    };

    const stopStream = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };

    if (isStreaming) startStream();
    else stopStream();

    return () => stopStream();
  }, [isStreaming]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
              <span className="text-cyan-400">⚡</span> REAL-TIME ALPACA LIQUIDITY
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">IEX order-book volume &amp; spread velocity (SPY)</p>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isStreaming
                ? "bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
                : "bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
            }`}
          >
            {isStreaming ? "STOP STREAM ⏹" : "CONNECT ALPACA ▶"}
          </button>
        </div>

        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center space-y-2">
          <p className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
            Liquidity Metric Score
          </p>
          <p className="text-6xl font-mono font-black text-white">
            {score}
            <span className="text-2xl text-slate-500 font-medium">/10</span>
          </p>
          <div
            className={`inline-block mt-4 px-4 py-2 rounded-lg text-xs font-mono font-bold border ${
              regime.includes("ANOMALY")
                ? "bg-rose-950 text-rose-300 border-rose-700 animate-pulse"
                : score !== "--" && parseFloat(score) >= 7.0
                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                : score !== "--" && parseFloat(score) >= 4.0
                ? "bg-amber-950 text-amber-300 border-amber-800"
                : score !== "--"
                ? "bg-rose-950 text-rose-300 border-rose-800"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {regime}
          </div>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
        <div className="border-b border-slate-800 pb-2 mb-2 flex justify-between items-center">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold">Algo Decision Log</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500">IEX FEED</span>
            <div className={`h-2 w-2 rounded-full ${isStreaming ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
          </div>
        </div>

        <div className="flex-grow space-y-1.5 font-mono text-xs overflow-hidden py-2">
          {logs.length === 0 && <p className="text-slate-600 italic">Awaiting exchange connection...</p>}
          {logs.map((log, i) => {
            const isAnomaly = log.regime.includes("ANOMALY");
            return (
              <div
                key={i}
                className={`flex justify-between p-1 rounded ${
                  isAnomaly
                    ? "text-rose-300 font-bold bg-rose-950/60 border border-rose-800"
                    : "text-emerald-400 bg-slate-900/40"
                }`}
              >
                <span className="text-slate-500">[{log.time}]</span>
                <span className="font-bold">{log.score}</span>
                <span className="text-cyan-400 truncate ml-2">{log.regime}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}