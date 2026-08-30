"use client";

import dynamic from "next/dynamic";

const SectorHeatmap = dynamic(() => import("../heatmaps/SectorHeatmap"), { 
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-sm animate-pulse">
      <span className="text-slate-500 font-mono font-bold">LOADING CHART ENGINE...</span>
    </div>
  )
});

export default function DynamicHeatmap() {
  return <SectorHeatmap />;
}