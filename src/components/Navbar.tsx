import React from 'react';
import { Volume2, VolumeX, Type, Zap, ZapOff, BookOpen, Trophy, PlusCircle, Gamepad2, Calendar } from 'lucide-react';
import { UserSettings } from '../types';

interface NavbarProps {
  currentTab: 'arena' | 'authoring' | 'league' | 'daily';
  setCurrentTab: (tab: 'arena' | 'authoring' | 'league' | 'daily') => void;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  setSettings,
  onOpenRules,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => setCurrentTab('arena')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-[1.5px] shadow-[0_0_20px_rgba(245,158,11,0.35)] group-hover:shadow-[0_0_28px_rgba(245,158,11,0.6)] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 ring-2 ring-amber-400/40 ring-offset-2 ring-offset-slate-950">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center font-black text-slate-950 text-xl tracking-tighter relative overflow-hidden select-none before:absolute before:inset-0 before:-translate-x-full group-hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:transition-transform before:duration-700">
              <span className="drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]">AQ</span>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-wider text-white">AptiQuiz</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ARENA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              College Placement Esports
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setCurrentTab('arena')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'arena'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Arena</span>
          </button>

          <button
            onClick={() => setCurrentTab('authoring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'authoring'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">Question Sets</span>
            <span className="md:hidden">Author</span>
          </button>

          <button
            onClick={() => setCurrentTab('league')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'league'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">College League</span>
            <span className="md:hidden">League</span>
          </button>

          <button
            onClick={() => setCurrentTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              currentTab === 'daily'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="flex items-center gap-1">
              Daily <span className="text-xs">🔥</span>
            </span>
          </button>
        </nav>

        {/* Settings & Accessibility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Rules Button */}
          <button
            onClick={onOpenRules}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="How scoring works"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">Rules</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              settings.soundEnabled
                ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:text-emerald-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={settings.soundEnabled ? 'Sound On' : 'Sound Muted'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Large Text Mode Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, largeTextMode: !prev.largeTextMode }))}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              settings.largeTextMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={settings.largeTextMode ? 'Large Text Mode: Active' : 'Enable Large Text Mode'}
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Aa</span>
          </button>

          {/* Low Data Mode Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, lowDataMode: !prev.lowDataMode }))}
            className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              settings.lowDataMode
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={settings.lowDataMode ? 'Low Data Mode: Active (No animations)' : 'Enable Low Data Mode'}
          >
            {settings.lowDataMode ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            <span className="hidden xl:inline text-[11px]">Low-Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
