/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { QuestionPlay } from './components/QuestionPlay';
import { RoundIntro } from './components/RoundIntro';
import { WagerPhaseModal } from './components/WagerPhaseModal';
import { RoundReview } from './components/RoundReview';
import { HostDashboard } from './components/HostDashboard';
import { ResultsView } from './components/ResultsView';
import { SpectatorView } from './components/SpectatorView';
import { QuestionAuthoring } from './components/QuestionAuthoring';
import { CollegeLeague } from './components/CollegeLeague';
import { DailyChallenge } from './components/DailyChallenge';
import { ScoringRulesModal } from './components/ScoringRulesModal';
import { UserSettings, QuestionSet, PowerupType, HostLiveStats } from './types';
import { sound } from './sound';
import { Gamepad2, Users, Building2, Sparkles, PlusCircle, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function App() {
  // Navigation & Settings
  const [currentTab, setCurrentTab] = useState<'arena' | 'authoring' | 'league' | 'daily'>('arena');
  const [spectatorCode, setSpectatorCode] = useState<string | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const [settings, setSettings] = useState<UserSettings>(() => {
    return {
      soundEnabled: localStorage.getItem('aptiquiz_sound') !== 'false',
      largeTextMode: localStorage.getItem('aptiquiz_large_text') === 'true',
      lowDataMode: localStorage.getItem('aptiquiz_low_data') === 'true',
    };
  });

  useEffect(() => {
    sound.enabled = settings.soundEnabled;
    localStorage.setItem('aptiquiz_sound', settings.soundEnabled ? 'true' : 'false');
    localStorage.setItem('aptiquiz_large_text', settings.largeTextMode ? 'true' : 'false');
    localStorage.setItem('aptiquiz_low_data', settings.lowDataMode ? 'true' : 'false');
  }, [settings]);

  // Check URL hash for spectator mode or direct join
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#spectator-')) {
        setSpectatorCode(hash.replace('#spectator-', '').toUpperCase());
      } else {
        setSpectatorCode(null);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Room & WebSocket State
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [pingRtt, setPingRtt] = useState<number>(40);

  // Room details
  const [roomCode, setRoomCode] = useState<string>('');
  const [collegeName, setCollegeName] = useState<string>('National Arena');
  const [gameMode, setGameMode] = useState<string>('standard');
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [hostToken, setHostToken] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [playerToken, setPlayerToken] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');

  // Live Game State
  const [roomStatus, setRoomStatus] = useState<string>('idle'); // idle | lobby | round_intro | wager_phase | question_active | question_review | game_ended
  const [players, setPlayers] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  const [roundName, setRoundName] = useState<string>('Standard Round');
  const [roundIndex, setRoundIndex] = useState<number>(1);
  const [roundDescription, setRoundDescription] = useState<string>('');
  const [roundTimeLimitSec, setRoundTimeLimitSec] = useState<number>(20);
  const [isWagerRound, setIsWagerRound] = useState<boolean>(false);

  // Active Question
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [questionTimeLimitMs, setQuestionTimeLimitMs] = useState<number>(20000);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(0);
  const [eliminatedOptionIds, setEliminatedOptionIds] = useState<string[]>([]);
  const [playerState, setPlayerState] = useState<{
    score: number;
    streak: number;
    usedPowerups: { double_points: boolean; fifty_fifty: boolean; shield: boolean };
    activePowerup: PowerupType | null;
    wager: number;
  }>({
    score: 0,
    streak: 0,
    usedPowerups: { double_points: false, fifty_fifty: false, shield: false },
    activePowerup: null,
    wager: 0,
  });

  // Host Live Stats
  const [hostStats, setHostStats] = useState<HostLiveStats>({
    answeredCount: 0,
    totalPlayers: 0,
    distribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
    adaptiveMode: false,
    suspiciousEventsCount: 0,
    tabSwitchTotal: 0,
  });
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);

  // Review State
  const [reviewData, setReviewData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [teamLeaderboard, setTeamLeaderboard] = useState<any[]>([]);

  // Results State
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [personalResult, setPersonalResult] = useState<any>(null);
  const [hostAnalytics, setHostAnalytics] = useState<any>(null);

  // Pre-join form fields
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinNameInput, setJoinNameInput] = useState<string>('');
  const [joinTeamInput, setJoinTeamInput] = useState<string>('');
  const [createCollegeInput, setCreateCollegeInput] = useState<string>('IIT Bombay');
  const [createModeInput, setCreateModeInput] = useState<'standard' | 'placement_season'>('placement_season');
  const [createAdaptiveInput, setCreateAdaptiveInput] = useState<boolean>(true);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');

  // Fetch Question Sets for Host Room Creation
  useEffect(() => {
    fetch('/api/question-sets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.questionSets) {
          setQuestionSets(data.questionSets);
          if (data.questionSets.length > 0) {
            setSelectedSetId(data.questionSets[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // WebSocket Connection & Reconnection Management
  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsReconnecting(false);

      // Auto-reconnect if tokens exist
      const savedCode = localStorage.getItem('aptiquiz_room_code');
      const savedPlayerToken = localStorage.getItem('aptiquiz_player_token');
      const savedHostToken = localStorage.getItem('aptiquiz_host_token');
      const savedPlayerName = localStorage.getItem('aptiquiz_player_name');

      if (savedCode && savedHostToken) {
        socket.send(JSON.stringify({
          type: 'reconnect_host',
          code: savedCode,
          hostToken: savedHostToken,
        }));
      } else if (savedCode && savedPlayerToken && savedPlayerName) {
        socket.send(JSON.stringify({
          type: 'join_room',
          code: savedCode,
          name: savedPlayerName,
          playerToken: savedPlayerToken,
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleSocketMessage(msg);
      } catch (e) {}
    };

    socket.onclose = () => {
      setIsReconnecting(true);
      setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };

    setWs(socket);
    return socket;
  }, []);

  useEffect(() => {
    const socket = connectWebSocket();
    return () => {
      socket.close();
    };
  }, [connectWebSocket]);

  // Ping heartbeat every 2s to measure client-server RTT
  useEffect(() => {
    if (!ws) return;
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const now = Date.now();
        ws.send(JSON.stringify({
          type: 'ping',
          clientTimestamp: now,
          rtt: pingRtt,
        }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [ws, pingRtt]);

  // Handle all server WebSocket messages
  const handleSocketMessage = (msg: any) => {
    const { type } = msg;

    if (type === 'pong') {
      const now = Date.now();
      const rtt = Math.max(10, now - (msg.clientTimestamp || now));
      setPingRtt(rtt);
      return;
    }

    if (type === 'error') {
      setJoinError(msg.message);
      return;
    }

    if (type === 'room_created') {
      setRoomCode(msg.code);
      setHostToken(msg.hostToken);
      setIsHost(true);
      setCollegeName(msg.collegeName);
      setQuestionCount(msg.questionCount);
      setGameMode(msg.gameMode);
      setAdaptiveMode(msg.adaptiveMode);
      setRoomStatus('lobby');
      localStorage.setItem('aptiquiz_room_code', msg.code);
      localStorage.setItem('aptiquiz_host_token', msg.hostToken);
      return;
    }

    if (type === 'host_reconnected') {
      setRoomCode(msg.code);
      setIsHost(true);
      setCollegeName(msg.collegeName);
      setQuestionCount(msg.questionCount);
      setGameMode(msg.gameMode);
      setAdaptiveMode(msg.adaptiveMode);
      setRoomStatus(msg.status);
      setPlayers(msg.players);
      return;
    }

    if (type === 'joined_room') {
      setRoomCode(msg.code);
      setCollegeName(msg.collegeName);
      setIsHost(false);
      setPlayerId(msg.player.id);
      setPlayerToken(msg.player.token);
      setPlayerName(msg.player.name);
      setPlayerState({
        score: msg.player.score,
        streak: msg.player.streak,
        usedPowerups: msg.player.usedPowerups,
        activePowerup: null,
        wager: 0,
      });
      setGameMode(msg.gameMode);
      setRoomStatus(msg.roomStatus || 'lobby');
      localStorage.setItem('aptiquiz_room_code', msg.code);
      localStorage.setItem('aptiquiz_player_token', msg.player.token);
      localStorage.setItem('aptiquiz_player_name', msg.player.name);
      return;
    }

    if (type === 'lobby_update') {
      setPlayers(msg.players);
      setRoomStatus(msg.status);
      return;
    }

    if (type === 'round_intro') {
      setRoomStatus('round_intro');
      setRoundIndex(msg.roundIndex);
      setRoundName(msg.roundName);
      setRoundDescription(msg.description);
      setRoundTimeLimitSec(msg.timeLimitSec);
      setIsWagerRound(msg.isWagerRound);
      return;
    }

    if (type === 'wager_phase') {
      setRoomStatus('wager_phase');
      return;
    }

    if (type === 'wager_confirmed') {
      setPlayerState(prev => ({ ...prev, wager: msg.wager }));
      return;
    }

    if (type === 'question_start') {
      setRoomStatus('question_active');
      setCurrentQuestionIndex(msg.questionIndex);
      setTotalQuestions(msg.totalQuestions);
      setRoundName(msg.roundName);
      setActiveQuestion(msg.question);
      setQuestionTimeLimitMs(msg.timeLimitMs);
      setQuestionStartedAt(msg.startedAt);
      setEliminatedOptionIds([]);
      if (msg.playerState) {
        setPlayerState({
          score: msg.playerState.score,
          streak: msg.playerState.streak,
          usedPowerups: msg.playerState.usedPowerups,
          activePowerup: null,
          wager: msg.playerState.wager || 0,
        });
      }
      return;
    }

    if (type === 'powerup_activated') {
      setPlayerState(prev => ({
        ...prev,
        activePowerup: msg.powerup,
        usedPowerups: msg.usedPowerups,
      }));
      if (msg.eliminatedOptionIds) {
        setEliminatedOptionIds(msg.eliminatedOptionIds);
      }
      return;
    }

    if (type === 'host_live_stats') {
      setHostStats(msg);
      return;
    }

    if (type === 'game_paused') {
      setIsGamePaused(true);
      return;
    }

    if (type === 'game_resumed') {
      setIsGamePaused(false);
      return;
    }

    if (type === 'adaptive_toggled') {
      setAdaptiveMode(msg.enabled);
      return;
    }

    if (type === 'question_ended') {
      setRoomStatus('question_review');
      setReviewData(msg);
      setLeaderboard(msg.leaderboard);
      setTeamLeaderboard(msg.teamLeaderboard);
      setPlayerState(prev => ({
        ...prev,
        score: msg.currentScore,
        streak: msg.currentStreak,
      }));
      return;
    }

    if (type === 'game_ended') {
      setRoomStatus('game_ended');
      setFinalLeaderboard(msg.finalLeaderboard);
      if (msg.personalResult) {
        setPersonalResult(msg.personalResult);
      }
      return;
    }

    if (type === 'game_ended_spectator') {
      setRoomStatus('game_ended');
      setFinalLeaderboard(msg.finalLeaderboard);
      if (msg.hostAnalytics) {
        setHostAnalytics(msg.hostAnalytics);
      }
      return;
    }
  };

  // User Actions
  const handleHostCreateRoom = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    setJoinError('');
    ws.send(JSON.stringify({
      type: 'create_room',
      questionSetId: selectedSetId,
      collegeName: createCollegeInput.trim(),
      gameMode: createModeInput,
      adaptiveMode: createAdaptiveInput,
    }));
  };

  const handlePlayerJoinRoom = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!joinCodeInput.trim() || !joinNameInput.trim()) {
      setJoinError('Please enter both room code and your name.');
      return;
    }
    setJoinError('');
    ws.send(JSON.stringify({
      type: 'join_room',
      code: joinCodeInput.trim().toUpperCase(),
      name: joinNameInput.trim(),
      teamName: joinTeamInput.trim() || undefined,
    }));
  };

  const handleStartGame = () => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({
      type: 'start_game',
      code: roomCode,
      hostToken,
    }));
  };

  const handleNextQuestion = () => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({
      type: 'next_question',
      code: roomCode,
      hostToken,
    }));
  };

  const handleSubmitAnswer = (optionId: string) => {
    if (!ws || !playerId) return;
    ws.send(JSON.stringify({
      type: 'submit_answer',
      code: roomCode,
      playerId,
      optionId,
      clientSendTime: Date.now(),
    }));
  };

  const handleActivatePowerup = (powerup: PowerupType) => {
    if (!ws || !playerId) return;
    ws.send(JSON.stringify({
      type: 'activate_powerup',
      code: roomCode,
      playerId,
      powerup,
    }));
  };

  const handleSubmitWager = (amount: number) => {
    if (!ws || !playerId) return;
    ws.send(JSON.stringify({
      type: 'submit_wager',
      code: roomCode,
      playerId,
      amount,
    }));
  };

  const handleReportTabSwitch = () => {
    if (!ws || !playerId || roomStatus !== 'question_active') return;
    ws.send(JSON.stringify({
      type: 'report_tab_switch',
      code: roomCode,
      playerId,
    }));
  };

  const handlePauseGame = () => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({ type: 'pause_game', code: roomCode, hostToken }));
  };

  const handleResumeGame = () => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({ type: 'resume_game', code: roomCode, hostToken }));
  };

  const handleSkipQuestion = () => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({ type: 'skip_question', code: roomCode, hostToken }));
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({ type: 'kick_player', code: roomCode, hostToken, playerId: targetPlayerId }));
  };

  const handleToggleAdaptive = (enabled: boolean) => {
    if (!ws || !isHost) return;
    ws.send(JSON.stringify({ type: 'toggle_adaptive', code: roomCode, hostToken, enabled }));
  };

  const handlePlayAgain = () => {
    localStorage.removeItem('aptiquiz_room_code');
    localStorage.removeItem('aptiquiz_player_token');
    localStorage.removeItem('aptiquiz_host_token');
    setRoomCode('');
    setRoomStatus('idle');
    setIsHost(false);
    setPersonalResult(null);
    setReviewData(null);
    setLeaderboard([]);
    setFinalLeaderboard([]);
  };

  // If Spectator View is requested
  if (spectatorCode) {
    return (
      <SpectatorView
        roomCode={spectatorCode}
        onBackToArena={() => {
          window.location.hash = '';
          setSpectatorCode(null);
        }}
        settings={settings}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Universal Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        setSettings={setSettings}
        onOpenRules={() => setShowRulesModal(true)}
      />

      <main className="flex-1 pb-16">
        {/* TAB 1: ARENA (MULTIPLAYER GAMEPLAY) */}
        {currentTab === 'arena' && (
          <div className="py-6">
            {/* IDLE: JOIN OR HOST CARDS */}
            {roomStatus === 'idle' && (
              <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
                {/* Hero Banner */}
                <div className="text-center space-y-3 py-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real-Time College Placement Arena</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    AptiQuiz: Placement Arena
                  </h1>
                  <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
                    Live multiplayer aptitude competitions designed for corporate placement drives. Fair latency compensation, anti-cheat randomized options, and instant Placement Readiness feedback.
                  </p>
                </div>

                {joinError && (
                  <div className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* JOIN GAME CARD */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          <Gamepad2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">Join as Candidate</h2>
                          <p className="text-xs text-slate-400">Enter with 5-character room code</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm">
                        <div>
                          <label className="font-bold text-slate-300 block mb-1">5-Character Join Code:</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={joinCodeInput}
                            onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                            placeholder="e.g. 7K2NW"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-amber-400 font-mono font-black text-xl tracking-widest uppercase focus:outline-none focus:border-amber-500 text-center"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Your Full Name:</label>
                          <input
                            type="text"
                            value={joinNameInput}
                            onChange={(e) => setJoinNameInput(e.target.value)}
                            placeholder="e.g. Rahul Verma"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Optional Team Name (3-5 Aspirants):</label>
                          <input
                            type="text"
                            value={joinTeamInput}
                            onChange={(e) => setJoinTeamInput(e.target.value)}
                            placeholder="e.g. AlgoWarriors (Optional)"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handlePlayerJoinRoom}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer mt-4 flex items-center justify-center gap-2"
                    >
                      <span>Join Placement Arena</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* HOST ROOM CARD */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-white">Host Campus Arena</h2>
                          <p className="text-xs text-slate-400">Launch a live quiz for up to 50 players</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs sm:text-sm">
                        <div>
                          <label className="font-bold text-slate-300 block mb-1">College / University Name:</label>
                          <input
                            type="text"
                            value={createCollegeInput}
                            onChange={(e) => setCreateCollegeInput(e.target.value)}
                            placeholder="e.g. IIT Bombay, NIT Trichy"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Question Assessment Set:</label>
                          <select
                            value={selectedSetId}
                            onChange={(e) => setSelectedSetId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-sky-500"
                          >
                            {questionSets.map(set => (
                              <option key={set.id} value={set.id}>
                                {set.title} ({set.questions.length} questions)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-300 block mb-1">Game Structure Mode:</label>
                          <select
                            value={createModeInput}
                            onChange={(e: any) => setCreateModeInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-sky-500"
                          >
                            <option value="placement_season">Placement Season (3 Rounds: Warm-up, Pressure, Final Boss Wager)</option>
                            <option value="standard">Standard Arena (Continuous Sequence)</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 pt-1">
                          <input
                            type="checkbox"
                            checked={createAdaptiveInput}
                            onChange={(e) => setCreateAdaptiveInput(e.target.checked)}
                            className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-800 border-slate-700"
                          />
                          <span className="font-semibold">Enable Adaptive Difficulty (adjusts to cohort accuracy)</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleHostCreateRoom}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 shadow-lg shadow-sky-500/25 cursor-pointer mt-4 flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Room & Get Host Key</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LOBBY STATE */}
            {roomStatus === 'lobby' && (
              <Lobby
                roomCode={roomCode}
                collegeName={collegeName}
                isHost={isHost}
                hostToken={hostToken}
                players={players}
                gameMode={gameMode}
                adaptiveMode={adaptiveMode}
                questionCount={questionCount}
                onStartGame={handleStartGame}
                onKickPlayer={handleKickPlayer}
                onToggleAdaptive={handleToggleAdaptive}
                onOpenRules={() => setShowRulesModal(true)}
                settings={settings}
              />
            )}

            {/* ROUND INTRO ANIMATION */}
            {roomStatus === 'round_intro' && (
              <RoundIntro
                roundIndex={roundIndex}
                roundName={roundName}
                description={roundDescription}
                timeLimitSec={roundTimeLimitSec}
                isWagerRound={isWagerRound}
              />
            )}

            {/* FINAL BOSS WAGER PHASE */}
            {roomStatus === 'wager_phase' && (
              <WagerPhaseModal
                currentScore={playerState.score}
                timeLimitMs={7000}
                onSubmitWager={handleSubmitWager}
              />
            )}

            {/* ACTIVE QUESTION PLAY */}
            {roomStatus === 'question_active' && activeQuestion && (
              <div className="space-y-4">
                {/* Host Live Control Bar (visible to host only) */}
                {isHost && (
                  <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <HostDashboard
                      stats={hostStats}
                      isPaused={isGamePaused}
                      onPause={handlePauseGame}
                      onResume={handleResumeGame}
                      onSkip={handleSkipQuestion}
                      onToggleAdaptive={handleToggleAdaptive}
                      settings={settings}
                    />
                  </div>
                )}

                <QuestionPlay
                  questionIndex={currentQuestionIndex}
                  totalQuestions={totalQuestions}
                  roundName={roundName}
                  timeLimitMs={questionTimeLimitMs}
                  startedAt={questionStartedAt}
                  question={activeQuestion}
                  playerState={playerState}
                  eliminatedOptionIds={eliminatedOptionIds}
                  onSubmitAnswer={handleSubmitAnswer}
                  onActivatePowerup={handleActivatePowerup}
                  onReportTabSwitch={handleReportTabSwitch}
                  isReconnecting={isReconnecting}
                  settings={settings}
                />
              </div>
            )}

            {/* QUESTION REVIEW & RACE TRACK LEADERBOARD */}
            {roomStatus === 'question_review' && reviewData && (
              <RoundReview
                isCorrect={reviewData.isCorrect}
                pointsGained={reviewData.pointsGained}
                currentScore={reviewData.currentScore}
                currentStreak={reviewData.currentStreak}
                correctAnswerText={reviewData.correctAnswerText}
                correctAnswerIndex={reviewData.correctAnswerIndex}
                explanation={reviewData.explanation}
                distribution={reviewData.distribution}
                leaderboard={leaderboard}
                teamLeaderboard={teamLeaderboard}
                currentPlayerId={playerId}
                isHost={isHost}
                isLastQuestion={reviewData.isLastQuestion}
                onNextQuestion={handleNextQuestion}
                settings={settings}
              />
            )}

            {/* FINAL TOURNAMENT RESULTS */}
            {roomStatus === 'game_ended' && (
              <ResultsView
                personalResult={personalResult}
                finalLeaderboard={finalLeaderboard}
                currentPlayerId={playerId}
                isHost={isHost}
                roomCode={roomCode}
                collegeName={collegeName}
                hostAnalytics={hostAnalytics}
                onPlayAgain={handlePlayAgain}
                settings={settings}
              />
            )}
          </div>
        )}

        {/* TAB 2: QUESTION AUTHORING */}
        {currentTab === 'authoring' && (
          <div className="py-6">
            <QuestionAuthoring settings={settings} />
          </div>
        )}

        {/* TAB 3: COLLEGE LEAGUE */}
        {currentTab === 'league' && (
          <div className="py-6">
            <CollegeLeague settings={settings} />
          </div>
        )}

        {/* TAB 4: DAILY CHALLENGE */}
        {currentTab === 'daily' && (
          <div className="py-6">
            <DailyChallenge settings={settings} />
          </div>
        )}
      </main>

      {/* Global How Scoring Works Modal */}
      <ScoringRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        largeText={settings.largeTextMode}
      />
    </div>
  );
}
