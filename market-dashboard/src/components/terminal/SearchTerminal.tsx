"use client";

import React, { useEffect, useState } from "react";

type KeyOpportunity = { description?: string; convictionScore?: number; timeframe?: string; };
type RiskFactor = { description?: string; riskDescription?: string; severityScore?: number; date?: string; timestamp?: string; };
type PeerDto = { ticker: string; companyName?: string; performanceSpread: number; };
type RelativeValueData = { targetTicker: string; targetName?: string; clusterId: number; themeName?: string; clusterAverageReturn: number; outperformers?: PeerDto[]; laggards?: PeerDto[]; };
type AnalysisData = { ticker: string; executiveSummary: string; bullCase: string; bearCase: string; keyRisks: RiskFactor[]; keyOpportunities: KeyOpportunity[]; sources: string[]; hypeIndex: number; grahamNumber: number; marginOfSafety: number; altmanZScore: number; altmanZStatus: string; };

function SentimentGauge({ score = 0 }: { score: number }) {
  const clampedScore = Math.max(-1.0, Math.min(1.0, score));
  const rotationAngle = clampedScore * 90;

  const getSentimentMeta = (val: number) => {
    if (val >= 0.5) return { label: "EXTREME BULL", color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30" };
    if (val >= 0.15) return { label: "BULLISH BIAS", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (val <= -0.5) return { label: "EXTREME BEAR", color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/30" };
    if (val <= -0.15) return { label: "BEARISH BIAS", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "NEUTRAL", color: "text-white/60", bg: "bg-white/5", border: "border-white/10" };
  };

  const meta = getSentimentMeta(clampedScore);
  const formattedScore = clampedScore > 0 ? `+${clampedScore.toFixed(3)}` : clampedScore.toFixed(3);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-between backdrop-blur-md">
      <div className="w-full flex justify-between items-center pb-3 border-b border-white/10">
        <span className="text-xs font-sans font-bold tracking-[0.2em] text-white/70 uppercase">
          Neural Sentiment
        </span>
        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
          {meta.label}
        </span>
      </div>

      <div className="relative w-48 h-24 mt-6 overflow-hidden flex items-end justify-center">
        <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="12" strokeLinecap="round" />
          <g style={{ transform: `rotate(${rotationAngle}deg)`, transformOrigin: "100px 100px", transition: "transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <polygon points="98,100 102,100 100,20" fill="#ffffff" opacity="0.9" />
            <circle cx="100" cy="100" r="6" fill="#ffffff" />
          </g>
        </svg>
      </div>

      <div className="w-full flex justify-between text-[10px] font-mono text-white/40 px-2 mt-4">
        <span>-1.0</span>
        <span className="font-bold text-lg text-white font-mono">{formattedScore}</span>
        <span>+1.0</span>
      </div>
    </div>
  );
}

const LOADING_STAGES = [
  "Initializing gRPC channel...",
  "Querying SEC Edgar database...",
  "Calculating Graham & Altman forensic metrics...",
  "Evaluating FinBERT neural sentiment...",
  "Generating institutional LLM synthesis..."
];

export default function SearchTerminal({ 
  injectedTicker = "", 
  onSearch 
}: { 
  injectedTicker?: string;
  onSearch?: (ticker: string) => void; 
}) {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [relValue, setRelValue] = useState<RelativeValueData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (injectedTicker && injectedTicker !== ticker) {
      setTicker(injectedTicker);
      runAnalysis(injectedTicker);
    }
  }, [injectedTicker]);

  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const timers = [
      setTimeout(() => setLoadingStep(1), 600),
      setTimeout(() => setLoadingStep(2), 1800),
      setTimeout(() => setLoadingStep(3), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const runAnalysis = async (target: string) => {
    if (!target) return;
    setLoading(true);
    setError("");
    setData(null);
    setRelValue(null);
    const sym = target.toUpperCase().trim();

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const [reportRes, mlRes] = await Promise.all([
        fetch(`${API_URL}/api/analyze?ticker=${sym}`),
        fetch(`${API_URL}/api/ml/relative-value?ticker=${sym}`),
      ]);
      
      if (!reportRes.ok) throw new Error("Failed to fetch fundamental report.");
      
      const [reportData, mlData] = await Promise.all([
        reportRes.json(),
        mlRes.ok ? mlRes.json() : null
      ]);

      setLoadingStep(4); 
      
      setTimeout(() => {
        setData(reportData);
        if (mlData) setRelValue(mlData);
        setLoading(false);
      }, 500);

    } catch {
      setError("Failed to generate complete intelligence. Check backend gateways.");
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicker = ticker.toUpperCase().trim();
    
    if (onSearch) {
      onSearch(cleanTicker);
    }
    
    runAnalysis(cleanTicker);
  };

  const safeRisks = data?.keyRisks || [];
  const safeOpps = data?.keyOpportunities || [];
  const hypeScore = data?.hypeIndex ?? 0.0;

  return (
    <div className="space-y-8">
      
      <form onSubmit={handleSearch} className="flex gap-4">
        <input
          type="text"
          placeholder="ENTER TICKER..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="flex-1 bg-black/20 backdrop-blur-xl border border-white/10 focus:border-white/30 text-white rounded-[2rem] px-8 py-5 font-mono text-sm uppercase tracking-widest transition-all placeholder:text-white/30 outline-hidden shadow-2xl"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-mono font-bold px-10 py-5 rounded-[2rem] shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:bg-white/10 disabled:text-white/30 transition-all text-xs uppercase tracking-[0.2em]"
        >
          {loading ? "Processing" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="bg-rose-500/10 backdrop-blur-md text-rose-200 p-6 rounded-[2rem] border border-rose-500/20 font-mono text-xs tracking-wide">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-black/20 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-8 h-[500px] shadow-2xl">
           <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute w-full h-full border-[3px] border-white/10 rounded-full"></div>
            <div className="absolute w-full h-full border-[3px] border-white rounded-full border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center space-y-3">
            <h4 className="text-white/80 font-serif text-xl tracking-wide">Synthesizing Data</h4>
            <p className="text-white/50 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">
              {LOADING_STAGES[loadingStep]}
            </p>
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 space-y-10 shadow-2xl">
          
          <div className="border-b border-white/10 pb-8">
            
            <div className="flex flex-col gap-3 mb-8">
              {relValue?.targetName && (
                <h2 className="text-5xl md:text-6xl font-serif text-white tracking-wide drop-shadow-md">
                  {relValue.targetName}
                </h2>
              )}

              <div className="flex items-center gap-4">
                <h3 className="text-lg md:text-xl font-sans text-white/60 tracking-wide font-medium">
                  {data.ticker}
                </h3>
              </div>
              
            </div>
            
            <div className="bg-black/20 border border-white/10 p-6 rounded-2xl shadow-inner">
              <p className="text-sm md:text-base font-sans text-white/80 leading-relaxed font-light">
                {data.executiveSummary}
              </p>
            </div>
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SentimentGauge score={hypeScore} />

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center justify-between backdrop-blur-md">
              <div className="border-b border-white/10 pb-3 w-full">
                <span className="text-xs font-sans font-bold text-white/70 uppercase tracking-[0.2em] block">
                  Intrinsic Value
                </span>
                <span className="text-[10px] font-mono text-white/30 tracking-wide mt-1 block">
                  Graham Formula (Defensive Floor)
                </span>
              </div>
              <div className="my-6 flex flex-col items-center">
                <div className="text-4xl font-serif text-white tracking-wide">
                  ${(data.grahamNumber || 0).toFixed(2)}
                </div>
                {(() => {
                  const mos = (data.marginOfSafety || 0) * 100;
                  const isDiscount = mos > 0;
                  return (
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border tracking-wider ${
                          isDiscount ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                        }`}>
                        {isDiscount ? `${mos.toFixed(1)}% DISCOUNT` : `${Math.abs(mos).toFixed(1)}% PREMIUM`}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center justify-between backdrop-blur-md">
              <div className="border-b border-white/10 pb-3 w-full">
                <span className="text-xs font-sans font-bold text-white/70 uppercase tracking-[0.2em] block">
                  Forensic Solvency
                </span>
                <span className="text-[10px] font-mono text-white/30 tracking-wide mt-1 block">
                  Altman Z-Score Model
                </span>
              </div>
              <div className="my-6 flex flex-col items-center">
                <div className="text-4xl font-serif text-white tracking-wide">
                  {(data.altmanZScore || 0).toFixed(2)}
                </div>
                {(() => {
                  const status = data.altmanZStatus || "UNKNOWN";
                  let style = "bg-white/5 text-white/50 border-white/10";
                  if (status === "SAFE") style = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                  else if (status === "WARNING") style = "bg-amber-500/10 text-amber-300 border-amber-500/20";
                  else if (status === "DISTRESS") style = "bg-rose-500/10 text-rose-300 border-rose-500/20";
                  return (
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border tracking-wider ${style}`}>
                        {status} ZONE
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 backdrop-blur-md border border-emerald-500/20 p-8 rounded-[2rem] shadow-2xl">
              <h4 className="text-emerald-400 font-serif text-xl mb-4 tracking-wide">
                The Bull Thesis
              </h4>
              <p className="text-sm text-white/80 leading-relaxed font-sans font-light">
                {data.bullCase}
              </p>
            </div>

            <div className="bg-rose-500/5 backdrop-blur-md border border-rose-500/20 p-8 rounded-[2rem] shadow-2xl">
              <h4 className="text-rose-400 font-serif text-xl mb-4 tracking-wide">
                The Bear Thesis
              </h4>
              <p className="text-sm text-white/80 leading-relaxed font-sans font-light">
                {data.bearCase}
              </p>
            </div>
          </div>

          {relValue && relValue.clusterId !== -1 && (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-4 gap-4">
                <div>
                  <h4 className="text-lg font-serif text-white tracking-wide">
                    {relValue.themeName || "Mathematical Cluster Divergence"}
                  </h4>
                  <p className="text-[10px] text-white/50 mt-2 font-mono uppercase tracking-widest">
                    Target: <span className="text-white">{relValue.targetName || relValue.targetTicker}</span> • Cluster Avg: {(relValue.clusterAverageReturn * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-left md:text-right font-mono">
                  <span className="text-[10px] text-white/40 block uppercase tracking-widest">Regime ID</span>
                  <span className="text-sm font-bold text-white">#{relValue.clusterId}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-mono uppercase text-white/40 font-bold block mb-4 tracking-widest">
                    Top Outperforming Peers
                  </span>
                  <div className="space-y-3">
                    {relValue.outperformers?.map((peer, idx) => (
                      <div key={`out-${idx}`} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
                        <div>
                          <span className="font-mono font-bold text-xs text-white block truncate">{peer.ticker}</span>
                          <span className="text-[10px] font-mono text-white/40 block truncate mt-0.5">{peer.companyName}</span>
                        </div>
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          +{(peer.performanceSpread * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-white/40 font-bold block mb-4 tracking-widest">
                    Top Lagging Peers
                  </span>
                  <div className="space-y-3">
                    {relValue.laggards?.map((peer, idx) => (
                      <div key={`lag-${idx}`} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center shadow-lg">
                        <div>
                          <span className="font-mono font-bold text-xs text-white block truncate">{peer.ticker}</span>
                          <span className="text-[10px] font-mono text-white/40 block truncate mt-0.5">{peer.companyName}</span>
                        </div>
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                          {(peer.performanceSpread * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <h4 className="font-mono font-bold text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-3">
                Structural Moats &amp; Catalysts
              </h4>
              {safeOpps.map((opp: KeyOpportunity, idx: number) => {
                const score = opp.convictionScore || 0;
                return (
                  <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between text-xs items-start font-mono gap-4">
                      <span className="text-white/80 font-sans font-light leading-relaxed">{opp.description || "Catalyst"}</span>
                      <span className="text-emerald-400 font-bold shrink-0">{Number(score).toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div className="h-1 bg-emerald-400 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <h4 className="font-mono font-bold text-[10px] text-white/50 uppercase tracking-widest border-b border-white/10 pb-3">
                Critical Risk Factors
              </h4>
              {safeRisks.map((risk: RiskFactor, idx: number) => {
                const score = risk.severityScore || 0;
                return (
                  <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between text-xs items-start font-mono gap-4">
                      <span className="text-white/80 font-sans font-light leading-relaxed">{risk.description || "Risk"}</span>
                      <span className="text-rose-400 font-bold shrink-0">{Number(score).toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${score >= 7 ? "bg-rose-500" : score >= 4 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}