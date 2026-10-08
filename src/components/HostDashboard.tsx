import React from 'react';
import { Pause, Play, SkipForward, Users, Sparkles, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import { HostLiveStats, UserSettings } from '../types';

interface HostDashboardProps {
  stats: HostLiveStats;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onToggleAdaptive: (enabled: boolean) => void;
  settings: UserSettings;
}

const OKABE_ITO_SHAPES = [
  { shape: 'Triangle', symbol: '▲', color: '#E69F00' },
  { shape: 'Circle', symbol: '●', color: '#56B4E9' },
  { shape: 'Square', symbol: '■', color: '#009E73' },
  { shape: 'Diamond', symbol: '◆', color: '#D55E00' },
];

export const HostDashboard: React.FC<HostDashboardProps> = ({
  stats,
  isPaused,
  onPause,
  onResume,
  onSkip,
  onToggleAdaptive,
  settings,
}) => {
  const { answeredCount, totalPlayers, distribution, adaptiveMode, suspiciousEventsCount, tabSwitchTotal } = stats;
  const pctAnswered = totalPlayers > 0 ? Math.round((answeredCount / totalPlayers) * 100) : 0;

  return (
    <div className={`bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 mb-4 ${settings.largeTextMode ? 'text-lg' : 'text-sm'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="font-black text-white text-base tracking-wide uppercase">
            Host Control Station
          </h3>
          <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            Live Stream
          </span>
        </div>

        {/* Action Buttons: Pause, Resume, Skip */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Timer</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Timer</span>
            </button>
          )}

          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip Round</span>
          </button>
        </div>
      </div>

      {/* Answer Progress & Real-time Distribution Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Candidates Answered Card */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Submissions In
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {answeredCount} <span className="text-sm font-sans text-slate-400">/ {totalPlayers}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-amber-400">{pctAnswered}%</span>
            <div className="w-16 h-2 bg-slate-900 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pctAnswered}%` }} />
            </div>
          </div>
        </div>

        {/* Live Distribution Mini Bars */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 md:col-span-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Real-Time Option Spread
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((optIdx) => {
              const count = distribution[optIdx] || 0;
              const shape = OKABE_ITO_SHAPES[optIdx];
              return (
                <div key={optIdx} className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold" style={{ color: shape.color }}>
                    <span>{shape.symbol}</span>
                    <span>{shape.shape}</span>
                  </div>
                  <div className="font-mono font-black text-sm text-white mt-0.5">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Host Monitoring & Security Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={adaptiveMode}
            onChange={(e) => onToggleAdaptive(e.target.checked)}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
          />
          <span className="flex items-center gap-1 font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Adaptive Difficulty Active
          </span>
        </label>

        <div className="flex items-center gap-3">
          {tabSwitchTotal > 0 && (
            <span className="flex items-center gap-1 text-amber-400 font-semibold" title="Total times candidates switched browser tabs">
              <Eye className="w-3.5 h-3.5" />
              <span>{tabSwitchTotal} Tab Switch Alert{tabSwitchTotal > 1 ? 's' : ''}</span>
            </span>
          )}

          {suspiciousEventsCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-semibold" title="Responses submitted under 400ms">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{suspiciousEventsCount} Suspicious (&lt;400ms) Flag{suspiciousEventsCount > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
