import React, { useEffect } from 'react';
import { Layers, Flame, Zap, Award } from 'lucide-react';
import { sound } from '../sound';

interface RoundIntroProps {
  roundIndex: number;
  roundName: string;
  description: string;
  timeLimitSec: number;
  isWagerRound: boolean;
}

export const RoundIntro: React.FC<RoundIntroProps> = ({
  roundIndex,
  roundName,
  description,
  timeLimitSec,
  isWagerRound,
}) => {
  useEffect(() => {
    sound.playFanfare();
  }, [roundName]);

  const getRoundTheme = () => {
    if (roundName === 'Warm-up') {
      return {
        bg: 'from-emerald-950 via-slate-900 to-emerald-950',
        border: 'border-emerald-500/50',
        text: 'text-emerald-400',
        glow: 'shadow-emerald-500/20',
        icon: <Zap className="w-10 h-10 text-emerald-400" />,
      };
    }
    if (roundName === 'Pressure') {
      return {
        bg: 'from-amber-950 via-slate-900 to-amber-950',
        border: 'border-amber-500/50',
        text: 'text-amber-400',
        glow: 'shadow-amber-500/20',
        icon: <Flame className="w-10 h-10 text-amber-400" />,
      };
    }
    return {
      bg: 'from-rose-950 via-slate-900 to-rose-950',
      border: 'border-rose-500/50',
      text: 'text-rose-400',
      glow: 'shadow-rose-500/20',
      icon: <Award className="w-10 h-10 text-rose-400" />,
    };
  };

  const theme = getRoundTheme();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div
        className={`bg-gradient-to-br ${theme.bg} border-2 ${theme.border} ${theme.glow} rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-300`}
      >
        <div className="w-20 h-20 rounded-2xl bg-slate-950/80 border border-slate-700 mx-auto flex items-center justify-center shadow-inner">
          {theme.icon}
        </div>

        <div>
          <span className="text-xs font-black tracking-widest uppercase text-slate-400">
            ROUND {roundIndex} OF 3
          </span>
          <h1 className={`text-4xl sm:text-5xl font-black ${theme.text} tracking-wider mt-1`}>
            {roundName.toUpperCase()}
          </h1>
        </div>

        <p className="text-base sm:text-lg text-slate-200 font-medium max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-6 text-sm">
          <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-xs block">Timer per question</span>
            <span className="text-white font-black font-mono text-lg">{timeLimitSec}s</span>
          </div>

          {isWagerRound && (
            <div className="bg-rose-950/60 px-4 py-2 rounded-xl border border-rose-800/80">
              <span className="text-rose-300 text-xs block">Wager mechanic</span>
              <span className="text-rose-200 font-black text-lg">Up to 50%</span>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold tracking-wide animate-pulse">
          PREPARING STAGE... ROUND STARTING IN 3 SECONDS
        </div>
      </div>
    </div>
  );
};
