"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MacroBanner from "@/components/banners/MacroBanner";
import ShortTermLiquidity from "@/components/streams/ShortTermLiquidity";
import SearchTerminal from "@/components/terminal/SearchTerminal";

const SectorHeatmap = dynamic(() => import("@/components/heatmaps/SectorHeatmap"), { ssr: false });
const HiddenSectorHeatmap = dynamic(() => import("@/components/heatmaps/HiddenSectorHeatmap"), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState<"short" | "mid" | "long">("mid");
  const [activeTicker, setActiveTicker] = useState("");

  const handleWatchlistSelect = (ticker: string) => {
    setActiveTicker(ticker);
    setActiveTab("long");
  };

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row p-4 lg:p-6 gap-6 overflow-hidden">
      
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto no-scrollbar pb-10">
        
        <Header activeTicker={activeTicker} onSelectTicker={handleWatchlistSelect} />

        <div className="flex-1 mt-6 relative">
          <div className={activeTab === "short" ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 block" : "hidden"}>
            <MacroBanner />
            <ShortTermLiquidity />
          </div>

          <div className={activeTab === "mid" ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 block" : "hidden"}>
            <HiddenSectorHeatmap />
            <SectorHeatmap isActive={activeTab === "mid"} />
          </div>

          <div className={activeTab === "long" ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 block" : "hidden"}>
            <SearchTerminal 
              injectedTicker={activeTicker} 
              onSearch={(searchedTicker) => setActiveTicker(searchedTicker)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}