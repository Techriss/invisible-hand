"use client";

import { useState, useEffect } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";

type ClusterSummary = {
  clusterId: number;
  themeName: string;
  description: string;
  constituentCount: number;
  averageMomentum: number;
  topTickers: string[];
};

const getDynamicColor = (momentum: number) => {
  const maxIntensity = 0.25; 
  const clamped = Math.max(-maxIntensity, Math.min(maxIntensity, momentum));
  const intensity = Math.abs(clamped) / maxIntensity;
  
  if (clamped > 0) {
    const r = Math.round(148 - (126 * intensity));
    const g = Math.round(163); 
    const b = Math.round(184 - (110 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (clamped < 0) {
    const r = Math.round(148 + (72 * intensity));
    const g = Math.round(163 - (125 * intensity));
    const b = Math.round(184 - (146 * intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgb(148, 163, 184)`;
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, onClick } = props;
  
  const clusterId = props.clusterId ?? 0;
  const rawName = props.themeName ?? props.name ?? "Unknown";
  const momentum = props.averageMomentum ?? props.momentum ?? props.payload?.momentum ?? 0;

  const bgColor = getDynamicColor(momentum);
  if (width <= 0 || height <= 0) return null;

  const words = rawName.split(" ");
  const lineCount = words.length;

  return (
    <g 
      onClick={() => onClick && onClick(props.payload || props)}
      className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
    >
      <rect x={x} y={y} width={width} height={height} fill={bgColor} stroke="#0f172a" strokeWidth={2} />
      
      {width > 85 && height > 45 && (
        <text 
          x={x + width / 2} 
          y={y + height / 2 - ((lineCount - 1) * 6)}
          textAnchor="middle" 
          fill="#ffffff" 
          stroke="none"
          fontSize={10} 
          className="font-bold font-sans uppercase tracking-tight drop-shadow-md" 
        >
          {words.map((word: string, index: number) => (
            <tspan key={index} x={x + width / 2} dy={index === 0 ? 0 : 12}>
              {word}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
};

export default function HiddenSectorHeatmap() {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    fetch(`${API_URL}/api/ml/clusters`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend gateway offline");
        return res.json();
      })
      .then((data) => {
        if (data?.clusters) {
          const sorted = [...data.clusters].sort((a, b) => b.constituentCount - a.constituentCount);
          setClusters(sorted);
          if (sorted.length > 0) setSelectedCluster(sorted[0]);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError("Python Quantitative Clustering Engine warming up (~30s)...");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 text-center font-mono text-sm text-slate-500 animate-pulse h-[500px] flex items-center justify-center">
        [CALCULATING UNSUPERVISED FACTOR CLUSTERS...]
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-800 text-rose-400 font-mono text-xs">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 space-y-6">
      
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">◈</span> AI-GENERATED HIDDEN REGIMES
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sized by constituent volume • Colored by 90-day momentum
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
          K = {clusters.length} SECTORS
        </span>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={clusters}
            dataKey="constituentCount"
            nameKey="themeName"
            aspectRatio={4 / 3}
            stroke="#0f172a"
            isAnimationActive={false}
            content={(props: any) => <CustomizedContent {...props} onClick={setSelectedCluster} />}
          >
            <Tooltip 
              formatter={(value: any, name: any, props: any) => [
                `${((props.payload?.averageMomentum ?? 0) * 100).toFixed(2)}%`, 
                `90D Momentum`
              ]}
              labelFormatter={(label: any, payload: any) => {
                  return payload?.[0]?.payload?.themeName || "Cluster";
              }}
              contentStyle={{ fontFamily: 'monospace', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#020617', color: '#f8fafc' }}
              itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {selectedCluster && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
          <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/60 border border-cyan-900 px-2 py-0.5 rounded">
                  Regime #{selectedCluster.clusterId}
                </span>
                <h4 className="text-base font-bold font-mono text-white">
                  {selectedCluster.themeName}
                </h4>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-sans max-w-4xl mt-2">
                {selectedCluster.description}
              </p>
            </div>
            
            <div className="text-right shrink-0">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Momentum</div>
                <div className={`text-lg font-mono font-bold ${selectedCluster.averageMomentum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {selectedCluster.averageMomentum >= 0 ? "+" : ""}
                    {(selectedCluster.averageMomentum * 100).toFixed(2)}%
                </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-3 tracking-wider">
              Primary Market Anchors (Top {selectedCluster.topTickers.length} by Dollar Volume)
            </span>
            <div className="flex flex-wrap gap-2.5">
              {selectedCluster.topTickers.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono font-bold px-3 py-1.5 rounded-md shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}