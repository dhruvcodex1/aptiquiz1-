import { WebSocket } from 'ws';
import { Question, QuestionSet, db } from './db';

export interface Player {
  id: string;
  token: string;
  name: string;
  teamName?: string;
  avatarColor: string;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  totalAnswered: number;
  totalResponseTimeMs: number;
  topicStats: Record<string, { correct: number; total: number }>;
  usedPowerups: {
    double_points: boolean;
    fifty_fifty: boolean;
    shield: boolean;
  };
  activePowerup: 'double_points' | 'fifty_fifty' | 'shield' | null;
  wager: number;
  rtt: number;
  lastPingTime: number;
  tabSwitchCount: number;
  suspiciousAnswers: number;
  isConnected: boolean;
  ws?: WebSocket;
  hasAnsweredCurrent: boolean;
  currentAnswer?: {
    optionId: string;
    elapsedMs: number;
    effectiveElapsedMs: number;
    isCorrect: boolean;
    pointsAwarded: number;
    isLate: boolean;
  };
  eliminatedOptionIds?: string[];
  rankDelta?: number; // up/down/same compared to previous round
  previousRank?: number;
}

export type GameMode = 'standard' | 'placement_season';
export type RoomStatus = 'lobby' | 'round_intro' | 'wager_phase' | 'question_active' | 'question_review' | 'game_ended';

export interface RoundInfo {
  index: number;
  name: string; // 'Warm-up' | 'Pressure' | 'Final Boss'
  timeLimitSec: number;
  description: string;
  isWagerRound: boolean;
}

// Okabe-Ito shape & color pairings
export const OKABE_ITO_SHAPES = [
  { shape: 'triangle', symbol: '▲', color: '#E69F00', name: 'Orange Triangle' },
  { shape: 'circle', symbol: '●', color: '#56B4E9', name: 'Sky-Blue Circle' },
  { shape: 'square', symbol: '■', color: '#009E73', name: 'Green Square' },
  { shape: 'diamond', symbol: '◆', color: '#D55E00', name: 'Vermilion Diamond' },
];

const AVATAR_COLORS = [
  '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#999999',
  '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1'
];

// Clean 5-character charset (No O, 0, I, 1)
const CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARSET.charAt(Math.floor(Math.random() * CODE_CHARSET.length));
  }
  return code;
}

export interface QuestionAnalyticsItem {
  questionIndex: number;
  questionText: string;
  topic: string;
  difficulty: string;
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
  averageResponseTimeMs: number;
  distribution: { [optionText: string]: number };
}

export class Room {
  code: string;
  hostToken: string;
  hostWs?: WebSocket;
  collegeName: string;
  questionSet: QuestionSet;
  gameMode: GameMode;
  adaptiveMode: boolean;
  status: RoomStatus = 'lobby';
  createdAt: number = Date.now();

  players: Map<string, Player> = new Map(); // key = playerId
  playerTokenMap: Map<string, string> = new Map(); // token -> playerId
  spectators: Set<WebSocket> = new Set();

  questions: Question[] = [];
  currentQuestionIndex: number = -1;
  questionStartTime: number = 0;
  questionTimeLimitMs: number = 20000;
  questionTimer?: NodeJS.Timeout;
  isPaused: boolean = false;
  pauseRemainingMs: number = 0;

  // Question mapping per player (anti-cheat: shuffled options with random IDs)
  // playerId -> { optionMap: { randomOptId: originalIndex }, reverseMap: { originalIndex: randomOptId } }
  playerOptionMaps: Map<string, { [randomId: string]: number }> = new Map();
  playerReverseOptionMaps: Map<string, { [origIdx: number]: string }> = new Map();

  // Round info for placement season
  currentRound?: RoundInfo;
  roundIntroTimer?: NodeJS.Timeout;
  wagerTimer?: NodeJS.Timeout;

  // Analytics
  questionAnalytics: QuestionAnalyticsItem[] = [];
  suspiciousEvents: { playerId: string; playerName: string; questionIndex: number; elapsedMs: number }[] = [];

  // Mutex lock for thread-safe sequential operations
  private lockQueue: Promise<void> = Promise.resolve();

  constructor(code: string, hostToken: string, collegeName: string, questionSet: QuestionSet, gameMode: GameMode = 'standard', adaptiveMode: boolean = false) {
    this.code = code;
    this.hostToken = hostToken;
    this.collegeName = collegeName;
    this.questionSet = questionSet;
    this.gameMode = gameMode;
    this.adaptiveMode = adaptiveMode;
    this.prepareQuestions();
  }

