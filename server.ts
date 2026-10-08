import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db, QuestionSet } from './server/db';
import { roomManager, Room, Player, OKABE_ITO_SHAPES } from './server/game';
import { generateAIQuestions } from './server/ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// REST APIs
app.post('/api/ai/generate-questions', async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    const questions = await generateAIQuestions({
      topic: topic || 'quantitative',
      difficulty: difficulty || 'medium',
      count: count || 3,
    });
    res.json({ success: true, questions });
  } catch (err: any) {
    console.error('Error in generate-questions API:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed generating questions' });
  }
});

app.get('/api/question-sets', (req, res) => {
  const sets = db.getQuestionSets();
  res.json({ success: true, questionSets: sets });
});

app.get('/api/question-sets/:id', (req, res) => {
  const set = db.getQuestionSetById(req.params.id);
  if (!set) {
    res.status(404).json({ success: false, error: 'Question set not found' });
    return;
  }
  res.json({ success: true, questionSet: set });
});

app.post('/api/question-sets', (req, res) => {
  try {
    const { id, title, description, collegeName, questions } = req.body;
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, error: 'Title and at least one question are required.' });
      return;
    }
    const questionSet: QuestionSet = {
      id: id || `qs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: (description || '').trim(),
      collegeName: (collegeName || '').trim(),
      createdAt: Date.now(),
      questions,
    };
    db.saveQuestionSet(questionSet);
    res.json({ success: true, questionSet });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/question-sets/:id', (req, res) => {
  const deleted = db.deleteQuestionSet(req.params.id);
  res.json({ success: deleted });
});

// College League API
app.get('/api/league', (req, res) => {
  const filter = (req.query.filter as 'this_week' | 'this_month' | 'all_time') || 'all_time';
  const league = db.getCollegeLeague(filter);
  res.json({ success: true, league });
});

// Daily Challenge APIs
app.get('/api/daily', (req, res) => {
  const questions = db.getDailyChallengeQuestions();
  // Strip out correct answers for daily play
  const clientQuestions = questions.map(q => ({
    id: q.id,
    text: q.text,
    options: q.options,
    topic: q.topic,
    difficulty: q.difficulty,
    table: q.table,
    imageUrl: q.imageUrl,
  }));
  res.json({ success: true, questions: clientQuestions });
});

app.post('/api/daily/submit', (req, res) => {
  const { deviceId, playerName, collegeName, answers } = req.body;
  if (!deviceId || !playerName || !collegeName || !Array.isArray(answers)) {
    res.status(400).json({ success: false, error: 'Missing required submission fields.' });
    return;
  }

  if (db.hasSubmittedDaily(deviceId)) {
    res.status(400).json({ success: false, error: 'You have already attempted the daily challenge today!' });
    return;
  }

  const dailyQuestions = db.getDailyChallengeQuestions();
  let correctCount = 0;
  dailyQuestions.forEach((q, idx) => {
    if (answers[idx] === q.correctAnswer) {
      correctCount += 1;
    }
  });

  const accuracy = Math.round((correctCount / dailyQuestions.length) * 100);
  const score = correctCount * 1000;

  const result = db.submitDailyChallenge({
    deviceId,
    playerName: playerName.trim(),
    collegeName: collegeName.trim(),
    score,
    accuracy,
    completedAt: Date.now(),
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.message });
    return;
  }

  res.json({
    success: true,
    score,
    accuracy,
    correctCount,
    totalQuestions: dailyQuestions.length,
    explanations: dailyQuestions.map(q => ({
      id: q.id,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
  });
});

app.get('/api/daily/leaderboard', (req, res) => {
  const leaderboard = db.getDailyLeaderboard();
  res.json({ success: true, leaderboard });
});

// Host Analytics CSV Export
app.get('/api/rooms/:code/export-csv', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    res.status(404).send('Room not found');
    return;
  }

  const lines: string[] = [];
  lines.push(`AptiQuiz Placement Arena - Room ${room.code} Analytics`);
  lines.push(`College,${room.collegeName}`);
  lines.push(`Date,${new Date(room.createdAt).toISOString()}`);
  lines.push(`Game Mode,${room.gameMode}`);
  lines.push('');

  // Player Summary
  lines.push('PLAYER LEADERBOARD SUMMARY');
  lines.push('Rank,Player Name,Team,Score,Accuracy (%),Best Streak,Avg Response Time (ms),Tab Switch Alerts,Suspicious <400ms Flags');
  const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
  sortedPlayers.forEach((p, idx) => {
    const acc = p.totalAnswered > 0 ? Math.round((p.correctCount / p.totalAnswered) * 100) : 0;
    const avgTime = p.totalAnswered > 0 ? Math.round(p.totalResponseTimeMs / p.totalAnswered) : 0;
    lines.push(`${idx + 1},"${p.name}","${p.teamName || ''}",${p.score},${acc},${p.bestStreak},${avgTime},${p.tabSwitchCount},${p.suspiciousAnswers}`);
  });

  lines.push('');
  // Question Breakdown
  lines.push('QUESTION PERFORMANCE BREAKDOWN');
  lines.push('Question #,Topic,Difficulty,Question Text,Total Answered,Correct Count,Accuracy (%),Avg Response Time (ms)');
  room.questionAnalytics.forEach(q => {
    const cleanText = q.questionText.replace(/"/g, '""');
    lines.push(`${q.questionIndex + 1},${q.topic},${q.difficulty},"${cleanText}",${q.totalAnswered},${q.correctCount},${q.accuracy},${q.averageResponseTimeMs}`);
  });

  const csvContent = lines.join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="aptiquiz_${room.code}_results.csv"`);
  res.send(csvContent);
});

