import React, { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Shield, Scissors, Clock, AlertTriangle, EyeOff, Layers, CheckCircle } from 'lucide-react';
import { QuestionOption, QuestionTable, PowerupType, UserSettings } from '../types';
import { sound } from '../sound';

interface QuestionPlayProps {
  questionIndex: number;
  totalQuestions: number;
  roundName: string;
  timeLimitMs: number;
  startedAt: number;
  remainingMsServer?: number;
  question: {
    id: string;
    text: string;
    topic: string;
    difficulty: string;
    imageUrl?: string;
    table?: QuestionTable;
    options: QuestionOption[];
  };
  playerState: {
    score: number;
    streak: number;
    usedPowerups: {
      double_points: boolean;
      fifty_fifty: boolean;
      shield: boolean;
    };
    activePowerup: PowerupType | null;
    wager: number;
  };
  eliminatedOptionIds?: string[];
  onSubmitAnswer: (optionId: string) => void;
  onActivatePowerup: (powerup: PowerupType) => void;
  onReportTabSwitch: () => void;
  isReconnecting: boolean;
  settings: UserSettings;
}

export const QuestionPlay: React.FC<QuestionPlayProps> = ({
  questionIndex,
  totalQuestions,
  roundName,
  timeLimitMs,
  startedAt,
  remainingMsServer,
  question,
  playerState,
  eliminatedOptionIds,
  onSubmitAnswer,
  onActivatePowerup,
  onReportTabSwitch,
  isReconnecting,
  settings,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(timeLimitMs);
  const lastTickSecRef = useRef<number>(-1);

  // Sync timer with server startedAt timestamp
  useEffect(() => {
    setSelectedOptionId(null);
    lastTickSecRef.current = -1;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startedAt;
      const left = Math.max(0, timeLimitMs - elapsed);
      setRemainingMs(left);

      const secLeft = Math.ceil(left / 1000);
      if (secLeft <= 5 && secLeft > 0 && secLeft !== lastTickSecRef.current) {
        lastTickSecRef.current = secLeft;
        if (secLeft <= 2) {
          sound.playUrgentTick();
        } else {
          sound.playTick();
        }
      }

      if (left <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, timeLimitMs]);

  // Tab switch & window blur anti-cheat tracker
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onReportTabSwitch();
      }
    };

    const handleBlur = () => {
      onReportTabSwitch();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onReportTabSwitch]);

  const handleSelect = (optionId: string) => {
    if (selectedOptionId || remainingMs <= 0) return;
    setSelectedOptionId(optionId);
    onSubmitAnswer(optionId);
  };

  const handleUsePowerup = (powerup: PowerupType) => {
    if (selectedOptionId || playerState.activePowerup || playerState.usedPowerups[powerup]) return;
    sound.playPowerup();
    onActivatePowerup(powerup);
  };

  const percentLeft = Math.max(0, Math.min(100, (remainingMs / timeLimitMs) * 100));
  const secondsLeft = (remainingMs / 1000).toFixed(1);

  const getTimerColor = () => {
    if (percentLeft > 50) return 'from-emerald-500 to-emerald-400';
    if (percentLeft > 25) return 'from-amber-500 to-amber-400';
    return 'from-rose-600 to-rose-500 animate-pulse';
  };

  const isEliminated = (optId: string) => eliminatedOptionIds?.includes(optId);

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-4 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Reconnecting Banner */}
      {isReconnecting && (
        <div className="bg-rose-950/90 border border-rose-500/50 text-rose-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Connection interrupted. Reconnecting with player token...</span>
          </div>
          <span className="text-[11px] opacity-80">Syncing live server time</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
            <Layers className="w-3.5 h-3.5" />
            {roundName}
          </span>
          <span className="text-xs text-slate-400 font-semibold">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-300 font-medium capitalize">
            {question.topic.replace('_', ' ')}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
            {question.difficulty}
          </span>
        </div>

        {/* Player Stats during play */}
        <div className="flex items-center gap-4 text-sm font-bold">
          {playerState.wager > 0 && (
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Wager: {playerState.wager} pts
            </span>
          )}

          {playerState.streak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-500" />
              <span>{playerState.streak} Streak</span>
              <span className="text-xs text-orange-300 font-normal">
                (+{Math.min(250, playerState.streak * 50)})
              </span>
            </div>
          )}

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-amber-400 font-mono">
            {playerState.score} <span className="text-[10px] text-slate-400 font-sans">PTS</span>
          </div>
        </div>
      </div>

      {/* Countdown Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-bold px-1">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Remaining</span>
          </span>
          <span className={`font-mono text-sm ${remainingMs < 5000 ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
            {secondsLeft}s
          </span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getTimerColor()} transition-all duration-100 ease-linear`}
            style={{ width: `${percentLeft}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className={`font-bold text-white leading-relaxed ${settings.largeTextMode ? 'text-2xl' : 'text-xl'}`}>
          {question.text}
        </h2>

        {/* Optional Data Interpretation Table */}
        {question.table && (
          <div className="my-3 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/80">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-800 text-amber-400 font-bold border-b border-slate-700">
                <tr>
                  {question.table.headers.map((h, i) => (
                    <th key={i} className="py-2.5 px-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {question.table.rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/40'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-slate-200 font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Optional Image */}
        {question.imageUrl && !settings.lowDataMode && (
          <div className="my-2 max-h-64 overflow-hidden rounded-xl border border-slate-800">
            <img src={question.imageUrl} alt="Question Diagram" className="w-full h-full object-contain bg-slate-950" />
          </div>
        )}
      </div>

      {/* Power-Up Tray */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Tactical Power-Ups (Single Use):</span>
        </span>

        <div className="flex items-center gap-2">
          {/* Double Points */}
          <button
            onClick={() => handleUsePowerup('double_points')}
            disabled={
              Boolean(selectedOptionId) ||
              Boolean(playerState.activePowerup) ||
              playerState.usedPowerups.double_points
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              playerState.activePowerup === 'double_points'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md ring-2 ring-amber-400/30'
                : playerState.usedPowerups.double_points
                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : Boolean(selectedOptionId) || Boolean(playerState.activePowerup)
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 text-amber-400 border-slate-700 hover:border-amber-500/60 hover:bg-slate-850'
            }`}
            title="Double points if answer is correct"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Double Pts (2x)</span>
          </button>

          {/* 50-50 */}
          <button
            onClick={() => handleUsePowerup('fifty_fifty')}
            disabled={
              Boolean(selectedOptionId) ||
              Boolean(playerState.activePowerup) ||
              playerState.usedPowerups.fifty_fifty
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              playerState.activePowerup === 'fifty_fifty'
                ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-md ring-2 ring-sky-400/30'
                : playerState.usedPowerups.fifty_fifty
                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : Boolean(selectedOptionId) || Boolean(playerState.activePowerup)
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 text-sky-400 border-slate-700 hover:border-sky-500/60 hover:bg-slate-850'
            }`}
            title="Server eliminates two wrong options (max 70% points)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>50-50</span>
          </button>

          {/* Shield */}
          <button
            onClick={() => handleUsePowerup('shield')}
            disabled={
              Boolean(selectedOptionId) ||
              Boolean(playerState.activePowerup) ||
              playerState.usedPowerups.shield
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
              playerState.activePowerup === 'shield'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md ring-2 ring-emerald-400/30'
                : playerState.usedPowerups.shield
                ? 'bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : Boolean(selectedOptionId) || Boolean(playerState.activePowerup)
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500/60 hover:bg-slate-850'
            }`}
            title="Wrong answer will not reset streak"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Shield</span>
          </button>
        </div>
      </div>

      {/* Answer Options Grid (Okabe-Ito Color + Shape Enforced) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        {question.options.map((opt) => {
          const eliminated = isEliminated(opt.id);
          const isSelected = selectedOptionId === opt.id;
          const isLocked = Boolean(selectedOptionId) || remainingMs <= 0;

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={eliminated || isLocked}
              className={`p-4 rounded-2xl text-left border-2 transition-all flex items-start gap-3.5 cursor-pointer select-none relative ${
                eliminated
                  ? 'bg-slate-950/40 border-slate-800/40 text-slate-600 line-through cursor-not-allowed opacity-40'
                  : isSelected
                  ? 'bg-slate-800 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40 scale-[1.01]'
                  : isLocked
                  ? 'bg-slate-900/80 border-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {/* Shape + Okabe-Ito Color Badge (ALWAYS Shape paired with Color) */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shrink-0 shadow-sm"
                style={{ backgroundColor: eliminated ? '#475569' : opt.color }}
              >
                {opt.symbol}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                    style={{
                      color: eliminated ? '#94a3b8' : opt.color,
                      backgroundColor: `${opt.color}18`,
                    }}
                  >
                    {opt.shape} · {opt.colorName}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                      <CheckCircle className="w-3 h-3" /> Locked
                    </span>
                  )}
                  {eliminated && (
                    <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                      50-50 Removed
                    </span>
                  )}
                </div>
                <div className={`font-semibold text-slate-100 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  {opt.text}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer Locked Notification */}
      {selectedOptionId && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center text-sm font-semibold text-slate-300 flex items-center justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Answer submitted! Waiting for other candidates & round review...</span>
        </div>
      )}
    </div>
  );
};
