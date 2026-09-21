"use client";

import React, { useState, useEffect } from "react";

type HeaderProps = {
  activeTicker?: string;
  onSelectTicker?: (ticker: string) => void;
};

const DEFAULT_WATCHLIST = ["TSLA", "AAPL", "GOOG", "MSFT", "NVDA"];

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
      try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("quantum_watchlist", JSON.stringify(watchlist));
  }, [watchlist, mounted]);

  const handleAddTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (clean && !watchlist.includes(clean)) setWatchlist([...watchlist, clean]);
    setNewTicker("");
  };

  const handleRemoveTicker = (target: string) => {
    setWatchlist(watchlist.filter((t) => t !== target));
  };

  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center py-4 px-2 gap-6 shrink-0 z-40">
      
      <div className="flex items-center gap-4 shrink-0 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">Gateway</span>
        <div 
          className={`w-2.5 h-2.5 rounded-full ${
            gatewayLive 
              ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" 
              : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
          }`} 
        />
      </div>

      <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-5 py-2 shadow-xl w-full xl:w-auto overflow-x-auto no-scrollbar">
        
        <div className="flex items-center gap-3 shrink-0 border-r border-white/10 pr-5">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">Watchlist</span>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
              isEditing ? "text-cyan-400 font-bold" : "text-white/40 hover:text-white"
            }`}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mounted && watchlist.map((symbol) => (
            <div
              key={symbol}
              onClick={() => !isEditing && onSelectTicker && onSelectTicker(symbol)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all ${
                activeTicker === symbol && !isEditing
                  ? "bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer"
                  : "bg-white/5 text-white/60 border border-white/5"
              } ${!isEditing ? "hover:text-white hover:bg-white/10 cursor-pointer" : ""}`}
            >
              <span>{symbol}</span>
              {isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveTicker(symbol); }}
                  className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 hover:text-rose-100 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold transition-colors ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {mounted && isEditing && (
            <form onSubmit={handleAddTicker} className="flex items-center ml-2">
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
                placeholder="+ ADD"
                className="w-20 bg-white/10 border border-white/20 focus:border-cyan-400 text-cyan-300 rounded-full px-3 py-1.5 text-xs font-mono outline-none placeholder:text-white/40 uppercase transition-colors"
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