// WebSocket Connection Management
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  messageCount: number;
  lastMessageReset: number;
  playerId?: string;
  roomCode?: string;
  isHost?: boolean;
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  ws.messageCount = 0;
  ws.lastMessageReset = Date.now();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (data: string) => {
    ws.isAlive = true;
    // Rate limit check: max 20 messages per second per connection
    const now = Date.now();
    if (now - ws.lastMessageReset > 1000) {
      ws.messageCount = 0;
      ws.lastMessageReset = now;
    }
    ws.messageCount += 1;
    if (ws.messageCount > 25) {
      ws.send(JSON.stringify({ type: 'error', message: 'Rate limit exceeded.' }));
      return;
    }

    try {
      const msg = JSON.parse(data.toString());
      const { type } = msg;

      // Heartbeat Ping/Pong for RTT calculation
      if (type === 'ping') {
        const clientTimestamp = msg.clientTimestamp || 0;
        const serverTimestamp = Date.now();
        ws.send(JSON.stringify({
          type: 'pong',
          clientTimestamp,
          serverTimestamp,
        }));

        // If this connection is associated with a player in a room, update RTT
        if (ws.roomCode && ws.playerId) {
          const room = roomManager.getRoom(ws.roomCode);
          if (room) {
            const player = room.players.get(ws.playerId);
            if (player && msg.rtt) {
              player.rtt = Math.max(10, Math.min(2000, Number(msg.rtt)));
              player.lastPingTime = serverTimestamp;
            }
          }
        }
        return;
      }

      // Host creates room
      if (type === 'create_room') {
        const { questionSetId, collegeName, gameMode, adaptiveMode } = msg;
        const set = questionSetId ? db.getQuestionSetById(questionSetId) : db.getQuestionSets()[0];
        if (!set) {
          ws.send(JSON.stringify({ type: 'error', message: 'Question set not found.' }));
          return;
        }

        const { room, code, hostToken } = roomManager.createRoom({
          questionSet: set,
          collegeName: collegeName || 'General College Arena',
          gameMode: gameMode || 'standard',
          adaptiveMode: Boolean(adaptiveMode),
          hostWs: ws,
        });

        ws.roomCode = code;
        ws.isHost = true;

        ws.send(JSON.stringify({
          type: 'room_created',
          code,
          hostToken,
          collegeName: room.collegeName,
          questionCount: room.questions.length,
          gameMode: room.gameMode,
          adaptiveMode: room.adaptiveMode,
        }));
        return;
      }

      // Host reconnects
      if (type === 'reconnect_host') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid host credentials or room expired.' }));
          return;
        }

        room.hostWs = ws;
        ws.roomCode = room.code;
        ws.isHost = true;

        ws.send(JSON.stringify({
          type: 'host_reconnected',
          code: room.code,
          collegeName: room.collegeName,
          questionCount: room.questions.length,
          gameMode: room.gameMode,
          adaptiveMode: room.adaptiveMode,
          status: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          players: Array.from(room.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            teamName: p.teamName,
            avatarColor: p.avatarColor,
            score: p.score,
            streak: p.streak,
            isConnected: p.isConnected,
            tabSwitchCount: p.tabSwitchCount,
            suspiciousAnswers: p.suspiciousAnswers,
          })),
        }));
        return;
      }

      // Player joins room
      if (type === 'join_room') {
        const { code, name, teamName, playerToken } = msg;
        if (!code) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room code is required.' }));
          return;
        }

        const room = roomManager.getRoom(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: `Room "${code}" not found. Please check the 5-character code.` }));
          return;
        }

        const result = room.addPlayer(name || 'Player', teamName, playerToken, ws);
        if (result.error) {
          ws.send(JSON.stringify({ type: 'error', message: result.error }));
          return;
        }

        const player = result.player;
        ws.roomCode = room.code;
        ws.playerId = player.id;

        // Inform player of successful join
        ws.send(JSON.stringify({
          type: 'joined_room',
          code: room.code,
          collegeName: room.collegeName,
          player: {
            id: player.id,
            token: player.token,
            name: player.name,
            teamName: player.teamName,
            avatarColor: player.avatarColor,
            score: player.score,
            streak: player.streak,
            usedPowerups: player.usedPowerups,
          },
          gameMode: room.gameMode,
          roomStatus: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.questions.length,
        }));

        // If joining mid-game and question is active, send current question view to player
        if (room.status === 'question_active' && room.currentQuestionIndex >= 0) {
          const q = room.questions[room.currentQuestionIndex];
          const elapsed = Date.now() - room.questionStartTime;
          const remainingMs = Math.max(0, room.questionTimeLimitMs - elapsed);

          // Get player's mapped options
          let optMap = room.playerOptionMaps.get(player.id);
          if (!optMap) {
            // Generate shuffle for this reconnecting/late-joining player
            const perm = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
            optMap = {};
            const revMap: { [origIdx: number]: string } = {};
            const mappedOptions = perm.map((origIdx, pos) => {
              const rId = `opt-${Math.random().toString(36).substring(2, 7)}`;
              optMap![rId] = origIdx;
              revMap[origIdx] = rId;
              return {
                id: rId,
                text: q.options[origIdx],
                shape: OKABE_ITO_SHAPES[pos].shape,
                symbol: OKABE_ITO_SHAPES[pos].symbol,
                color: OKABE_ITO_SHAPES[pos].color,
                colorName: OKABE_ITO_SHAPES[pos].name,
              };
            });
            room.playerOptionMaps.set(player.id, optMap);
            room.playerReverseOptionMaps.set(player.id, revMap);
          }

          const optEntries = Object.entries(optMap);
          const mappedOptions = optEntries.map(([rId, origIdx], pos) => ({
            id: rId,
            text: q.options[origIdx],
            shape: OKABE_ITO_SHAPES[pos % 4].shape,
            symbol: OKABE_ITO_SHAPES[pos % 4].symbol,
            color: OKABE_ITO_SHAPES[pos % 4].color,
            colorName: OKABE_ITO_SHAPES[pos % 4].name,
          }));

          ws.send(JSON.stringify({
            type: 'question_start',
            questionIndex: room.currentQuestionIndex,
            totalQuestions: room.questions.length,
            roundName: room.currentRound?.name || 'Standard',
            timeLimitMs: room.questionTimeLimitMs,
            remainingMs,
            startedAt: room.questionStartTime,
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
          }));
        }

        // Notify room of updated lobby / player list
        room.broadcastLobbyUpdate();
        room.broadcastHostLiveStats();
        return;
      }

      // Spectator joins
      if (type === 'spectator_join') {
        const { code } = msg;
        const room = roomManager.getRoom(code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: `Room "${code}" not found.` }));
          return;
        }

        room.spectators.add(ws);
        ws.roomCode = room.code;

        ws.send(JSON.stringify({
          type: 'spectator_connected',
          code: room.code,
          collegeName: room.collegeName,
          status: room.status,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.questions.length,
          gameMode: room.gameMode,
        }));
        return;
      }

      // Host: Start Game
      if (type === 'start_game') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized host action.' }));
          return;
        }

        if (room.status !== 'lobby') {
          ws.send(JSON.stringify({ type: 'error', message: 'Game has already started.' }));
          return;
        }

        room.startNextQuestion();
        return;
      }

      // Host: Next Question (from review phase)
      if (type === 'next_question') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized host action.' }));
          return;
        }

        room.startNextQuestion();
        return;
      }

      // Host: Pause Game
      if (type === 'pause_game') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) return;
        room.pauseGame();
        return;
      }

      // Host: Resume Game
      if (type === 'resume_game') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) return;
        room.resumeGame();
        return;
      }

      // Host: Skip Question
      if (type === 'skip_question') {
        const { code, hostToken } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) return;
        room.skipQuestion();
        return;
      }

      // Host: Kick Player
      if (type === 'kick_player') {
        const { code, hostToken, playerId } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) return;
        room.kickPlayer(playerId);
        return;
      }

      // Host: Toggle Adaptive Mode
      if (type === 'toggle_adaptive') {
        const { code, hostToken, enabled } = msg;
        const room = roomManager.getRoom(code);
        if (!room || room.hostToken !== hostToken) return;
        room.adaptiveMode = Boolean(enabled);
        room.broadcast({ type: 'adaptive_toggled', enabled: room.adaptiveMode });
        return;
      }

      // Player: Submit Wager (in Final Boss round)
      if (type === 'submit_wager') {
        const { code, playerId, amount } = msg;
        const room = roomManager.getRoom(code);
        if (!room) return;
        room.submitWager(playerId, Number(amount));
        return;
      }

      // Player: Activate Power-Up
      if (type === 'activate_powerup') {
        const { code, playerId, powerup } = msg;
        const room = roomManager.getRoom(code);
        if (!room) return;
        const result = room.activatePowerup(playerId, powerup);
        if (!result.success) {
          ws.send(JSON.stringify({ type: 'error', message: result.error }));
        }
        return;
      }

      // Player: Submit Answer
      if (type === 'submit_answer') {
        const { code, playerId, optionId, clientSendTime } = msg;
        const room = roomManager.getRoom(code);
        if (!room) return;
        const result = await room.processAnswer(playerId, optionId, clientSendTime);
        if (!result.accepted && result.reason) {
          ws.send(JSON.stringify({ type: 'answer_rejected', reason: result.reason }));
        }
        return;
      }

      // Player: Report Tab Switch / Blur event
      if (type === 'report_tab_switch') {
        const { code, playerId } = msg;
        const room = roomManager.getRoom(code);
        if (room) {
          room.reportTabSwitch(playerId);
        }
        return;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (ws.roomCode) {
      const room = roomManager.getRoom(ws.roomCode);
      if (room) {
        if (ws.isHost) {
          // Host disconnected temporarily; keep room active
          room.hostWs = undefined;
        } else if (ws.playerId) {
          const player = room.players.get(ws.playerId);
          if (player) {
            player.isConnected = false;
            player.ws = undefined;
            room.broadcastLobbyUpdate();
          }
        }
        room.spectators.delete(ws);
      }
    }
  });
});

// Periodic ping heartbeat to all connections to track RTT and keep alive
setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const extWs = ws as ExtendedWebSocket;
    if (!extWs.isAlive) {
      return ws.terminate();
    }
    extWs.isAlive = false;
    ws.ping();
  });
}, 15000);

// Setup Vite dev server or static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AptiQuiz Arena] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
