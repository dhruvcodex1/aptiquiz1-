import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Flame, ArrowRight, Lightbulb, BarChart2 } from 'lucide-react';
import { PlayerLeaderboardEntry, TeamLeaderboardEntry, UserSettings } from '../types';
import { LeaderboardRace } from './LeaderboardRace';
import { sound } from '../sound';

interface RoundReviewProps {
  isCorrect: boolean;
  pointsGained: number;
  currentScore: number;
  currentStreak: number;
  correctAnswerText: string;
  correctAnswerIndex: number;
  explanation: string;
  distribution: number[]; // counts for 0, 1, 2, 3
  leaderboard: PlayerLeaderboardEntry[];
  teamLeaderboard?: TeamLeaderboardEntry[];
  currentPlayerId?: string;
  isHost: boolean;
  isLastQuestion: boolean;
  onNextQuestion?: () => void;
  settings: UserSettings;
}

const OKABE_ITO_SHAPES = [
  { shape: 'triangle', symbol: '▲', color: '#E69F00', name: 'Triangle' },
  { shape: 'circle', symbol: '●', color: '#56B4E9', name: 'Circle' },
  { shape: 'square', symbol: '■', color: '#009E73', name: 'Square' },
  { shape: 'diamond', symbol: '◆', color: '#D55E00', name: 'Diamond' },
];

export const RoundReview: React.FC<RoundReviewProps> = ({
  isCorrect,
  pointsGained,
  currentScore,
  currentStreak,
  correctAnswerText,
  correctAnswerIndex,
  explanation,
  distribution,
  leaderboard,
  teamLeaderboard,
  currentPlayerId,
  isHost,
  isLastQuestion,
  onNextQuestion,
  settings,
}) => {
  useEffect(() => {
    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
  }, [isCorrect]);

  const totalVotes = distribution.reduce((a, b) => a + b, 0);
  const correctShape = OKABE_ITO_SHAPES[correctAnswerIndex] || OKABE_ITO_SHAPES[0];

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Player Outcome Hero Banner */}
      <div
        className={`rounded-2xl p-6 border-2 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isCorrect
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/50 shadow-emerald-500/10'
            : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/50 shadow-rose-500/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shrink-0 ${
              isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <div>
            <span className="text-xs font-black tracking-widest uppercase opacity-75">
              Round Verdict
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {isCorrect ? 'Correct! Placement Points Secured' : 'Incorrect Choice'}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm font-semibold text-slate-300">
              <span>Points gained: <strong className="text-emerald-400 font-mono">+{pointsGained}</strong></span>
              <span>·</span>
              <span>Total Score: <strong className="text-amber-400 font-mono">{currentScore}</strong></span>
              {currentStreak > 1 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-4 h-4 fill-orange-500" />
                    <span>{currentStreak} Streak</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Host Next Round Button */}
        {isHost ? (
          <button
            onClick={onNextQuestion}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <span>{isLastQuestion ? 'Show Final Standings' : 'Next Question'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="text-xs text-slate-400 text-center sm:text-right">
            Host is reviewing answers.<br />Next round will begin automatically.
          </div>
        )}
      </div>

      {/* Correct Answer & Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Verified Correct Answer
          </span>
          <div className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-sm"
              style={{ backgroundColor: correctShape.color }}
            >
              {correctShape.symbol}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: correctShape.color }}>
                Option {String.fromCharCode(65 + correctAnswerIndex)} ({correctShape.shape})
              </div>
              <div className="text-lg font-bold text-white">
                {correctAnswerText}
              </div>
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Placement Solution & Shortcut</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
            {explanation}
          </p>
        </div>

        {/* Answer Distribution Chart */}
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <span>Arena Candidate Answer Distribution ({totalVotes} Responses)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {distribution.map((count, idx) => {
              const shape = OKABE_ITO_SHAPES[idx] || OKABE_ITO_SHAPES[0];
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isCorrectOpt = idx === correctAnswerIndex;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    isCorrectOpt
                      ? 'bg-slate-950 border-emerald-500/80 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 font-bold" style={{ color: shape.color }}>
                      <span>{shape.symbol}</span>
                      <span>Opt {String.fromCharCode(65 + idx)}</span>
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: shape.color,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 text-right">
                    {count} {count === 1 ? 'player' : 'players'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Race Track Leaderboard */}
      <div className="space-y-2">
        <h3 className="text-base font-bold text-white tracking-wide">
          Updated Arena Standings
        </h3>
        <LeaderboardRace
          leaderboard={leaderboard}
          teamLeaderboard={teamLeaderboard}
          currentPlayerId={currentPlayerId}
          settings={settings}
        />
      </div>
    </div>
  );
};
