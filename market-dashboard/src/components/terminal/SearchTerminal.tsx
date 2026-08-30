"use client";

import React, { useEffect, useState } from "react";

type KeyOpportunity = {
  description?: string;
  convictionScore?: number;
  timeframe?: string;
};

type RiskFactor = {
  description?: string;
  riskDescription?: string;
  severityScore?: number;
  date?: string;
  timestamp?: string;
};

type PeerDto = {
  ticker: string;
  companyName?: string;
  performanceSpread: number;
};

type RelativeValueData = {
  targetTicker: string;
  targetName?: string;
  clusterId: number;
  themeName?: string;
  clusterAverageReturn: number;
  outperformers?: PeerDto[];
  laggards?: PeerDto[];
};

type AnalysisData = {
  ticker: string;
  executiveSummary: string;
  bullCase: string;
  bearCase: string;
  keyRisks: RiskFactor[];
  keyOpportunities: KeyOpportunity[];
  sources: string[];
  hypeIndex: number;
  grahamNumber: number;
  marginOfSafety: number;
  altmanZScore: number;
  altmanZStatus: string;
};

function SentimentGauge({ score = 0 }: { score: number }) {
  const clampedScore = Math.max(-1.0, Math.min(1.0, score));
  const rotationAngle = clampedScore * 90;

  const getSentimentMeta = (val: number) => {
    if (val >= 0.5) return { label: "EXTREME BULLISH HYPE", color: "text-emerald-400", bg: "bg-emerald-950", border: "border-emerald-800" };
    if (val >= 0.15) return { label: "BULLISH BIAS", color: "text-emerald-300", bg: "bg-emerald-950/60", border: "border-emerald-900" };
    if (val <= -0.5) return { label: "EXTREME BEARISH DRAG", color: "text-rose-400", bg: "bg-rose-950", border: "border-rose-800" };
    if (val <= -0.15) return { label: "BEARISH HEADWINDS", color: "text-amber-400", bg: "bg-amber-950", border: "border-amber-800" };
    return { label: "NEUTRAL CONSENSUS", color: "text-slate-400", bg: "bg-slate-800", border: "border-slate-700" };
  };

  const meta = getSentimentMeta(clampedScore);
  const formattedScore = clampedScore > 0 ? `+${clampedScore.toFixed(3)}` : clampedScore.toFixed(3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col items-center justify-between">
      <div className="w-full flex justify-between items-center pb-2 border-b border-slate-800">
        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
          FinBERT Sentiment Index
        </span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${meta.bg} ${meta.color} ${meta.border}`}>
          {meta.label}
        </span>
      </div>

      <div className="relative w-48 h-24 mt-4 overflow-hidden flex items-end justify-center">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="30%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="18" strokeLinecap="round" />
          <circle cx="100" cy="100" r="8" fill="#0f172a" />
          <g
            style={{
              transform: `rotate(${rotationAngle}deg)`,
              transformOrigin: "100px 100px",
              transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <polygon points="97,100 103,100 100,28" fill="#38bdf8" />
            <circle cx="100" cy="100" r="4" fill="#ffffff" />
          </g>
        </svg>
      </div>

      <div className="w-full flex justify-between text-[10px] font-mono text-slate-500 px-2 mt-1">
        <span>-1.0 (FEAR)</span>
        <span className="font-bold text-sm text-cyan-400 font-mono">{formattedScore}</span>
        <span>+1.0 (HYPE)</span>
      </div>
    </div>
  );
}

const LOADING_STAGES = [
  "Initializing gRPC channel...",
  "Querying SEC Edgar database...",
  "Calculating Graham & Altman forensic metrics...",
  "Executing unsupervised PCA clustering...",
  "Evaluating FinBERT neural sentiment...",
  "Generating institutional LLM synthesis..."
];

export default function SearchTerminal({ injectedTicker = "" }: { injectedTicker?: string }) {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [relValue, setRelValue] = useState<RelativeValueData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (injectedTicker) {
      setTicker(injectedTicker);
      runAnalysis(injectedTicker);
    }
  }, [injectedTicker]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
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
      setData(await reportRes.json());
      if (mlRes.ok) setRelValue(await mlRes.json());
    } catch {
      setError("Failed to generate complete intelligence. Check backend gateways.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(ticker);
  };

  const safeRisks = data?.keyRisks || [];
  const safeOpps = data?.keyOpportunities || [];
  const hypeScore = data?.hypeIndex ?? 0.0;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          placeholder="ENTER TICKER (E.G. NVDA, AAPL, TSLA)..."
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white rounded-xl px-5 py-3.5 font-mono text-base uppercase transition-all placeholder:text-slate-600 outline-hidden"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-cyan-950/40 disabled:bg-slate-800 disabled:text-slate-600 transition-all text-xs uppercase"
        >
          {loading ? "PROCESSING..." : "RUN ANALYSIS"}
        </button>
      </form>

      {error && (
        <div className="bg-rose-950/40 text-rose-300 p-4 rounded-xl border border-rose-800 font-mono text-xs">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6 h-[400px]">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute w-full h-full border-4 border-slate-800 rounded-full"></div>
            <div className="absolute w-full h-full border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            <span className="font-mono text-xs font-bold text-cyan-400">AI</span>
          </div>
          
          <div className="text-center space-y-2">
            <h4 className="text-white font-mono font-bold text-sm tracking-widest uppercase">
              Quantum Intelligence Pipeline
            </h4>
            <p className="text-cyan-400 font-mono text-xs animate-pulse">
              &gt; {LOADING_STAGES[loadingStep]}
            </p>
          </div>

          <div className="w-64 bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500 ease-out"
              style={{ width: `${((loadingStep + 1) / LOADING_STAGES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold font-mono text-white">
              {data.executiveSummary}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SentimentGauge score={hypeScore} />

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Graham Intrinsic Value
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  Defensive Floor via &radic;(22.5 &times; EPS &times; BVPS)
                </span>
              </div>

              <div className="my-2">
                <div className="text-3xl font-mono font-bold text-white">
                  ${(data.grahamNumber || 0).toFixed(2)}
                </div>
                {(() => {
                  const mos = (data.marginOfSafety || 0) * 100;
                  const isDiscount = mos > 0;
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          isDiscount
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-rose-950 text-rose-400 border-rose-800"
                        }`}
                      >
                        {isDiscount ? `${mos.toFixed(1)}% DISCOUNT` : `${Math.abs(mos).toFixed(1)}% PREMIUM`}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">VS MARKET PRICE</span>
                    </div>
                  );
                })()}
              </div>

              <div className="text-[10px] font-mono text-slate-500">Intelligent Investor Standard</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Forensic Solvency (Altman Z)
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  24-Month Probability of Insolvency
                </span>
              </div>

              <div className="my-2">
                <div className="text-3xl font-mono font-bold text-white">
                  {(data.altmanZScore || 0).toFixed(2)}
                </div>
                {(() => {
                  const status = data.altmanZStatus || "UNKNOWN";
                  let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";
                  if (status === "SAFE") badgeStyle = "bg-emerald-950 text-emerald-400 border-emerald-800";
                  else if (status === "WARNING") badgeStyle = "bg-amber-950 text-amber-400 border-amber-800";
                  else if (status === "DISTRESS") badgeStyle = "bg-rose-950 text-rose-400 border-rose-800";

                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${badgeStyle}`}>
                        {status} ZONE
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="text-[10px] font-mono text-slate-500">&gt;3.0 Safe &bull; &lt;1.8 Distress</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-emerald-950/20 border border-emerald-900/60 p-5 rounded-xl">
              <h4 className="text-emerald-400 font-mono font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                <span>🚀</span> Bull Case Thesis
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {data.bullCase}
              </p>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/60 p-5 rounded-xl">
              <h4 className="text-rose-400 font-mono font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                <span>⚠️</span> Bear Case Thesis
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {data.bearCase}
              </p>
            </div>
          </div>

          {relValue && relValue.clusterId !== -1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                    <span>◈</span> {relValue.themeName || "MATHEMATICAL CLUSTER DIVERGENCE"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Target: <span className="text-white font-bold">{relValue.targetName || relValue.targetTicker}</span> &bull; Cluster Avg Momentum: {(relValue.clusterAverageReturn * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block uppercase">Regime ID</span>
                  <span className="text-xs font-bold text-white">#{relValue.clusterId}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-2 tracking-wider">
                    Top Outperforming Peers (Short Bias)
                  </span>
                  <div className="space-y-2">
                    {relValue.outperformers?.map((peer, idx) => (
                      <div key={`out-${idx}`} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-xs text-white">{peer.ticker}</span>
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]">{peer.companyName}</span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          +{(peer.performanceSpread * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block mb-2 tracking-wider">
                    Top Lagging Peers (Long Bias)
                  </span>
                  <div className="space-y-2">
                    {relValue.laggards?.map((peer, idx) => (
                      <div key={`lag-${idx}`} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-xs text-white">{peer.ticker}</span>
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[180px]">{peer.companyName}</span>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                          {(peer.performanceSpread * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            <div className="space-y-3">
              <h4 className="font-mono font-bold text-xs text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                ⚡ Structural Moats &amp; Catalysts
              </h4>
              {safeOpps.map((opp: KeyOpportunity, idx: number) => {
                const score = opp.convictionScore || 0;
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-xs items-baseline font-mono">
                      <span className="text-slate-200">{opp.description || "Catalyst"}</span>
                      <span className="text-cyan-400 font-bold ml-2">{Number(score).toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div className="h-1 bg-cyan-400 rounded-full" style={{ width: `${(score / 10) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="font-mono font-bold text-xs text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                🛡️ Critical Risk Factors
              </h4>
              {safeRisks.map((risk: RiskFactor, idx: number) => {
                const score = risk.severityScore || 0;
                return (
                  <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-xs items-baseline font-mono">
                      <span className="text-slate-200">{risk.description || "Risk"}</span>
                      <span className="text-rose-400 font-bold ml-2">{Number(score).toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1">
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