"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

type HeaderProps = {
  activeTicker?: string;
  onSelectTicker?: (ticker: string) => void;
};

const DEFAULT_WATCHLIST = ["SPY", "QQQ", "NVDA", "AAPL", "TSLA"];

export default function Header({ activeTicker, onSelectTicker }: HeaderProps) {
  const [gatewayLive, setGatewayLive] = useState(false);
  
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [isEditing, setIsEditing] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const res = await fetch(`${API_URL}/api/health`);
        setGatewayLive(res.ok);
      } catch {
        setGatewayLive(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("quantum_watchlist");
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse watchlist from local storage");
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("quantum_watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist, mounted]);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (clean && !watchlist.includes(clean)) {
      setWatchlist([...watchlist, clean]);
    }
    setNewTicker("");
  };

  const handleRemoveTicker = (target: string) => {
    setWatchlist(watchlist.filter((t) => t !== target));
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 relative flex-shrink-0 rounded-full overflow-hidden border border-slate-800 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <Image 
            src="/logo.png" 
            alt="Invisible Hand Logo" 
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono font-bold text-sm text-white tracking-wider uppercase">
              QUANTUM TERMINAL
            </h1>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                gatewayLive
                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/80"
                  : "text-rose-400 bg-rose-950/60 border-rose-800/80"
              }`}
            >
              GATEWAY: 8080 {gatewayLive ? "🟢" : "🔴"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Unsupervised ML &bull; Neural NLP &bull; Factor Regimes
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
        <div className="flex items-center gap-2 px-2 border-r border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Watchlist:</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
              isEditing ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {isEditing ? "DONE" : "EDIT"}
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto max-w-[50vw] sm:max-w-none no-scrollbar">
          {mounted && watchlist.map((symbol) => {
            const isSelected = activeTicker === symbol;
            return (
              <div key={symbol} className="relative group flex items-center">
                <button
                  onClick={() => !isEditing && onSelectTicker && onSelectTicker(symbol)}
                  disabled={isEditing}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    isSelected && !isEditing
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  } ${isEditing ? "opacity-70 cursor-default" : ""}`}
                >
                  {symbol}
                </button>
                
                {isEditing && (
                  <button
                    onClick={() => handleRemoveTicker(symbol)}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold shadow-md hover:bg-rose-400 z-10"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {mounted && isEditing && (
            <form onSubmit={handleAddTicker} className="flex items-center ml-1">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="ADD..."
                className="w-16 bg-slate-950 border border-slate-700 focus:border-cyan-500 text-cyan-300 rounded px-2 py-1 text-xs font-mono outline-hidden placeholder:text-slate-600 uppercase"
                maxLength={5}
              />
              <button type="submit" className="hidden">Submit</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}