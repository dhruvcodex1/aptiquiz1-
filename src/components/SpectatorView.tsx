import React, { useState, useEffect } from 'react';
import { Clock, Users, Trophy, Flag, Layers, Building2 } from 'lucide-react';
import { LeaderboardRace } from './LeaderboardRace';
import { UserSettings } from '../types';

interface SpectatorViewProps {
  roomCode: string;
  onBackToArena: () => void;
  settings: UserSettings;
}

const OKABE_ITO_SHAPES = [
  { shape: 'Triangle', symbol: '▲', color: '#E69F00' },
  { shape: 'Circle', symbol: '●', color: '#56B4E9' },
  { shape: 'Square', symbol: '■', color: '#009E73' },
  { shape: 'Diamond', symbol: '◆', color: '#D55E00' },
];

export const SpectatorView: React.FC<SpectatorViewProps> = ({
  roomCode,
  onBackToArena,
  settings,
}) => {
  const [collegeName, setCollegeName] = useState<string>('Placement Arena');
  const [status, setStatus] = useState<string>('lobby');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(0);
  const [totalTimeMs, setTotalTimeMs] = useState<number>(20000);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([]);
  const [roundName, setRoundName] = useState<string>('Arena');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null);
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'spectator_join', code: roomCode }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'spectator_connected') {
          setCollegeName(msg.collegeName);
          setStatus(msg.status);
          setQuestionIndex(msg.currentQuestionIndex);
          setTotalQuestions(msg.totalQuestions);
        } else if (msg.type === 'lobby_update') {
          setCollegeName(msg.collegeName);
          setStatus(msg.status);
          setTotalPlayers(msg.players.length);
        } else if (msg.type === 'question_start_spectator') {
          setStatus('question_active');
          setCurrentQuestion(msg.question);
          setQuestionIndex(msg.questionIndex);
          setTotalQuestions(msg.totalQuestions);
          setRoundName(msg.roundName);
          setTotalTimeMs(msg.timeLimitMs);
          setTimeRemainingMs(msg.timeLimitMs);
          setCorrectAnswerIndex(null);
          setAnsweredCount(0);
        } else if (msg.type === 'host_live_stats') {
          setAnsweredCount(msg.answeredCount);
          setTotalPlayers(msg.totalPlayers);
        } else if (msg.type === 'question_ended_spectator') {
          setStatus('question_review');
          setCorrectAnswerIndex(msg.correctAnswerIndex);
          setDistribution(msg.distribution);
          setLeaderboard(msg.leaderboard);
          setTeamLeaderboard(msg.teamLeaderboard);
        } else if (msg.type === 'game_ended_spectator') {
          setStatus('game_ended');
          setLeaderboard(msg.finalLeaderboard);
        }
      } catch (e) {}
    };

    // Client timer tick
    const interval = setInterval(() => {
      setTimeRemainingMs(prev => Math.max(0, prev - 100));
    }, 100);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, [roomCode]);

  const secLeft = (timeRemainingMs / 1000).toFixed(1);
  const pctTime = Math.max(0, Math.min(100, (timeRemainingMs / totalTimeMs) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between select-none">
      {/* Top Projector Header */}
      <div className="flex items-center justify-between pb-6 border-b-2 border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-2xl shadow-xl shadow-amber-500/20">
            AQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-white">
                APTIQUIZ ARENA
              </span>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-bold text-xs uppercase border border-amber-500/30">
                AUDITORIUM PROJECTOR
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold mt-0.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>{collegeName}</span>
              <span>·</span>
              <span>Join at your device using code:</span>
              <strong className="text-amber-400 font-mono text-base tracking-widest">{roomCode}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={onBackToArena}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
        >
          Exit Projector
        </button>
      </div>

      {/* Main Body */}
      <div className="my-8 flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full space-y-8">
        {status === 'lobby' && (
          <div className="text-center space-y-6 py-12">
            <span className="text-xs font-black tracking-widest uppercase text-amber-400">
              JOIN TOURNAMENT FROM ANY SMARTPHONE OR LAPTOP
            </span>
            <div className="text-7xl sm:text-9xl font-mono font-black text-amber-400 tracking-widest select-all shadow-amber-500/10">
              {roomCode}
            </div>
            <p className="text-2xl text-slate-300 font-bold max-w-xl mx-auto">
              Awaiting host signal to commence aptitude assessment...
            </p>
          </div>
        )}

        {status === 'question_active' && currentQuestion && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-amber-400 uppercase tracking-widest">
                Question {questionIndex + 1} of {totalQuestions} · {roundName}
              </span>

              <div className="flex items-center gap-6">
                <span className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  <span>{answeredCount} Answered</span>
                </span>
                <span className="text-3xl font-mono font-black text-white bg-slate-900 px-4 py-1.5 rounded-2xl border border-slate-800">
                  {secLeft}s
                </span>
              </div>
            </div>

            {/* Timer Progress */}
            <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100 ease-linear"
                style={{ width: `${pctTime}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                {currentQuestion.text}
              </h1>

              {currentQuestion.table && (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950 p-4">
                  <table className="w-full text-left text-base sm:text-lg">
                    <thead className="text-amber-400 font-bold border-b border-slate-700">
                      <tr>
                        {currentQuestion.table.headers.map((h: string, i: number) => (
                          <th key={i} className="py-2 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {currentQuestion.table.rows.map((row: string[], rIdx: number) => (
                        <tr key={rIdx}>
                          {row.map((cell: string, cIdx: number) => (
                            <td key={cIdx} className="py-2 px-4 text-slate-200">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((opt: any, idx: number) => {
                const shape = OKABE_ITO_SHAPES[idx];
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center gap-4 shadow-lg"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-slate-950 text-2xl shrink-0"
                      style={{ backgroundColor: shape.color }}
                    >
                      {shape.symbol}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(status === 'question_review' || status === 'game_ended') && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              <span>Live Auditorium Standings</span>
            </h2>

            <LeaderboardRace
              leaderboard={leaderboard}
              teamLeaderboard={teamLeaderboard}
              settings={settings}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-900 text-center text-xs text-slate-500 font-medium">
        AptiQuiz: Placement Arena · Real-time WebSocket Multi-user Engine
      </div>
    </div>
  );
};
