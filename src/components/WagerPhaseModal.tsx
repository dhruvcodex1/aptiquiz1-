import React, { useState, useEffect } from 'react';
import { Award, Clock, AlertCircle } from 'lucide-react';
import { sound } from '../sound';

interface WagerPhaseModalProps {
  currentScore: number;
  timeLimitMs: number;
  onSubmitWager: (amount: number) => void;
}

export const WagerPhaseModal: React.FC<WagerPhaseModalProps> = ({
  currentScore,
  timeLimitMs,
  onSubmitWager,
}) => {
  const maxWager = Math.max(0, Math.floor(currentScore * 0.5));
  const [wager, setWager] = useState<number>(Math.min(maxWager, Math.floor(maxWager * 0.5)));
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(Math.ceil(timeLimitMs / 1000));

  useEffect(() => {
    sound.playWager();
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!submitted) {
            onSubmitWager(wager);
            setSubmitted(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [wager, submitted, onSubmitWager]);

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmitWager(wager);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-gradient-to-b from-slate-900 to-rose-950/80 border-2 border-rose-500/50 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-6 animate-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">FINAL BOSS: PLACE YOUR WAGER</h2>
              <p className="text-xs text-rose-300 font-semibold">High Stakes Round · Up to 50% Score</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-xl border border-rose-500/30 text-rose-400 font-mono font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Your Current Score
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono">
            {currentScore} <span className="text-sm font-sans text-slate-400 font-semibold">PTS</span>
          </div>
          <div className="text-xs text-slate-400">
            Maximum Allowed Wager: <strong className="text-white">{maxWager} pts</strong> (50%)
          </div>
        </div>

        {/* Wager Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-300">Choose Wager Amount:</label>
            <span className="font-mono text-xl font-black text-rose-400">{wager} PTS</span>
          </div>

          <input
            type="range"
            min={0}
            max={maxWager}
            step={25}
            value={wager}
            disabled={submitted}
            onChange={(e) => setWager(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />

          {/* Quick presets */}
          <div className="flex items-center justify-between gap-2 text-xs font-bold">
            <button
              onClick={() => setWager(0)}
              disabled={submitted}
              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              0 (Safe)
            </button>
            <button
              onClick={() => setWager(Math.floor(maxWager * 0.5))}
              disabled={submitted}
              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              25% ({Math.floor(maxWager * 0.5)})
            </button>
            <button
              onClick={() => setWager(maxWager)}
              disabled={submitted}
              className="flex-1 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 cursor-pointer"
            >
              MAX 50% ({maxWager})
            </button>
          </div>
        </div>

        {/* Rules note */}
        <div className="flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-200">Wager Outcome:</strong> Answer correctly and gain your wager on top of normal points. Answer incorrectly and lose the wagered amount from your score.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitted}
          className={`w-full py-3.5 rounded-xl font-black text-base tracking-wider transition-all cursor-pointer ${
            submitted
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/25 active:scale-95'
          }`}
        >
          {submitted ? 'Wager Locked In!' : `Confirm Wager of ${wager} Points`}
        </button>
      </div>
    </div>
  );
};
