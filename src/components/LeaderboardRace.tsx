import React, { useState } from 'react';
import { Trophy, Users, ArrowUp, ArrowDown, Minus, Flame, Flag, Table } from 'lucide-react';
import { PlayerLeaderboardEntry, TeamLeaderboardEntry, UserSettings } from '../types';

interface LeaderboardRaceProps {
  leaderboard: PlayerLeaderboardEntry[];
  teamLeaderboard?: TeamLeaderboardEntry[];
  currentPlayerId?: string;
  settings: UserSettings;
}

export const LeaderboardRace: React.FC<LeaderboardRaceProps> = ({
  leaderboard,
  teamLeaderboard,
  currentPlayerId,
  settings,
}) => {
  const [viewMode, setViewMode] = useState<'racetrack' | 'table' | 'teams'>('racetrack');

  const maxScore = Math.max(1, ...leaderboard.map(p => p.score));
  const hasTeams = teamLeaderboard && teamLeaderboard.length > 0;

  return (
    <div className={`space-y-4 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* View Switcher Controls */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('racetrack')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'racetrack'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Race Track</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Classic Table</span>
          </button>

          {hasTeams && (
            <button
              onClick={() => setViewMode('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'teams'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Battles</span>
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400 font-semibold px-2 hidden sm:inline">
          {leaderboard.length} Aspirants Ranked
        </span>
      </div>

      {/* RACE TRACK VIEW */}
      {viewMode === 'racetrack' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3 relative overflow-hidden">
          {/* Finish Line Indicator */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 border-b border-slate-800/80 pb-2 mb-3">
            <span>START LINE (0 PTS)</span>
            <span className="flex items-center gap-1 text-amber-400 font-black">
              <Flag className="w-3.5 h-3.5" /> LEADER FINISH GATE ({maxScore} PTS)
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {leaderboard.map((player) => {
              const progress = Math.max(4, Math.min(100, (player.score / maxScore) * 100));
              const isMe = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`relative p-2.5 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-slate-900 border-amber-500/80 ring-1 ring-amber-500/40 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      {/* Rank delta */}
                      <span className="font-mono font-black text-slate-300 w-6">
                        #{player.rank}
                      </span>

                      {player.rankDelta > 0 && (
                        <span className="flex items-center text-emerald-400 font-bold text-[10px]" title={`Moved up ${player.rankDelta} ranks`}>
                          <ArrowUp className="w-3 h-3" />
                          <span>{player.rankDelta}</span>
                        </span>
                      )}
                      {player.rankDelta < 0 && (
                        <span className="flex items-center text-rose-400 font-bold text-[10px]" title={`Moved down ${Math.abs(player.rankDelta)} ranks`}>
                          <ArrowDown className="w-3 h-3" />
                          <span>{Math.abs(player.rankDelta)}</span>
                        </span>
                      )}
                      {player.rankDelta === 0 && (
                        <span className="text-slate-600 font-bold text-[10px]">
                          <Minus className="w-3 h-3" />
                        </span>
                      )}

                      <span className={`font-bold truncate max-w-[140px] sm:max-w-[200px] ${isMe ? 'text-amber-300' : 'text-white'}`}>
                        {player.name} {isMe && '(You)'}
                      </span>

                      {player.teamName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {player.teamName}
                        </span>
                      )}

                      {player.streak > 1 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-400 font-bold">
                          <Flame className="w-3 h-3 fill-orange-500" />
                          {player.streak}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {player.pointsGained > 0 && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          +{player.pointsGained}
                        </span>
                      )}
                      <span className="font-mono font-bold text-white text-sm">
                        {player.score} <span className="text-[10px] text-slate-400 font-normal">pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Lane & Gliding Avatar Chip */}
                  <div className="w-full h-3 bg-slate-950 rounded-full relative overflow-visible border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isMe
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-sm'
                          : 'bg-gradient-to-r from-slate-700 to-slate-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                    {/* Racer Avatar Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full flex items-center justify-center font-black text-slate-950 text-[10px] shadow-md border-2 border-slate-950 transition-all duration-700 ease-out"
                      style={{
                        left: `${progress}%`,
                        backgroundColor: player.avatarColor,
                      }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLASSIC TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-2">Delta</th>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3">Round Pts</th>
                  <th className="py-3 px-3">Streak</th>
                  <th className="py-3 px-3 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {leaderboard.map((player) => {
                  const isMe = player.id === currentPlayerId;
                  return (
                    <tr
                      key={player.id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-amber-500/10 font-bold text-amber-300'
                          : 'hover:bg-slate-850 text-slate-200'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">#{player.rank}</td>
                      <td className="py-2.5 px-2">
                        {player.rankDelta > 0 && (
                          <span className="flex items-center text-emerald-400 font-bold text-xs">
                            <ArrowUp className="w-3 h-3" />+{player.rankDelta}
                          </span>
                        )}
                        {player.rankDelta < 0 && (
                          <span className="flex items-center text-rose-400 font-bold text-xs">
                            <ArrowDown className="w-3 h-3" />{player.rankDelta}
                          </span>
                        )}
                        {player.rankDelta === 0 && (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-slate-950 text-[10px]"
                            style={{ backgroundColor: player.avatarColor }}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{player.name} {isMe && '(You)'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {player.teamName || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {player.pointsGained > 0 ? (
                          <span className="text-emerald-400 font-bold font-mono">+{player.pointsGained}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {player.streak > 0 ? (
                          <span className="flex items-center gap-1 text-orange-400 font-bold">
                            <Flame className="w-3 h-3 fill-orange-500" />
                            {player.streak}
                          </span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {player.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEAM BATTLE LEADERBOARD */}
      {viewMode === 'teams' && teamLeaderboard && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Team score = average of all team members to keep uneven teams fair.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {teamLeaderboard.map((team) => (
              <div
                key={team.teamName}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center font-mono">
                    #{team.rank}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{team.teamName}</h3>
                    <span className="text-xs text-slate-400">{team.memberCount} Aspirants</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-lg font-black text-amber-400">
                    {team.averageScore}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Avg Team Score
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
