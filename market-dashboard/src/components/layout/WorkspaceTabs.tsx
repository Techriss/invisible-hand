"use client";

import React from "react";

type WorkspaceTabsProps = {
  activeTab: "short" | "mid" | "long";
  onTabChange: (tab: "short" | "mid" | "long") => void;
  shortTermContent: React.ReactNode;
  midTermContent: React.ReactNode;
  longTermContent: React.ReactNode;
};

export default function WorkspaceTabs({
  activeTab,
  onTabChange,
  shortTermContent,
  midTermContent,
  longTermContent,
}: WorkspaceTabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          
          <button
            onClick={() => onTabChange("short")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === "short" 
                ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <span>⚡</span>
            <span>SHORT-TERM [MICRO &amp; MACRO]</span>
          </button>

          <button
            onClick={() => onTabChange("mid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === "mid" 
                ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <span>🌐</span>
            <span>MID-TERM [SECTOR REGIMES]</span>
          </button>

          <button
            onClick={() => onTabChange("long")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap ${
              activeTab === "long" 
                ? "bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <span>🏛️</span>
            <span>LONG-TERM [DEEP ASSET INTELLIGENCE]</span>
          </button>
          
        </div>
      </div>

      <div>
        <div className={activeTab === "short" ? "block space-y-6" : "hidden"}>
          {shortTermContent}
        </div>
        {activeTab === "mid" && <div className="space-y-6">{midTermContent}</div>}
        {activeTab === "long" && <div className="space-y-6">{longTermContent}</div>}
      </div>
    </div>
  );
}