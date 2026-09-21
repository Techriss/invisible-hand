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
      <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 h-40 shadow-2xl flex items-center justify-center animate-pulse">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
          Loading Macro Intelligence...
        </span>
      </div>
    );
  }

  const stanceColor =
    data.marketStance === "BULLISH"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : data.marketStance === "BEARISH"
      ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
      : "bg-amber-500/10 text-amber-300 border-amber-500/20";

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 space-y-6 shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white tracking-wide">Federal Reserve Intelligence</h2>
          <p className="text-[10px] text-white/50 font-mono mt-2 uppercase tracking-[0.1em]">Live FRED API &amp; Policy Analysis</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border tracking-widest ${stanceColor}`}>
          {data.marketStance} STANCE
        </span>
      </div>

      <ul className="space-y-4 pt-2">
        {data.summaryBullets.map((bullet, index) => (
          <li key={index} className="flex items-start gap-4 text-white/80 text-sm leading-relaxed font-light">
            <span className="text-white/30 font-serif pt-1">—</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="pt-6 border-t border-white/5 flex text-[10px] font-mono text-white/40 tracking-widest uppercase">
        <span>Sources: {data.sources?.join(" | ")}</span>
      </div>
    </div>
  );
}