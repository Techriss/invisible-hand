"use client";

import { useState, useEffect } from "react";

export default function MidTermStream() {
  const [flows, setFlows] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSector, setActiveSector] = useState("Technology");

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const eventSource = new EventSource(`${API_URL}/api/stream/rotations?sector=${activeSector}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener("rotation", (event) => {
      const alertMessage = event.data; 
      
      setFlows((prevFlows) => {
         return [alertMessage, ...prevFlows].slice(0, 10);
      });
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeSector]);

  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
            <span className="text-cyan-400">🌊</span> LIVE SECTOR FLOW LOG
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">Streaming capital rotation alerts</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={activeSector} 
            onChange={(e) => setActiveSector(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-cyan-300 rounded px-3 py-1.5 text-xs font-mono font-bold outline-hidden focus:border-cyan-500"
          >
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Financials">Financials</option>
          </select>

          <span className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold border ${
            isConnected ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800'
          }`}>
            {isConnected ? "STREAMING 🟢" : "DISCONNECTED 🔴"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {flows.length === 0 && <p className="text-slate-500 font-mono text-xs italic">Waiting for capital flow data...</p>}
        
        {flows.map((flow, idx) => (
          <div key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800/80 flex items-start gap-3">
            <span className="text-cyan-600 font-mono text-xs mt-0.5">&gt;</span>
            <span className="font-mono text-xs text-slate-300 leading-relaxed">
              {flow}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}