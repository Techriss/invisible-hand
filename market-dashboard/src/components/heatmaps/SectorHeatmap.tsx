"use client";

import { useState, useEffect } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import { getDynamicColor } from "./DynamicHeatmap";

type SectorData = { name: string; size: number; momentum: number; };

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.momentum >= 0;
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl font-mono z-50">
        <p className="text-white font-bold text-xs mb-2 tracking-widest uppercase">{data.name}</p>
        <div className="space-y-1.5 text-[10px] tracking-widest uppercase">
          <p className="text-white/60">Weight: <span className="text-white font-bold">{data.size}%</span></p>
          <p className="text-white/60">Momentum: <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "+" : ""}{(data.momentum).toFixed(2)}%
          </span></p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, depth } = props;
  if (width <= 0 || height <= 0 || depth === 0) return null;
  const momentum = props.momentum ?? props.payload?.momentum ?? 0;
  const bgColor = getDynamicColor(momentum, 5.0);
  const words = name.split(" ");
  const lineCount = words.length;

  return (
    <g className="transition-opacity duration-300 hover:opacity-80">
      <rect 
        x={x + 2} y={y + 2} width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} 
        fill={bgColor} stroke="rgba(255,255,255,0.15)" strokeWidth={1} rx={12} ry={12} 
      />
      {width > 60 && height > 35 && (
        <text
          x={x + width / 2} y={y + height / 2 - ((lineCount - 1) * 6)} 
          textAnchor="middle" fill="#fff" stroke="none" fontSize={10}
          className="font-bold font-mono uppercase drop-shadow-md tracking-wider"
        >
          {words.map((word: string, index: number) => (
            <tspan key={index} x={x + width / 2} dy={index === 0 ? 0 : 14}>{word}</tspan>
          ))}
        </text>
      )}
    </g>
  );
};

export default function SectorHeatmap({ isActive = true }: { isActive?: boolean }) {
  const [isConnected, setIsConnected] = useState(false);
  const [sectors, setSectors] = useState<SectorData[]>([
    { name: "Technology", size: 30, momentum: 0.0 }, { name: "Financials", size: 15, momentum: 0.0 },
    { name: "Health Care", size: 14, momentum: 0.0 }, { name: "Cons. Disc.", size: 10, momentum: 0.0 },
    { name: "Industrials", size: 8, momentum: 0.0 }, { name: "Comm Svcs", size: 8, momentum: 0.0 },
    { name: "Cons. Staples", size: 6, momentum: 0.0 }, { name: "Energy", size: 4, momentum: 0.0 },
    { name: "Utilities", size: 2, momentum: 0.0 }, { name: "Real Estate", size: 2, momentum: 0.0 },
    { name: "Materials", size: 1, momentum: 0.0 },
  ]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const startStream = () => {
      if (eventSource || document.hidden || !isActive) return;
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      eventSource = new EventSource(`${API_URL}/api/stream/rotations?sector=Market`);
      eventSource.onopen = () => setIsConnected(true);
      eventSource.addEventListener("rotation", (event) => {
        try { setSectors(JSON.parse(event.data)); } catch (error) { console.error(error); }
      });
      eventSource.onerror = () => { setIsConnected(false); eventSource?.close(); eventSource = null; };
    };

    const stopStream = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        setIsConnected(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden || !isActive) stopStream();
      else startStream();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    if (isActive && !document.hidden) startStream();
    else stopStream();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopStream();
    };
  }, [isActive]);

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2rem] shadow-2xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div>
          <h3 className="text-2xl font-serif text-white tracking-wide">
            GICS Sector Rolling Momentum
          </h3>
          <p className="text-[10px] text-white/50 font-mono mt-2 tracking-[0.1em] uppercase">
            Streaming relative capitalization weights &amp; sector performance
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
            Stream
          </span>
          <div 
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected 
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" 
                : "bg-white/20"
            }`} 
          />
        </div>
      </div>

      <div className="w-full h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={sectors} dataKey="size" aspectRatio={4 / 3} fill="transparent" stroke="none" isAnimationActive={false} content={<CustomizedContent />}>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}