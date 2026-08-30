"use client";

import { useState, useEffect } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";

type SectorData = {
  name: string;
  size: number;
  momentum: number;
};

const getDynamicColor = (momentum: number) => {
  const maxIntensity = 5.0;
  const clamped = Math.max(-maxIntensity, Math.min(maxIntensity, momentum));
  const intensity = Math.abs(clamped) / maxIntensity;

  if (clamped > 0) {
    const r = Math.round(148 - 126 * intensity);
    const g = Math.round(163);
    const b = Math.round(184 - 110 * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (clamped < 0) {
    const r = Math.round(148 + 72 * intensity);
    const g = Math.round(163 - 125 * intensity);
    const b = Math.round(184 - 146 * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgb(148, 163, 184)`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.momentum >= 0;
    
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl font-mono z-50">
        <p className="text-white font-bold text-sm mb-1.5 uppercase">{data.name}</p>
        <div className="space-y-1">
          <p className="text-slate-400 text-xs">Weight: <span className="text-cyan-400 font-bold">{data.size}%</span></p>
          <p className="text-slate-400 text-xs">Momentum: <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "+" : ""}{(data.momentum).toFixed(2)}%
          </span></p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name } = props;
  const momentum = props.momentum ?? props.payload?.momentum ?? 0;
  const bgColor = getDynamicColor(momentum);

  if (width < 0 || height < 0) return null;

  const words = name.split(" ");
  const lineCount = words.length;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        stroke="#0f172a"
        strokeWidth={2}
      />
      {width > 60 && height > 35 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - ((lineCount - 1) * 6)}
          textAnchor="middle"
          fill="#fff"
          stroke="none"
          fontSize={11}
          className="font-bold font-mono uppercase drop-shadow-sm"
        >
          {words.map((word: string, index: number) => (
            <tspan key={index} x={x + width / 2} dy={index === 0 ? 0 : 13}>
              {word}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
};

export default function SectorHeatmap() {
  const [isConnected, setIsConnected] = useState(false);
  const [sectors, setSectors] = useState<SectorData[]>([
    { name: "Technology", size: 30, momentum: 0.0 },
    { name: "Financials", size: 15, momentum: 0.0 },
    { name: "Health Care", size: 14, momentum: 0.0 },
    { name: "Cons. Disc.", size: 10, momentum: 0.0 },
    { name: "Industrials", size: 8, momentum: 0.0 },
    { name: "Comm Svcs", size: 8, momentum: 0.0 },
    { name: "Cons. Staples", size: 6, momentum: 0.0 },
    { name: "Energy", size: 4, momentum: 0.0 },
    { name: "Utilities", size: 2, momentum: 0.0 },
    { name: "Real Estate", size: 2, momentum: 0.0 },
    { name: "Materials", size: 1, momentum: 0.0 },
  ]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    const startStream = () => {
      if (eventSource || document.hidden) return;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      eventSource = new EventSource(`${API_URL}/api/stream/rotations?sector=Market`);
      eventSource.onopen = () => setIsConnected(true);
      eventSource.addEventListener("rotation", (event) => {
        try {
          setSectors(JSON.parse(event.data));
        } catch (error) {
          console.error("Failed to parse incoming heatmap frame:", error);
        }
      });
      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        eventSource = null;
      };
    };

    const stopStream = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        setIsConnected(false);
      }
    };

    startStream();
    return () => stopStream();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">◈</span> GICS SECTOR ROLLING MOMENTUM
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Streaming relative capitalization weights &amp; sector performance
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isConnected
              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {isConnected ? "STREAMING 🟢" : "STANDBY ⏸️"}
        </span>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={sectors}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#0f172a"
            isAnimationActive={false}
            content={<CustomizedContent />}
          >
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}