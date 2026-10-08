import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Flame, Clock, BarChart3, Download, Share2, Sparkles, Building2, CheckCircle2, ChevronRight } from 'lucide-react';
import { PersonalResult, PlayerLeaderboardEntry, UserSettings } from '../types';
import { HostAnalyticsModal } from './HostAnalyticsModal';
import { sound } from '../sound';

interface ResultsViewProps {
  personalResult?: PersonalResult;
  finalLeaderboard: PlayerLeaderboardEntry[];
  currentPlayerId?: string;
  isHost: boolean;
  roomCode: string;
  collegeName: string;
  hostAnalytics?: any;
  onPlayAgain: () => void;
  settings: UserSettings;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  personalResult,
  finalLeaderboard,
  currentPlayerId,
  isHost,
  roomCode,
  collegeName,
  hostAnalytics,
  onPlayAgain,
  settings,
}) => {
  const [showHostModal, setShowHostModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    sound.playFanfare();
    if (!settings.lowDataMode) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#D55E00'],
        });
      } catch (e) {}
    }
  }, [settings.lowDataMode]);

  // Download Shareable Result Card as PNG image via HTML5 Canvas
  const handleDownloadCard = () => {
    if (!personalResult) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient (Dark Esports Arcade)
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Subtle Grid / Accent border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 1160, 590);

    // Accent corner glow
    ctx.fillStyle = '#f59e0b20';
    ctx.beginPath();
    ctx.arc(1100, 100, 160, 0, Math.PI * 2);
    ctx.fill();

    // App Branding
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('APTIQUIZ: PLACEMENT ARENA', 70, 90);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px sans-serif';
    ctx.fillText(`COLLEGE PLACEMENT ASSESSMENT CARD · ${personalResult.collegeName.toUpperCase()}`, 70, 125);

    // Candidate Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px sans-serif';
    ctx.fillText(personalResult.playerName, 70, 210);

    // Rank Badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`RANK #${personalResult.rank}`, 70, 270);

    // Placement Readiness Score Badge
    ctx.fillStyle = '#1e293b';
    ctx.roundRect ? ctx.roundRect(70, 320, 480, 220, 24) : ctx.fillRect(70, 320, 480, 220);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PLACEMENT READINESS SCORE', 100, 370);

    ctx.fillStyle = '#f59e0b';
    ctx.font = '900 84px sans-serif';
    ctx.fillText(`${personalResult.readinessScore}`, 100, 470);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('/ 100', 270, 470);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('60% Accuracy · 25% Speed · 15% Consistency', 100, 510);

    // Stats Grid on Right Side
    const metrics = [
      { label: 'ACCURACY', val: `${personalResult.accuracy}%` },
      { label: 'TOTAL SCORE', val: `${personalResult.score} PTS` },
      { label: 'BEST STREAK', val: `${personalResult.bestStreak} IN A ROW` },
      { label: 'AVG SPEED', val: `${(personalResult.avgResponseTimeMs / 1000).toFixed(1)}s` },
      { label: 'STRONGEST TOPIC', val: personalResult.strongestTopic.toUpperCase().replace('_', ' ') },
    ];

    let startY = 220;
    metrics.forEach((m) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(m.label, 620, startY);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(m.val, 620, startY + 32);

      startY += 75;
    });

    // Save as image
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AptiQuiz_${personalResult.playerName.replace(/\s+/g, '_')}_Card.png`;
    a.click();
  };

  const readiness = personalResult?.readinessScore || 75;

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Victory Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
              <Trophy className="w-3.5 h-3.5" />
              ARENA TOURNAMENT CONCLUDED
            </span>
            <span className="text-xs text-slate-400 font-semibold">{collegeName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
            {personalResult ? `Well Played, ${personalResult.playerName}!` : 'Tournament Completed!'}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-lg">
            Final placement performance analysis based on speed, accuracy, and hot-streak discipline.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {personalResult && (
            <button
              onClick={handleDownloadCard}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Download Result Card</span>
            </button>
          )}

          {isHost && hostAnalytics && (
            <button
              onClick={() => setShowHostModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Host Cohort Analytics</span>
            </button>
          )}
        </div>
      </div>

      {/* Candidate Placement Readiness Report Card */}
      {personalResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Readiness Score Gauge */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Placement Readiness Score
            </span>
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Outer circular badge */}
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-950 shadow-inner">
                <div className="text-center">
                  <span className="text-4xl font-black font-mono text-amber-400 block">
                    {readiness}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    OUT OF 100
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-0.5">
              <div>60% Accuracy · 25% Speed · 15% Consistency</div>
              <div className="font-bold text-emerald-400">
                {readiness >= 80 ? 'Tier 1 Campus Day-1 Ready' : readiness >= 60 ? 'Competitive Aspirant' : 'Foundational Practice Required'}
              </div>
            </div>
          </div>

          {/* Key Metrics Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Performance Breakdown</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">FINAL RANK</span>
                <span className="text-2xl font-mono font-black text-amber-400">#{personalResult.rank}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">ACCURACY</span>
                <span className="text-2xl font-mono font-black text-emerald-400">{personalResult.accuracy}%</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">AVG SPEED</span>
                <span className="text-2xl font-mono font-black text-sky-400">{(personalResult.avgResponseTimeMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">BEST STREAK</span>
                <span className="text-2xl font-mono font-black text-orange-400">{personalResult.bestStreak} 🔥</span>
              </div>
            </div>

            {/* Topic Strength Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Topic-Wise Mastery
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(personalResult.topicStrength).map(([topic, stat]) => {
                  const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                  return (
                    <div key={topic} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="capitalize text-slate-300">{topic.replace('_', ' ')}</span>
                        <span className="font-mono text-white">{pct}% ({stat.correct}/{stat.total})</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 75 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* One-Line Improvement Tip */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                {personalResult.weaknessTip}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final Room Standings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Official Room Final Standings</span>
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{finalLeaderboard.length} Aspirants</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {finalLeaderboard.map((player) => {
            const isMe = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  player.rank === 1
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                    : player.rank === 2
                    ? 'bg-slate-800/80 border-slate-600'
                    : player.rank === 3
                    ? 'bg-amber-950/20 border-amber-700/60'
                    : isMe
                    ? 'bg-slate-850 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm ${
                      player.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : player.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : player.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{player.rank}
                  </div>

                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-950 text-xs shrink-0"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <span className="font-bold text-white text-sm">
                      {player.name} {isMe && '(You)'}
                    </span>
                    {player.teamName && (
                      <span className="text-[10px] ml-2 px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {player.teamName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-amber-400 text-base">
                    {player.score} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
                  </div>
                  {Boolean(player.bestStreak && player.bestStreak > 1) && (
                    <span className="text-[10px] text-orange-400 font-semibold">
                      Best Streak: {player.bestStreak} 🔥
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onPlayAgain}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-transform active:scale-95 cursor-pointer text-sm shadow-lg shadow-amber-500/20"
          >
            Play Another Arena Game
          </button>
        </div>
      </div>

      {/* Host Analytics Modal */}
      {hostAnalytics && (
        <HostAnalyticsModal
          isOpen={showHostModal}
          onClose={() => setShowHostModal(false)}
          roomCode={roomCode}
          collegeName={collegeName}
          mostMissedQuestions={hostAnalytics.mostMissedQuestions || []}
          perQuestionStats={hostAnalytics.perQuestionStats || []}
          topicStrength={hostAnalytics.topicStrength || {}}
          suspiciousPlayers={hostAnalytics.suspiciousPlayers || []}
        />
      )}
    </div>
  );
};
