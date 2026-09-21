"use client";

import Image from "next/image";
import { Landmark, Component, Activity } from "lucide-react";

type SidebarProps = {
  activeTab: "short" | "mid" | "long";
  onTabChange: (tab: "short" | "mid" | "long") => void;
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "long", label: "LONG-TERM", icon: Landmark },
    { id: "mid", label: "MID-TERM", icon: Component },
    { id: "short", label: "SHORT-TERM", icon: Activity },
  ] as const;

  return (
    <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-6 lg:gap-10 bg-black/20 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-5 lg:p-8 lg:h-full shadow-2xl z-50">
      
      <div className="flex items-center justify-center gap-4 w-full">
        <div className="h-10 w-10 lg:h-12 lg:w-12 relative flex-shrink-0">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </div>
        <h1 className="font-serif text-xl lg:text-2xl text-white tracking-wide leading-tight text-left">
          Invisible<br />Hand
        </h1>
      </div>

      <nav className="flex flex-row lg:flex-col justify-between lg:justify-start items-center gap-2 lg:gap-4 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-2 lg:gap-3 px-2 lg:px-4 py-3 lg:py-6 rounded-2xl lg:rounded-[1.5rem] transition-all duration-300 flex-1 lg:w-full ${
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/10"
                  : "text-white/40 hover:text-white/90 hover:bg-white/5 border border-transparent"
              }`}
            >
              <IconComponent 
                className={`w-5 h-5 lg:w-7 lg:h-7 ${isActive ? "opacity-100" : "opacity-60"}`} 
                strokeWidth={1.5} 
              />
              <span className="text-[9px] lg:text-xs font-sans tracking-[0.15em] lg:tracking-[0.2em] font-bold uppercase text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}