  async acquireLock<T>(fn: () => Promise<T> | T): Promise<T> {
    const nextLock = this.lockQueue.then(async () => {
      return await fn();
    });
    this.lockQueue = nextLock.then(() => {}, () => {});
    return nextLock;
  }

  private prepareQuestions() {
    // Clone questions
    this.questions = [...this.questionSet.questions];
    if (this.gameMode === 'placement_season') {
      // Sort into Warm-up (easy), Pressure (medium), Final Boss (hard)
      const easy = this.questions.filter(q => q.difficulty === 'easy');
      const med = this.questions.filter(q => q.difficulty === 'medium');
      const hard = this.questions.filter(q => q.difficulty === 'hard');
      // If categories missing, balance evenly
      const all = [...this.questions];
      this.questions = [...(easy.length ? easy : all.slice(0, 5)), ...(med.length ? med : all.slice(5, 10)), ...(hard.length ? hard : all.slice(10))];
    }
  }

  addPlayer(name: string, teamName?: string, existingToken?: string, ws?: WebSocket): { player: Player; error?: string } {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { player: {} as Player, error: 'Player name is required.' };
    }

    // Check reconnection with existingToken
    if (existingToken && this.playerTokenMap.has(existingToken)) {
      const pid = this.playerTokenMap.get(existingToken)!;
      const existing = this.players.get(pid);
      if (existing) {
        existing.isConnected = true;
        existing.ws = ws;
        if (teamName) existing.teamName = teamName.trim();
        return { player: existing };
      }
    }

    // Check capacity
    if (this.players.size >= 50) {
      return { player: {} as Player, error: 'Room is full (max 50 players).' };
    }

    // Block duplicate names
    for (const p of this.players.values()) {
      if (p.name.toLowerCase() === trimmedName.toLowerCase()) {
        return { player: {} as Player, error: `Name "${trimmedName}" is already taken in this room.` };
      }
    }

