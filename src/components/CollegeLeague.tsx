import React, { useState, useEffect } from 'react';
import { Trophy, Building2, Users, Calendar, Filter, Flame, Award } from 'lucide-react';
import { CollegeLeagueEntry, UserSettings } from '../types';

interface CollegeLeagueProps {
  settings: UserSettings;
}

export const CollegeLeague: React.FC<CollegeLeagueProps> = ({ settings }) => {
  const [filter, setFilter] = useState<'this_week' | 'this_month' | 'all_time'>('all_time');
  const [league, setLeague] = useState<CollegeLeagueEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchLeague();
  }, [filter]);

  const fetchLeague = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/league?filter=${filter}`);
      const data = await res.json();
      if (data.success && data.league) {
        setLeague(data.league);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
              <Trophy className="w-3.5 h-3.5" />
              NATIONAL CAMPUS PLACEMENT LEAGUE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
            College Power Rankings
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Fair Ranking Protocol: College score is calculated as the <strong>average of its top 10 player scores</strong> so emerging institutions compete on equal footing with mega campuses!
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setFilter('this_week')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'this_week'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setFilter('this_month')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'this_month'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter('all_time')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'all_time'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* College Standings List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
          <span>Campus Leaderboard ({league.length} Colleges Qualified)</span>
          <span>Top 10 Average Benchmark</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Calculating collegiate standings...
          </div>
        ) : league.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No finished arena matches found for this time period yet. Start a room to record scores!
          </div>
        ) : (
          <div className="space-y-3">
            {league.map((entry, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={entry.collegeName}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    rank === 1
                      ? 'bg-amber-500/10 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : rank === 2
                      ? 'bg-slate-800/80 border-slate-600'
                      : rank === 3
                      ? 'bg-amber-950/20 border-amber-700/60'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{rank}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base sm:text-lg">
                          {entry.collegeName}
                        </h3>
                        {rank === 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            LEAGUE CHAMPION
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{entry.totalPlayers} Aspirants Tracked</span>
                        <span>·</span>
                        <span>{entry.totalGames} Tournaments Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/80">
                    {/* Top Scores Mini Pills */}
                    <div className="hidden lg:flex items-center gap-1">
                      {entry.topPlayerScores.slice(0, 5).map((sc, sIdx) => (
                        <span key={sIdx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {sc}
                        </span>
                      ))}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-amber-400">
                        {entry.collegeScore}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        College League Rating
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
