import React, { useState } from 'react';
import { Copy, Check, Users, Play, ExternalLink, ShieldCheck, HelpCircle, UserX, Sparkles, Building2, Layers } from 'lucide-react';
import { UserSettings } from '../types';

interface LobbyProps {
  roomCode: string;
  collegeName: string;
  isHost: boolean;
  hostToken?: string;
  players: Array<{
    id: string;
    name: string;
    teamName?: string;
    avatarColor: string;
    isConnected: boolean;
  }>;
  gameMode: string;
  adaptiveMode: boolean;
  questionCount: number;
  onStartGame: () => void;
  onKickPlayer?: (playerId: string) => void;
  onToggleAdaptive?: (enabled: boolean) => void;
  onOpenRules: () => void;
  settings: UserSettings;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  collegeName,
  isHost,
  hostToken,
  players,
  gameMode,
  adaptiveMode,
  questionCount,
  onStartGame,
  onKickPlayer,
  onToggleAdaptive,
  onOpenRules,
  settings,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?join=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyToken = () => {
    if (hostToken) {
      navigator.clipboard.writeText(hostToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const isPlacementSeason = gameMode === 'placement_season';

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">
                <Building2 className="w-3.5 h-3.5" />
                {collegeName}
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold border border-sky-500/30">
                <Layers className="w-3.5 h-3.5" />
                {isPlacementSeason ? 'Placement Season Mode (3 Rounds)' : 'Standard Arena'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              Placement Practice Lobby
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {questionCount} Curated Questions · Max 50 Aspirants · Real-Time WebSockets
            </p>
          </div>

          {/* Join Code Card */}
          <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-xl p-4 flex flex-col items-center justify-center min-w-[200px] shadow-lg shadow-amber-500/10">
            <span className="text-[11px] font-bold text-amber-400 tracking-widest uppercase">
              Room Join Code
            </span>
            <div className="text-4xl font-mono font-black text-white tracking-widest my-1 select-all">
              {roomCode}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mode breakdown if placement season */}
        {isPlacementSeason && (
          <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">Round 1: Warm-up</span>
              <p className="text-slate-400">Easy questions, 20s timer to build streak bonus.</p>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">Round 2: Pressure</span>
              <p className="text-slate-400">Medium questions, rapid 15s timer for quick thinking.</p>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <span className="font-bold text-rose-400 block mb-0.5">Round 3: Final Boss</span>
              <p className="text-slate-400">Hard questions with up to 50% score wager phase!</p>
            </div>
          </div>
        )}

        {/* Host Secret Token Section */}
        {isHost && hostToken && (
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Host Secret Token saved in your browser:</span>
              <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-200 font-mono text-[11px] truncate max-w-[140px] sm:max-w-[200px]">
                {hostToken}
              </code>
            </div>
            <button
              onClick={handleCopyToken}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold cursor-pointer transition-colors"
            >
              {copiedToken ? 'Token Copied!' : 'Copy Host Token'}
            </button>
          </div>
        )}
      </div>

      {/* Host Controls & Actions Bar */}
      {isHost ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onStartGame}
              disabled={players.length === 0}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-slate-950 text-base tracking-wide transition-all shadow-lg cursor-pointer ${
                players.length > 0
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-amber-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{players.length === 0 ? 'Waiting for Aspirants...' : `Start Arena (${players.length} Ready)`}</span>
            </button>

            {/* Spectator Screen button */}
            <a
              href={`#spectator-${roomCode}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = `spectator-${roomCode}`;
              }}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer border border-slate-700"
              title="Open full-screen spectator/projector view"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Projector View</span>
            </a>
          </div>

          {/* Adaptive Mode toggle */}
          {onToggleAdaptive && (
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-300 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
              <input
                type="checkbox"
                checked={adaptiveMode}
                onChange={(e) => onToggleAdaptive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Adaptive Mode (auto-scales difficulty)
              </span>
            </label>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold text-slate-200">
              Connected! Waiting for host to launch the round...
            </span>
          </div>
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How scoring works</span>
          </button>
        </div>
      )}

      {/* Players Lobby Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Joined Aspirants ({players.length} / 50)
            </h2>
          </div>
          <button
            onClick={onOpenRules}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-medium flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Arena Rules</span>
          </button>
        </div>

        {players.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-base font-semibold">The lobby is currently empty.</p>
            <p className="text-xs mt-1">Share the join code <strong className="text-amber-400">{roomCode}</strong> with students on campus!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  p.isConnected
                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                } ${!settings.lowDataMode ? 'animate-in fade-in zoom-in-95' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-black text-slate-950 text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{p.name}</p>
                    {p.teamName && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 truncate block">
                        {p.teamName}
                      </span>
                    )}
                  </div>
                </div>

                {isHost && onKickPlayer && (
                  <button
                    onClick={() => onKickPlayer(p.id)}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                    title={`Kick ${p.name}`}
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
