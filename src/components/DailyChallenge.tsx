import React, { useState, useEffect } from 'react';
import { Calendar, Flame, Clock, CheckCircle, AlertCircle, Building2, Trophy, ArrowRight, Award } from 'lucide-react';
import { Question, DailySubmission, UserSettings } from '../types';
import { sound } from '../sound';

interface DailyChallengeProps {
  settings: UserSettings;
}

const OKABE_ITO_SHAPES = [
  { shape: 'Triangle', symbol: '▲', color: '#E69F00' },
  { shape: 'Circle', symbol: '●', color: '#56B4E9' },
  { shape: 'Square', symbol: '■', color: '#009E73' },
  { shape: 'Diamond', symbol: '◆', color: '#D55E00' },
];

export const DailyChallenge: React.FC<DailyChallengeProps> = ({ settings }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [playerName, setPlayerName] = useState<string>('');
  const [collegeName, setCollegeName] = useState<string>('');
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [alreadyAttempted, setAlreadyAttempted] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<DailySubmission[]>([]);
  const [streakCount, setStreakCount] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(20);

  // Retrieve or generate persistent deviceId
  const getDeviceId = () => {
    let devId = localStorage.getItem('aptiquiz_device_id');
    if (!devId) {
      devId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('aptiquiz_device_id', devId);
    }
    return devId;
  };

  useEffect(() => {
    // Check saved streak
    const savedStreak = parseInt(localStorage.getItem('aptiquiz_daily_streak') || '1', 10);
    setStreakCount(savedStreak);

    // Check last submission date
    const lastDate = localStorage.getItem('aptiquiz_last_daily_date');
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate === today) {
      setAlreadyAttempted(true);
      setIsCompleted(true);
    }

    fetchDailyQuestions();
    fetchDailyLeaderboard();
  }, []);

  const fetchDailyQuestions = async () => {
    try {
      const res = await fetch('/api/daily');
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
      }
    } catch (e) {}
  };

  const fetchDailyLeaderboard = async () => {
    try {
      const res = await fetch('/api/daily/leaderboard');
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setDailyLeaderboard(data.leaderboard);
      }
    } catch (e) {}
  };

  // Timer per question during daily challenge
  useEffect(() => {
    if (!isStarted || isCompleted || alreadyAttempted) return;

    setTimeLeft(20);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired for this question: record -1 (unanswered) and proceed
          handleAnswer(-1);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIdx, isStarted, isCompleted, alreadyAttempted]);

  const handleStart = () => {
    if (!playerName.trim() || !collegeName.trim()) {
      alert('Please enter your name and college name to begin.');
      return;
    }
    setIsStarted(true);
  };

  const handleAnswer = (optionIdx: number) => {
    const updatedAnswers = [...answers, optionIdx];
    setAnswers(updatedAnswers);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitAllAnswers(updatedAnswers);
    }
  };

  const submitAllAnswers = async (finalAnswers: number[]) => {
    const deviceId = getDeviceId();
    try {
      const res = await fetch('/api/daily/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          playerName,
          collegeName,
          answers: finalAnswers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setIsCompleted(true);
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('aptiquiz_last_daily_date', today);

        // Update streak
        const newStreak = streakCount + 1;
        setStreakCount(newStreak);
        localStorage.setItem('aptiquiz_daily_streak', newStreak.toString());

        sound.playFanfare();
        fetchDailyLeaderboard();
      } else {
        alert(data.error || 'Submission error');
      }
    } catch (e) {}
  };

  const currentQ = questions[currentIdx];

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/40">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              {streakCount} Day Streak
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
            Daily Placement Sprint
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            5 synchronized questions delivered campus-wide every day. One attempt per device to test your placement readiness!
          </p>
        </div>
      </div>

      {/* Already Attempted State */}
      {alreadyAttempted && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Daily Challenge Completed!</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            You've locked in your score for today. Your {streakCount}-day streak flame 🔥 is burning bright! Come back tomorrow for 5 new questions.
          </p>
        </div>
      )}

      {/* Pre-Start Form */}
      {!isStarted && !alreadyAttempted && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white text-center">Enter Candidate Details</h2>
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Your Full Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Aditi Sharma"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">College / University:</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. IIT Bombay, DTU, VIT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer mt-2"
          >
            Start 5-Question Daily Sprint (20s each)
          </button>
        </div>
      )}

      {/* Active Question Play */}
      {isStarted && !isCompleted && currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-400">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 text-rose-400 font-mono text-sm">
              <Clock className="w-4 h-4" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-100 ease-linear"
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
            {currentQ.text}
          </h2>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt, idx) => {
              const shape = OKABE_ITO_SHAPES[idx];
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="p-4 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-start gap-3 text-left transition-all cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-slate-950 text-base shrink-0"
                    style={{ backgroundColor: shape.color }}
                  >
                    {shape.symbol}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: shape.color }}>
                      Option {String.fromCharCode(65 + idx)} ({shape.shape})
                    </span>
                    <span className="font-semibold text-white text-sm">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Results */}
      {isCompleted && result && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <h2 className="text-xl font-black text-white">Daily Sprint Finished!</h2>
              <p className="text-xs text-slate-400">Score has been registered on the inter-college daily board.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-2">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block">SCORE</span>
              <span className="text-2xl font-mono font-black text-amber-400">{result.score} pts</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block">ACCURACY</span>
              <span className="text-2xl font-mono font-black text-emerald-400">{result.accuracy}%</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block">CORRECT</span>
              <span className="text-2xl font-mono font-black text-sky-400">{result.correctCount} / {result.totalQuestions}</span>
            </div>
          </div>

          {/* Explanations */}
          {result.explanations && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Daily Solutions & Explanations:
              </span>
              {result.explanations.map((exp: any, i: number) => (
                <div key={exp.id || i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-emerald-400 mr-2">Q{i + 1} Answer: Option {String.fromCharCode(65 + exp.correctAnswer)}</span>
                  <p className="text-slate-300 mt-1">{exp.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Daily Collegiate Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>Today's Daily Leaderboard by College</span>
        </h3>

        {dailyLeaderboard.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No daily submissions yet today. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {dailyLeaderboard.map((sub, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>
                  <div>
                    <span className="font-bold text-white">{sub.playerName}</span>
                    <span className="text-slate-400 block text-[11px]">{sub.collegeName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-amber-400 text-base">{sub.score} pts</span>
                  <span className="text-slate-500 text-[10px] block">{sub.accuracy}% acc</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
