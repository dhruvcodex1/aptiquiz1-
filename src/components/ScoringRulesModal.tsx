import React from 'react';
import { X, Award, Zap, Shield, Flame, Gauge, Clock, ShieldAlert } from 'lucide-react';

interface ScoringRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  largeText?: boolean;
}

export const ScoringRulesModal: React.FC<ScoringRulesModalProps> = ({ isOpen, onClose, largeText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto ${largeText ? 'text-lg' : 'text-sm'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-white">How Scoring & Arena Rules Work</h2>
            <p className="text-xs text-amber-400 font-medium tracking-wider uppercase">Official Placement League Protocol</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Base Points */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
              <Clock className="w-4 h-4" />
              <span>Speed-Decay Scoring (1000 → 500 Pts)</span>
            </div>
            <p className="text-slate-300">
              A correct answer starts at <strong className="text-white">1,000 points</strong> at 0.0 seconds and decreases linearly to <strong className="text-white">500 points</strong> when the timer expires. Faster answers earn significantly higher points.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Formula: <code>Points = Math.round(1000 - (elapsedMs / timeLimitMs) * 500)</code>
            </p>
          </div>

          {/* No Negative Marking */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
              <Shield className="w-4 h-4" />
              <span>Beginner-Friendly: No Negative Marking</span>
            </div>
            <p className="text-slate-300">
              Incorrect or unanswered questions award <strong className="text-white">0 points</strong> during regular rounds. Take your best calculated guess without fearing negative penalties.
            </p>
          </div>

          {/* Streak Bonus */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-orange-400 mb-1">
              <Flame className="w-4 h-4" />
              <span>Hot Streak Multiplier (+50 per streak, max +250)</span>
            </div>
            <p className="text-slate-300">
              Each consecutive correct answer adds <strong className="text-white">+50 bonus points</strong> per question, capped at <strong className="text-white">+250 points</strong> for a 5-streak or higher. A wrong answer resets your streak to 0 (unless protected by a Shield power-up).
            </p>
          </div>

          {/* Power-Ups */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-purple-400 mb-1">
              <Zap className="w-4 h-4" />
              <span>Single-Use Tactical Power-Ups</span>
            </div>
            <ul className="text-slate-300 space-y-1 list-disc list-inside">
              <li><strong className="text-white">Double Points:</strong> Multiplies your total points by 2x for that question if answered correctly.</li>
              <li><strong className="text-white">50-50:</strong> The server eliminates two incorrect options for your device only. Maximum points earned are capped at 70%.</li>
              <li><strong className="text-white">Shield:</strong> An incorrect answer will not reset your streak.</li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              Note: You receive exactly one of each power-up per game. Max one power-up per question, activated before answering.
            </p>
          </div>

          {/* Final Boss Wager */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
              <Award className="w-4 h-4" />
              <span>Final Boss High-Stakes Wager</span>
            </div>
            <p className="text-slate-300">
              In Placement Season Mode, the Final Boss round lets you wager up to <strong className="text-white">50% of your current score</strong> before seeing the question. Correct = win the wager amount! Wrong = lose the wager amount (score cannot drop below 0).
            </p>
          </div>

          {/* Network Fair Play & Anti-Cheat */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-sky-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Server-Authoritative Anti-Lag & Fair Play</span>
            </div>
            <p className="text-slate-300">
              The server acts as referee. Every player receives an automatic RTT (Round Trip Time) credit of half their ping (capped at 250ms), plus a 300ms grace window so slow connections aren't cut off unfairly. Answer options are randomized per player so students cannot copy by option position!
            </p>
          </div>

          {/* Placement Readiness Score */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 font-semibold text-cyan-400 mb-1">
              <Gauge className="w-4 h-4" />
              <span>Placement Readiness Score (out of 100)</span>
            </div>
            <p className="text-slate-300">
              Your final report cards you on: <strong className="text-white">60% Accuracy</strong> + <strong className="text-white">25% Speed</strong> + <strong className="text-white">15% Streak Consistency</strong>, benchmarked against real corporate recruitment percentiles.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-transform active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
