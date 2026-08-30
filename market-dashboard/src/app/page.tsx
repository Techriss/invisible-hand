"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import WorkspaceTabs from "@/components/layout/WorkspaceTabs";
import MacroBanner from "@/components/banners/MacroBanner";
import ShortTermLiquidity from "@/components/streams/ShortTermLiquidity";
import SearchTerminal from "@/components/terminal/SearchTerminal";
import Header from "@/components/layout/Header";

const SectorHeatmap = dynamic(() => import("@/components/heatmaps/SectorHeatmap"), { 
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-sm animate-pulse"><span className="text-slate-500 font-mono font-bold">LOADING CHART ENGINE...</span></div>
});

const HiddenSectorHeatmap = dynamic(() => import("@/components/heatmaps/HiddenSectorHeatmap"), { 
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-sm animate-pulse"><span className="text-slate-500 font-mono font-bold">LOADING FACTOR MODELS...</span></div>
});

export default function Home() {
  const [activeTab, setActiveTab] = useState<"short" | "mid" | "long">("mid");
  const [activeTicker, setActiveTicker] = useState("");

  const handleWatchlistSelect = (ticker: string) => {
    setActiveTicker(ticker);
    setActiveTab("long");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      <Header activeTicker={activeTicker} onSelectTicker={handleWatchlistSelect} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <WorkspaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          shortTermContent={
            <>
              <MacroBanner />
              <ShortTermLiquidity />
            </>
          }
          midTermContent={
            <>
              <HiddenSectorHeatmap />
              <SectorHeatmap />
            </>
          }
          longTermContent={
            <SearchTerminal injectedTicker={activeTicker} />
          }
        />
      </main>
    </div>
  );
}