    const playerId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const token = existingToken || `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const avatarColor = AVATAR_COLORS[this.players.size % AVATAR_COLORS.length];

    const player: Player = {
      id: playerId,
      token,
      name: trimmedName,
      teamName: teamName?.trim() || undefined,
      avatarColor,
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      totalAnswered: 0,
      totalResponseTimeMs: 0,
      topicStats: {
        quantitative: { correct: 0, total: 0 },
        logical: { correct: 0, total: 0 },
        verbal: { correct: 0, total: 0 },
        data_interpretation: { correct: 0, total: 0 },
      },
      usedPowerups: {
        double_points: false,
        fifty_fifty: false,
        shield: false,
      },
      activePowerup: null,
      wager: 0,
      rtt: 50,
      lastPingTime: Date.now(),
      tabSwitchCount: 0,
      suspiciousAnswers: 0,
      isConnected: true,
      ws,
      hasAnsweredCurrent: false,
    };

    this.players.set(playerId, player);
    this.playerTokenMap.set(token, playerId);
    return { player };
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = false;
      this.players.delete(playerId);
      this.playerTokenMap.delete(player.token);
    }
  }

  getRoundInfo(questionIndex: number, totalQuestions: number): RoundInfo {
    if (this.gameMode === 'standard') {
      return {
        index: 1,
        name: 'Standard Round',
        timeLimitSec: 20,
        description: 'Answer quickly and accurately for maximum points.',
        isWagerRound: false,
      };
    }

    const third = Math.max(1, Math.floor(totalQuestions / 3));
    if (questionIndex < third) {
      return {
        index: 1,
        name: 'Warm-up',
        timeLimitSec: 20,
        description: 'Warm-up stage: Easy questions to build your streak.',
        isWagerRound: false,
      };
    } else if (questionIndex < third * 2) {
      return {
        index: 2,
        name: 'Pressure',
        timeLimitSec: 15,
        description: 'Pressure stage: Faster 15-second timer with medium questions!',
        isWagerRound: false,
      };
    } else {
      return {
        index: 3,
        name: 'Final Boss',
        timeLimitSec: 25,
        description: 'Final Boss stage: Hard questions! Wager up to 50% of your score before the question.',
        isWagerRound: true,
      };
    }
  }

  // Adaptive difficulty check
  private adjustNextQuestionIfAdaptive() {
    if (!this.adaptiveMode || this.questionAnalytics.length < 2) return;
    const lastTwo = this.questionAnalytics.slice(-2);
    const avgAcc = (lastTwo[0].accuracy + lastTwo[1].accuracy) / 2;

    const currentQIdx = this.currentQuestionIndex;
    const remaining = this.questions.slice(currentQIdx + 1);
    if (!remaining.length) return;

    if (avgAcc > 80) {
      // Pick next harder question from remaining
      const harderIdx = remaining.findIndex(q => q.difficulty === 'hard');
      if (harderIdx > 0) {
        const targetQ = remaining[harderIdx];
        this.questions.splice(currentQIdx + 1 + harderIdx, 1);
        this.questions.splice(currentQIdx + 1, 0, targetQ);
      }
    } else if (avgAcc < 40) {
      // Pick easier question from remaining
      const easierIdx = remaining.findIndex(q => q.difficulty === 'easy');
      if (easierIdx > 0) {
        const targetQ = remaining[easierIdx];
        this.questions.splice(currentQIdx + 1 + easierIdx, 1);
        this.questions.splice(currentQIdx + 1, 0, targetQ);
      }
    }
  }

  startNextQuestion() {
    if (this.questionTimer) clearTimeout(this.questionTimer);
    if (this.roundIntroTimer) clearTimeout(this.roundIntroTimer);
    if (this.wagerTimer) clearTimeout(this.wagerTimer);

    this.currentQuestionIndex += 1;

    // Check if game ended
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    const roundInfo = this.getRoundInfo(this.currentQuestionIndex, this.questions.length);
    const isNewRound = !this.currentRound || this.currentRound.name !== roundInfo.name;
    this.currentRound = roundInfo;

    // Reset player per-question flags
    for (const p of this.players.values()) {
      p.hasAnsweredCurrent = false;
      p.currentAnswer = undefined;
      p.activePowerup = null;
      p.eliminatedOptionIds = undefined;
      p.wager = 0;
    }

    if (isNewRound && this.gameMode === 'placement_season') {
      this.status = 'round_intro';
      this.broadcast({
        type: 'round_intro',
        roundIndex: roundInfo.index,
        roundName: roundInfo.name,
        description: roundInfo.description,
        timeLimitSec: roundInfo.timeLimitSec,
        isWagerRound: roundInfo.isWagerRound,
      });

      this.roundIntroTimer = setTimeout(() => {
        if (roundInfo.isWagerRound) {
          this.startWagerPhase();
        } else {
          this.launchQuestionActive();
        }
      }, 3500);
      return;
    }

    if (roundInfo.isWagerRound) {
      this.startWagerPhase();
      return;
    }

    this.launchQuestionActive();
  }

  private startWagerPhase() {
    this.status = 'wager_phase';
    this.broadcast({
      type: 'wager_phase',
      message: 'Final Boss round! Wager up to 50% of your score before seeing the question.',
      timeLimitMs: 7000,
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.questions.length,
    });

    this.wagerTimer = setTimeout(() => {
      this.launchQuestionActive();
    }, 7000);
  }

  submitWager(playerId: string, amount: number): boolean {
    const player = this.players.get(playerId);
    if (!player || this.status !== 'wager_phase') return false;
    const maxWager = Math.max(0, Math.floor(player.score * 0.5));
    const validWager = Math.max(0, Math.min(maxWager, Math.floor(amount || 0)));
    player.wager = validWager;

    this.sendToPlayer(player, {
      type: 'wager_confirmed',
      wager: validWager,
      maxWager,
    });
    return true;
  }

  private launchQuestionActive() {
    this.status = 'question_active';
    this.isPaused = false;
    const q = this.questions[this.currentQuestionIndex];
    this.questionTimeLimitMs = (this.currentRound?.timeLimitSec || 20) * 1000;
    this.questionStartTime = Date.now();

    // Prepare anti-cheat option shuffle per player
    this.playerOptionMaps.clear();
    this.playerReverseOptionMaps.clear();

    for (const player of this.players.values()) {
      // Create random permutation of indices 0, 1, 2, 3
      const perm = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const optMap: { [randomId: string]: number } = {};
      const revMap: { [origIdx: number]: string } = {};

      const mappedOptions = perm.map((origIdx, pos) => {
        const randomOptId = `opt-${Math.random().toString(36).substring(2, 7)}`;
        optMap[randomOptId] = origIdx;
        revMap[origIdx] = randomOptId;
        return {
          id: randomOptId,
          text: q.options[origIdx],
          shape: OKABE_ITO_SHAPES[pos].shape,
          symbol: OKABE_ITO_SHAPES[pos].symbol,
          color: OKABE_ITO_SHAPES[pos].color,
          colorName: OKABE_ITO_SHAPES[pos].name,
        };
      });

      this.playerOptionMaps.set(player.id, optMap);
      this.playerReverseOptionMaps.set(player.id, revMap);

      // Send personalized question view to this player (WITHOUT correct answer or explanation)
      this.sendToPlayer(player, {
        type: 'question_start',
        questionIndex: this.currentQuestionIndex,
        totalQuestions: this.questions.length,
        roundName: this.currentRound?.name || 'Standard',
        timeLimitMs: this.questionTimeLimitMs,
        startedAt: this.questionStartTime,
        question: {
          id: q.id,
          text: q.text,
          topic: q.topic,
          difficulty: q.difficulty,
          imageUrl: q.imageUrl,
          table: q.table,
          options: mappedOptions,
        },
        playerState: {
          score: player.score,
          streak: player.streak,
          usedPowerups: player.usedPowerups,
          activePowerup: player.activePowerup,
          wager: player.wager,
        },
      });
    }

    // Send question view to spectators and host (options shown in standard order with shapes)
    const spectatorOptions = q.options.map((optText, pos) => ({
      id: `std-opt-${pos}`,
      text: optText,
      shape: OKABE_ITO_SHAPES[pos].shape,
      symbol: OKABE_ITO_SHAPES[pos].symbol,
      color: OKABE_ITO_SHAPES[pos].color,
      colorName: OKABE_ITO_SHAPES[pos].name,
    }));

    const spectatorPayload = {
      type: 'question_start_spectator',
      questionIndex: this.currentQuestionIndex,
      totalQuestions: this.questions.length,
      roundName: this.currentRound?.name || 'Standard',
      timeLimitMs: this.questionTimeLimitMs,
      startedAt: this.questionStartTime,
      question: {
        id: q.id,
        text: q.text,
        topic: q.topic,
        difficulty: q.difficulty,
        imageUrl: q.imageUrl,
        table: q.table,
        options: spectatorOptions,
      },
    };

    if (this.hostWs && this.hostWs.readyState === WebSocket.OPEN) {
      this.hostWs.send(JSON.stringify(spectatorPayload));
    }
    for (const s of this.spectators) {
      if (s.readyState === WebSocket.OPEN) {
        s.send(JSON.stringify(spectatorPayload));
      }
    }

    // Set server-authoritative timer: timeLimitMs + 300ms grace window
    this.questionTimer = setTimeout(() => {
      this.evaluateRoundEnd();
    }, this.questionTimeLimitMs + 300);
  }

  activatePowerup(playerId: string, powerup: 'double_points' | 'fifty_fifty' | 'shield'): { success: boolean; error?: string; eliminatedOptionIds?: string[] } {
    const player = this.players.get(playerId);
    if (!player || this.status !== 'question_active') {
      return { success: false, error: 'Power-ups can only be activated while question is active.' };
    }
    if (player.hasAnsweredCurrent) {
      return { success: false, error: 'Cannot activate power-up after submitting answer.' };
    }
    if (player.activePowerup) {
      return { success: false, error: 'Only one power-up can be used per question.' };
    }
    if (player.usedPowerups[powerup]) {
      return { success: false, error: `Power-up "${powerup}" has already been used in this game.` };
    }

    player.usedPowerups[powerup] = true;
    player.activePowerup = powerup;

    let eliminatedOptionIds: string[] | undefined;

    if (powerup === 'fifty_fifty') {
      const q = this.questions[this.currentQuestionIndex];
      const correctOriginalIdx = q.correctAnswer;
      const optMap = this.playerOptionMaps.get(playerId) || {};
      const wrongRandomIds: string[] = [];

      for (const [rId, origIdx] of Object.entries(optMap)) {
        if (origIdx !== correctOriginalIdx) {
          wrongRandomIds.push(rId);
        }
      }

      // Pick 2 wrong IDs to remove
      wrongRandomIds.sort(() => Math.random() - 0.5);
      eliminatedOptionIds = wrongRandomIds.slice(0, 2);
      player.eliminatedOptionIds = eliminatedOptionIds;
    }

    this.sendToPlayer(player, {
      type: 'powerup_activated',
      powerup,
      eliminatedOptionIds,
      usedPowerups: player.usedPowerups,
    });

    return { success: true, eliminatedOptionIds };
  }

  // Process player answer
  async processAnswer(playerId: string, optionId: string, clientSendTime?: number): Promise<{ accepted: boolean; reason?: string }> {
    return this.acquireLock(async () => {
      const player = this.players.get(playerId);
      if (!player) return { accepted: false, reason: 'Player not found.' };

      if (this.status !== 'question_active') {
        return { accepted: false, reason: 'No active question.' };
      }

      if (player.hasAnsweredCurrent) {
        return { accepted: false, reason: 'Duplicate answer rejected: already answered.' };
      }

      const receiptTime = Date.now();
      const rawElapsedMs = receiptTime - this.questionStartTime;

      // Fair RTT compensation: credit back half of player's RTT (capped at 250 ms)
      const rttCredit = Math.min(250, player.rtt / 2);
      const effectiveElapsedMs = Math.max(0, rawElapsedMs - rttCredit);

      // Check grace window (300 ms after time limit)
      const allowedTime = this.questionTimeLimitMs + 300;
      if (effectiveElapsedMs > allowedTime) {
        player.hasAnsweredCurrent = true;
        player.currentAnswer = {
          optionId,
          elapsedMs: rawElapsedMs,
          effectiveElapsedMs,
          isCorrect: false,
          pointsAwarded: 0,
          isLate: true,
        };
        this.broadcastHostLiveStats();
        return { accepted: false, reason: 'Late answer rejected: time expired.' };
      }

      // Anti-cheat flag: answer faster than 400 ms
      if (effectiveElapsedMs < 400) {
        player.suspiciousAnswers += 1;
        this.suspiciousEvents.push({
          playerId: player.id,
          playerName: player.name,
          questionIndex: this.currentQuestionIndex,
          elapsedMs: effectiveElapsedMs,
        });
      }

      const optMap = this.playerOptionMaps.get(playerId) || {};
      const originalOptionIndex = optMap[optionId];
      const q = this.questions[this.currentQuestionIndex];
      const isCorrect = originalOptionIndex === q.correctAnswer;

      let pointsAwarded = 0;

      if (isCorrect) {
        // Scoring formula: 1000 at 0s down to 500 at limit
        const decayRatio = Math.min(1, Math.max(0, effectiveElapsedMs / this.questionTimeLimitMs));
        let basePoints = Math.round(1000 - decayRatio * 500);
        basePoints = Math.max(500, Math.min(1000, basePoints));

        // Streak bonus: +50 per consecutive correct, max +250
        const streakBonus = Math.min(250, player.streak * 50);
        pointsAwarded = basePoints + streakBonus;

        // Power-up modifications
        if (player.activePowerup === 'fifty_fifty') {
          // Players using 50-50 get max 70% of points
          pointsAwarded = Math.round(pointsAwarded * 0.70);
        } else if (player.activePowerup === 'double_points') {
          pointsAwarded = pointsAwarded * 2;
        }

        // Final Boss wager addition
        if (player.wager > 0) {
          pointsAwarded += player.wager;
        }

        player.streak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.streak);
        player.correctCount += 1;
      } else {
        // Wrong answer
        if (player.wager > 0) {
          // In Final Boss wager: deduct wager from score (capped at minimum 0)
          pointsAwarded = -player.wager;
        } else {
          pointsAwarded = 0;
        }

        if (player.activePowerup === 'shield') {
          // Shield preserves streak!
        } else {
          player.streak = 0;
        }
      }

      player.score = Math.max(0, player.score + pointsAwarded);
      player.totalAnswered += 1;
      player.totalResponseTimeMs += effectiveElapsedMs;

      // Update topic performance
      const topicKey = q.topic;
      if (!player.topicStats[topicKey]) {
        player.topicStats[topicKey] = { correct: 0, total: 0 };
      }
      player.topicStats[topicKey].total += 1;
      if (isCorrect) {
        player.topicStats[topicKey].correct += 1;
      }

      player.hasAnsweredCurrent = true;
      player.currentAnswer = {
        optionId,
        elapsedMs: rawElapsedMs,
        effectiveElapsedMs,
        isCorrect,
        pointsAwarded,
        isLate: false,
      };

      // Send immediate acknowledgment to player (without revealing correct answer yet!)
      this.sendToPlayer(player, {
        type: 'answer_received',
        effectiveElapsedMs,
      });

      // Update host dashboard live stats
      this.broadcastHostLiveStats();

      // Check if all connected players have answered
      const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);
      const allAnswered = connectedPlayers.every(p => p.hasAnsweredCurrent);
      if (allAnswered && connectedPlayers.length > 0) {
        if (this.questionTimer) clearTimeout(this.questionTimer);
        this.evaluateRoundEnd();
      }

      return { accepted: true };
    });
  }

  pauseGame(): boolean {
    if (this.status !== 'question_active' || this.isPaused) return false;
    this.isPaused = true;
    if (this.questionTimer) clearTimeout(this.questionTimer);
    const elapsed = Date.now() - this.questionStartTime;
    this.pauseRemainingMs = Math.max(0, this.questionTimeLimitMs - elapsed);
    this.broadcast({
      type: 'game_paused',
      remainingMs: this.pauseRemainingMs,
    });
    return true;
  }

  resumeGame(): boolean {
    if (this.status !== 'question_active' || !this.isPaused) return false;
    this.isPaused = false;
    this.questionStartTime = Date.now() - (this.questionTimeLimitMs - this.pauseRemainingMs);
    this.questionTimer = setTimeout(() => {
      this.evaluateRoundEnd();
    }, this.pauseRemainingMs + 300);

    this.broadcast({
      type: 'game_resumed',
      remainingMs: this.pauseRemainingMs,
    });
    return true;
  }

  skipQuestion(): boolean {
    if (this.status !== 'question_active') return false;
    if (this.questionTimer) clearTimeout(this.questionTimer);
    this.evaluateRoundEnd();
    return true;
  }

  kickPlayer(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({ type: 'kicked', message: 'You have been removed from the room by the host.' }));
      player.ws.close();
    }
    this.removePlayer(playerId);
    this.broadcastHostLiveStats();
    this.broadcastLobbyUpdate();
    return true;
  }

  reportTabSwitch(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      player.tabSwitchCount += 1;
      this.broadcastHostLiveStats();
    }
  }

  // End of current question: reveal answer, calculate ranks, send round scores
  evaluateRoundEnd() {
    this.status = 'question_review';
    const q = this.questions[this.currentQuestionIndex];

    // Compute distribution across original options 0..3
    const distribution: number[] = [0, 0, 0, 0];
    let correctCount = 0;
    let totalAnswered = 0;
    let totalRespTime = 0;

    for (const player of this.players.values()) {
      if (player.currentAnswer && !player.currentAnswer.isLate) {
        totalAnswered += 1;
        totalRespTime += player.currentAnswer.effectiveElapsedMs;
        const optMap = this.playerOptionMaps.get(player.id) || {};
        const origIdx = optMap[player.currentAnswer.optionId];
        if (typeof origIdx === 'number' && origIdx >= 0 && origIdx <= 3) {
          distribution[origIdx] += 1;
        }
        if (player.currentAnswer.isCorrect) {
          correctCount += 1;
        }
      }
    }

    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const avgResponseTimeMs = totalAnswered > 0 ? Math.round(totalRespTime / totalAnswered) : 0;

    // Record question analytics
    const distMap: { [opt: string]: number } = {};
    q.options.forEach((optText, idx) => {
      distMap[optText] = distribution[idx];
    });

    this.questionAnalytics.push({
      questionIndex: this.currentQuestionIndex,
      questionText: q.text,
      topic: q.topic,
      difficulty: q.difficulty,
      totalAnswered,
      correctCount,
      accuracy,
      averageResponseTimeMs: avgResponseTimeMs,
      distribution: distMap,
    });

    // Check adaptive difficulty adjustment for next question
    this.adjustNextQuestionIfAdaptive();

    // Compute leaderboard & rank deltas
    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    sortedPlayers.forEach((player, rankIndex) => {
      const currentRank = rankIndex + 1;
      if (player.previousRank !== undefined) {
        player.rankDelta = player.previousRank - currentRank; // positive = moved up
      } else {
        player.rankDelta = 0;
      }
      player.previousRank = currentRank;
    });

    const leaderboard = sortedPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      score: p.score,
      rank: idx + 1,
      rankDelta: p.rankDelta || 0,
      pointsGained: p.currentAnswer?.pointsAwarded || 0,
      avatarColor: p.avatarColor,
      streak: p.streak,
    }));

    // Compute team leaderboard
    const teamMap = new Map<string, { totalScore: number; count: number }>();
    for (const p of this.players.values()) {
      if (p.teamName) {
        const t = teamMap.get(p.teamName) || { totalScore: 0, count: 0 };
        t.totalScore += p.score;
        t.count += 1;
        teamMap.set(p.teamName, t);
      }
    }

    const teamLeaderboard = Array.from(teamMap.entries())
      .map(([teamName, data]) => ({
        teamName,
        averageScore: Math.round(data.totalScore / data.count),
        memberCount: data.count,
        rank: 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((t, idx) => ({ ...t, rank: idx + 1 }));

    // Send personalized question review to each player
    for (const player of this.players.values()) {
      const revMap = this.playerReverseOptionMaps.get(player.id) || {};
      const correctPlayerOptionId = revMap[q.correctAnswer];

      this.sendToPlayer(player, {
        type: 'question_ended',
        correctOptionId: correctPlayerOptionId,
        correctAnswerText: q.options[q.correctAnswer],
        correctAnswerIndex: q.correctAnswer,
        explanation: q.explanation || 'Step-by-step placement practice solution.',
        distribution,
        isCorrect: player.currentAnswer?.isCorrect || false,
        pointsGained: player.currentAnswer?.pointsAwarded || 0,
        currentScore: player.score,
        currentStreak: player.streak,
        leaderboard,
        teamLeaderboard,
        isLastQuestion: this.currentQuestionIndex >= this.questions.length - 1,
      });
    }

    // Send review payload to host and spectators
    const hostSpectatorReview = {
      type: 'question_ended_spectator',
      correctAnswerIndex: q.correctAnswer,
      correctAnswerText: q.options[q.correctAnswer],
      explanation: q.explanation || 'Step-by-step placement practice solution.',
      distribution,
      leaderboard,
      teamLeaderboard,
      isLastQuestion: this.currentQuestionIndex >= this.questions.length - 1,
    };

    if (this.hostWs && this.hostWs.readyState === WebSocket.OPEN) {
      this.hostWs.send(JSON.stringify(hostSpectatorReview));
    }
    for (const s of this.spectators) {
      if (s.readyState === WebSocket.OPEN) {
        s.send(JSON.stringify(hostSpectatorReview));
      }
    }
  }

  // End of entire game
  endGame() {
    this.status = 'game_ended';

    // Record college scores in database
    const scoresList = Array.from(this.players.values()).map(p => ({
      name: p.name,
      score: p.score,
    }));
    db.recordFinishedGame(this.collegeName, scoresList);

    const sortedPlayers = Array.from(this.players.values()).sort((a, b) => b.score - a.score);
    const finalLeaderboard = sortedPlayers.map((p, idx) => ({
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      score: p.score,
      rank: idx + 1,
      accuracy: p.totalAnswered > 0 ? Math.round((p.correctCount / p.totalAnswered) * 100) : 0,
      avatarColor: p.avatarColor,
      bestStreak: p.bestStreak,
    }));

    // Host analytics
    const mostMissedQuestions = [...this.questionAnalytics]
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Topic strength across room
    const roomTopicAgg: Record<string, { correct: number; total: number }> = {};
    for (const p of this.players.values()) {
      for (const [topic, stat] of Object.entries(p.topicStats)) {
        if (!roomTopicAgg[topic]) roomTopicAgg[topic] = { correct: 0, total: 0 };
        roomTopicAgg[topic].correct += stat.correct;
        roomTopicAgg[topic].total += stat.total;
      }
    }

    const topicRoomStrength: Record<string, number> = {};
    for (const [topic, stat] of Object.entries(roomTopicAgg)) {
      topicRoomStrength[topic] = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
    }

    const suspiciousPlayers = Array.from(this.players.values())
      .filter(p => p.suspiciousAnswers > 0 || p.tabSwitchCount > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        suspiciousCount: p.suspiciousAnswers,
        tabSwitchCount: p.tabSwitchCount,
      }));

    const hostAnalytics = {
      collegeName: this.collegeName,
      totalPlayers: this.players.size,
      mostMissedQuestions,
      perQuestionStats: this.questionAnalytics,
      topicStrength: topicRoomStrength,
      suspiciousPlayers,
    };

    // Calculate per-player placement readiness and personal metrics
    for (const player of this.players.values()) {
      const accuracy = player.totalAnswered > 0 ? (player.correctCount / player.totalAnswered) * 100 : 0;
      const avgResponseTimeMs = player.totalAnswered > 0 ? player.totalResponseTimeMs / player.totalAnswered : 10000;

      // Speed score: 0 to 100 (faster response = higher score; 2s -> 100, 15s -> 20)
      const speedScore = Math.max(0, Math.min(100, Math.round(100 - (avgResponseTimeMs / 15000) * 80)));
      // Consistency score: best streak normalized to total questions (up to 100)
      const consistencyScore = Math.min(100, Math.round((player.bestStreak / Math.max(1, this.questions.length)) * 100));

      // Placement Readiness Score out of 100: 60% accuracy, 25% speed, 15% consistency
      const readinessScore = Math.min(100, Math.max(0, Math.round(
        0.60 * accuracy + 0.25 * speedScore + 0.15 * consistencyScore
      )));

      // Find weakest topic & generate one-line tip
      let weakestTopic = 'quantitative';
      let lowestTopicAcc = 101;
      let strongestTopic = 'quantitative';
      let highestTopicAcc = -1;

      for (const [topic, stat] of Object.entries(player.topicStats)) {
        if (stat.total > 0) {
          const acc = (stat.correct / stat.total) * 100;
          if (acc < lowestTopicAcc) {
            lowestTopicAcc = acc;
            weakestTopic = topic;
          }
          if (acc > highestTopicAcc) {
            highestTopicAcc = acc;
            strongestTopic = topic;
          }
        }
      }

      const weaknessTips: Record<string, string> = {
        quantitative: 'Tip: Revise speed math, Time & Work shortcuts, and CI/SI formulas for corporate aptitude rounds.',
        logical: 'Tip: Practice circular seating arrangements, syllogisms, and coded blood relations daily.',
        verbal: 'Tip: Focus on subject-verb agreement rules, reading comprehension tone, and vocabulary roots.',
        data_interpretation: 'Tip: Improve table scanning techniques and percentage-increase estimation without heavy calculations.',
      };

      const weaknessTip = weaknessTips[weakestTopic] || 'Tip: Consistent daily practice elevates placement test percentiles!';

      const playerRank = sortedPlayers.findIndex(p => p.id === player.id) + 1;

      this.sendToPlayer(player, {
        type: 'game_ended',
        finalLeaderboard,
        personalResult: {
          rank: playerRank,
          score: player.score,
          accuracy: Math.round(accuracy),
          avgResponseTimeMs: Math.round(avgResponseTimeMs),
          bestStreak: player.bestStreak,
          readinessScore,
          topicStrength: player.topicStats,
          weakestTopic,
          strongestTopic,
          weaknessTip,
          collegeName: this.collegeName,
          playerName: player.name,
        },
      });
    }

    // Send game end to host and spectators
    const finalEvent = {
      type: 'game_ended_spectator',
      finalLeaderboard,
      hostAnalytics,
    };

    if (this.hostWs && this.hostWs.readyState === WebSocket.OPEN) {
      this.hostWs.send(JSON.stringify(finalEvent));
    }
    for (const s of this.spectators) {
      if (s.readyState === WebSocket.OPEN) {
        s.send(JSON.stringify(finalEvent));
      }
    }
  }

  // Host live stats broadcast
  broadcastHostLiveStats() {
    if (!this.hostWs || this.hostWs.readyState !== WebSocket.OPEN) return;

    let answeredCount = 0;
    const distribution: { [optIdx: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (const p of this.players.values()) {
      if (p.hasAnsweredCurrent) {
        answeredCount += 1;
        if (p.currentAnswer && !p.currentAnswer.isLate) {
          const optMap = this.playerOptionMaps.get(p.id) || {};
          const origIdx = optMap[p.currentAnswer.optionId];
          if (typeof origIdx === 'number') {
            distribution[origIdx] = (distribution[origIdx] || 0) + 1;
          }
        }
      }
    }

    const connectedPlayers = Array.from(this.players.values()).filter(p => p.isConnected);

    this.hostWs.send(JSON.stringify({
      type: 'host_live_stats',
      answeredCount,
      totalPlayers: connectedPlayers.length,
      distribution,
      adaptiveMode: this.adaptiveMode,
      suspiciousEventsCount: this.suspiciousEvents.length,
      tabSwitchTotal: Array.from(this.players.values()).reduce((acc, p) => acc + p.tabSwitchCount, 0),
    }));
  }

  broadcastLobbyUpdate() {
    const playerList = Array.from(this.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      teamName: p.teamName,
      avatarColor: p.avatarColor,
      isConnected: p.isConnected,
    }));

    this.broadcast({
      type: 'lobby_update',
      code: this.code,
      collegeName: this.collegeName,
      questionCount: this.questions.length,
      gameMode: this.gameMode,
      adaptiveMode: this.adaptiveMode,
      players: playerList,
      status: this.status,
    });
  }

  broadcast(message: object) {
    const raw = JSON.stringify(message);
    for (const player of this.players.values()) {
      if (player.ws && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(raw);
      }
    }
    if (this.hostWs && this.hostWs.readyState === WebSocket.OPEN) {
      this.hostWs.send(raw);
    }
    for (const s of this.spectators) {
      if (s.readyState === WebSocket.OPEN) {
        s.send(raw);
      }
    }
  }

  sendToPlayer(player: Player, message: object) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }
}

// Global Room Manager
export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(params: {
    questionSet: QuestionSet;
    collegeName: string;
    gameMode?: GameMode;
    adaptiveMode?: boolean;
    hostWs?: WebSocket;
  }): { room: Room; code: string; hostToken: string } {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }
    const hostToken = `host-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
    const room = new Room(
      code,
      hostToken,
      params.collegeName,
      params.questionSet,
      params.gameMode || 'standard',
      params.adaptiveMode || false
    );
    room.hostWs = params.hostWs;
    this.rooms.set(code, room);
    return { room, code, hostToken };
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string) {
    this.rooms.delete(code.toUpperCase());
  }
}

export const roomManager = new RoomManager();
