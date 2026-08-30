"use client";

import { useState, useEffect } from "react";

type MacroData = {
  marketStance: string;
  summaryBullets: string[];
  sources: string[];
};

export default function MacroBanner() {
  const [data, setData] = useState<MacroData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    fetch(`${API_URL}/api/macro`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(true);
      });

    return () => controller.abort();
  }, []);

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center space-x-3 h-32 animate-pulse">
        <span className="text-slate-500 font-mono text-xs">LOADING MACRO INTELLIGENCE...</span>
      </div>
    );
  }

  const stanceColor =
    data.marketStance === "BULLISH"
      ? "bg-emerald-950 text-emerald-400 border-emerald-800"
      : data.marketStance === "BEARISH"
      ? "bg-rose-950 text-rose-400 border-rose-800"
      : "bg-amber-950 text-amber-400 border-amber-800";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">☕</span>
          <div>
            <h2 className="text-base font-bold font-mono text-white">Federal Reserve Intelligence</h2>
            <p className="text-xs text-slate-400 font-mono">Live FRED API &amp; Policy Analysis</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${stanceColor}`}>
          {data.marketStance} STANCE
        </span>
      </div>

      <ul className="space-y-2.5 pt-1">
        {data.summaryBullets.map((bullet, index) => (
          <li key={index} className="flex items-start space-x-3 text-slate-300 text-sm leading-relaxed">
            <span className="text-cyan-400 font-bold select-none">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
        <span>Sources: {data.sources?.join(" | ") || "Federal Reserve"}</span>
        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">Java gRPC Gateway</span>
      </div>
    </div>
  );
}