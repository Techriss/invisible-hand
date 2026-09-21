"use client";

import { useState, useEffect } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import { getDynamicColor } from "./DynamicHeatmap";

type ClusterSummary = {
  clusterId: number;
  themeName: string;
  description: string;
  constituentCount: number;
  averageMomentum: number;
  topTickers: string[];
};

const CustomizedContent = (props: any) => {
  const { x, y, width, height, onClick, depth } = props;
  
  if (width <= 0 || height <= 0 || depth === 0) return null;

  const rawName = props.themeName ?? props.name ?? "Unknown";
  const momentum = props.averageMomentum ?? props.momentum ?? props.payload?.momentum ?? 0;
  const bgColor = getDynamicColor(momentum, 0.25);

  const words = rawName.split(" ");
  const lineCount = words.length;

  return (
    <g 
      onClick={() => {
        const nodeData = props.payload || props;
        if (onClick && nodeData && nodeData.themeName) {
          onClick(nodeData);
        }
      }}
      className="cursor-pointer transition-opacity duration-300 hover:opacity-80"
    >
      <rect 
        x={x + 2} y={y + 2} 
        width={Math.max(0, width - 4)} height={Math.max(0, height - 4)} 
        fill={bgColor} stroke="rgba(255,255,255,0.15)" strokeWidth={1} rx={12} ry={12} 
      />
      
      {width > 85 && height > 45 && (
        <text 
          x={x + width / 2} y={y + height / 2 - ((lineCount - 1) * 6)}
          textAnchor="middle" fill="#ffffff" stroke="none" fontSize={10} 
          className="font-bold font-mono uppercase tracking-widest drop-shadow-md" 
        >
          {words.map((word: string, index: number) => (
            <tspan key={index} x={x + width / 2} dy={index === 0 ? 0 : 14}>
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
      <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-12 text-center h-[500px] flex items-center justify-center shadow-2xl">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase animate-pulse">
          Calculating Factor Clusters...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 backdrop-blur-md p-6 rounded-[2rem] border border-rose-500/20 text-rose-300 font-mono text-xs tracking-wide">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 space-y-8 shadow-2xl">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 gap-4">
        <div>
          <h3 className="text-2xl font-serif text-white tracking-wide">
            Hidden Market Regimes
          </h3>
          <p className="text-[10px] text-white/50 font-mono mt-2 tracking-[0.1em] uppercase">
            Unsupervised K-Means Clustering • Colored by Momentum
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 tracking-widest">
          K = {clusters.length} SECTORS
        </span>
      </div>

      <div className="w-full h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={clusters}
            dataKey="constituentCount"
            nameKey="themeName"
            aspectRatio={4 / 3}
            fill="transparent"
            stroke="rgba(0,0,0,0.2)"
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
              contentStyle={{ fontFamily: 'monospace', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', backdropFilter: 'blur(10px)' }}
              itemStyle={{ color: '#34d399', fontWeight: 'bold' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {selectedCluster && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-[0.2em] block mb-2">
                Regime #{selectedCluster.clusterId}
              </span>
              <h4 className="text-xl font-serif text-white tracking-wide">
                {selectedCluster.themeName}
              </h4>
              <p className="text-sm text-white/70 font-light leading-relaxed font-sans max-w-4xl mt-3">
                {selectedCluster.description}
              </p>
            </div>
            
            <div className="text-left lg:text-right shrink-0">
                <div className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] mb-1">Momentum</div>
                <div className={`text-3xl font-serif ${selectedCluster.averageMomentum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {selectedCluster.averageMomentum >= 0 ? "+" : ""}
                    {(selectedCluster.averageMomentum * 100).toFixed(2)}%
                </div>
            </div>
          </div>

          <div>
             <span className="text-[10px] font-mono uppercase text-white/50 font-bold block mb-4 tracking-[0.2em]">
              Primary Market Anchors
            </span>
            <div className="flex flex-wrap gap-3">
              {selectedCluster.topTickers.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-white/5 border border-white/10 text-white/90 text-[10px] font-mono tracking-wider px-4 py-2 rounded-lg shadow-sm"
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