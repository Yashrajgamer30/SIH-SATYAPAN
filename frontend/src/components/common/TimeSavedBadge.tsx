import React, { useState } from 'react';
import { Clock, Info, CheckCircle2, TrendingUp } from 'lucide-react';

export const TimeSavedBadge: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowPopover(!showPopover)}
        onMouseEnter={() => setShowPopover(true)}
        onMouseLeave={() => setShowPopover(false)}
        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 rounded-full text-xs font-medium hover:bg-emerald-500/30 transition-colors cursor-pointer"
        title="AICTE SATYAPAN Automated Efficiency Impact"
      >
        <TrendingUp className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
        <span className="font-semibold text-white">47,700 hrs saved</span>
        <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-700/50">
          -78.4%
        </span>
        <Info className="w-3 h-3 text-emerald-300/80 ml-0.5" />
      </button>

      {showPopover && (
        <div
          onMouseEnter={() => setShowPopover(true)}
          onMouseLeave={() => setShowPopover(false)}
          className="absolute right-0 mt-2 w-80 p-4 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-700/80 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-emerald-300">Live Scrutiny Time Saved</span>
            </div>
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
              APH Model 2026-27
            </span>
          </div>

          <p className="text-[11px] text-slate-300 mb-3">
            Real-time manual-effort reduction achieved through deterministic multi-engine pre-checks:
          </p>

          <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Manual Check Benchmark:</span>
              <span className="text-white font-semibold">45 min / doc</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Docs per Application:</span>
              <span className="text-white font-semibold">6.5 docs</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Annual Applications:</span>
              <span className="text-white font-semibold">12,480 dossiers</span>
            </div>
            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Manual Baseline:</span>
              <span className="text-slate-300 line-through">60,840 hours</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Automated Actual:</span>
              <span>13,140 hours</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Turnaround Reduction:
            </span>
            <span className="font-semibold text-white">14d down to 4.2d</span>
          </div>
        </div>
      )}
    </div>
  );
};
