# AptiQuiz: Placement Arena

**Real-Time Multiplayer Aptitude Arena for College Placement Drives**

AptiQuiz is an arcade-styled, live multiplayer aptitude assessment platform designed for college placement cells, mock hiring drives, and engineering campus recruitment prep (TCS NQT, Infosys, Deloitte, Goldman Sachs, and tech enterprise tests).

Built with a full-stack Node.js/Express + WebSocket backend and React frontend with Tailwind CSS, AptiQuiz enforces strict server-authoritative timekeeping, anti-cheat randomized options, fair network delay compensation, and instant Placement Readiness feedback.

---

## 🚀 Key Features

### 1. Placement Season Mode (3 Dynamic Stages)
- **Stage 1: Warm-up** – Easy foundational questions (20s timer) to build initial accuracy and multiplier streaks.
- **Stage 2: Pressure** – Medium analytical questions with a rapid 15s timer to test high-stress quick thinking.
- **Stage 3: Final Boss** – Hard questions with a **Wager Phase**: Candidates wager up to 50% of their current score before the question is revealed. Answer correctly and win the wagered points; answer incorrectly and lose the wagered points (floored at 0 minimum score).
- Seamless animated stage intro screens between rounds with custom sound effects.

### 2. Tactical Power-Ups (Single Use Per Game)
All power-up validations and execution occur strictly on the server:
- ⚡ **Double Points**: Multiplies round points by 2x for that question if answered correctly.
- ✂️ **50-50**: The server eliminates two incorrect options specifically for that candidate's device (points capped at 70%).
- 🛡️ **Shield**: An incorrect answer will not reset the candidate's hot streak.
- *Limit:* Exactly one of each per game; max one power-up per question; must be armed before submitting the answer.

### 3. Team Battles
- Candidates can optionally join with a Team Name (e.g., `Team Alpha`, `BinaryBeasts`).
- **Team Score = Average of all members' scores** so teams of 3 vs 5 compete on fair mathematical ground.
- Toggleable Team Leaderboard displayed alongside the individual Race Track.

### 4. AI Question Generator for Hosts
- Integrated with Google GenAI (`gemini-3.8-flash`) via `@google/genai`.
- Hosts select domain topic (Quantitative, Logical, Verbal, Data Interpretation), target difficulty, and question count.
- Generates 4 options, verified correct answer, and clear step-by-step placement explanations with optional tabular datasets.
- *Strict Rule:* AI generation is used **exclusively while authoring**, never during live gameplay.
- Seeded with 15 corporate campus placement questions across all 4 syllabus domains.

### 5. Live Host Control Station & Adaptive Difficulty
- Live counter showing candidates who have answered.
- Real-time answer distribution chart.
- Host controls: Pause Timer, Resume Timer, Skip Question, and Kick Player.
- **Adaptive Mode Toggle:** If room accuracy on the last 2 questions exceeds 80%, the server automatically picks a harder question from the remaining pool; if below 40%, it picks an easier question.

### 6. Post-Game Host Analytics & CSV Export
- Detailed breakdown of the **Most-Missed Questions** (priority revision areas for placement mentors).
- Per-question accuracy and average response times.
- Cohort proficiency bars across Quantitative, Logical, Verbal, and Data Interpretation.
- Suspicious activity alerts (&lt;400ms submissions and tab switches).
- **One-Click CSV Export** of all candidate scores, streaks, times, and question breakdowns.

### 7. Daily Placement Sprint (`/daily`)
- 5 synchronized placement questions served daily.
- Server-timed with 1 attempt per device per day.
- Daily streak flame 🔥 tracker stored locally.
- Daily inter-college ranking leaderboard.

### 8. Shareable Result Card & Placement Readiness Score
- Generates a **Placement Readiness Score (out of 100)**:
  $$\text{Score} = 60\% \times \text{Accuracy} + 25\% \times \text{Speed} + 15\% \times \text{Consistency}$$
- Personalized one-line improvement recommendation addressing the candidate's weakest domain.
- **Downloadable High-Res Card:** Click "Download as Image" to export an esports result card directly from HTML5 Canvas.

### 9. Accessibility, Visual Style & Anti-Cheat
- **Dark Arcade/Esports Aesthetic:** High-contrast palette, big rounded buttons, animated racetrack avatars.
- **Color-Blind-Safe Palette (Okabe-Ito):** Every answer option is paired with both a distinct shape and color (▲ Orange Triangle, ● Sky-Blue Circle, ■ Green Square, ◆ Vermilion Diamond). Colour is never used alone.
- **Settings:** Sound on/off toggle, Large-Text mode (Aa), and Low-Data mode (disables animations and image loading).
- **Integrity Tracking:** Tracks tab-switch/window-blur events and flags them for the host as an advisory alert without unfairly banning students.

---

## ⏱️ Scoring Rules & Why

| Mechanism | Rule | Rationalization |
| :--- | :--- | :--- |
| **Speed-Decay Points** | 1,000 pts at 0.0s decreasing linearly to 500 pts at the time limit. | Rewards rapid cognitive recall and problem-solving velocity, essential for competitive hiring rounds. |
| **No Negative Marking** | 0 points for incorrect answers (during regular rounds). | Beginner-friendly; encourages candidates to make calculated deductions without fear of elimination. |
| **Hot Streak Multiplier** | +50 pts per consecutive correct answer (capped at +250 pts). | Incentivizes sustained accuracy and focus across the entire assessment. |
| **Final Boss Wager** | Risk up to 50% of current score before the question. | Simulates high-stakes interview trade-offs; separates bold top-performers from risk-averse players. |

$$\text{PointsAwarded} = \text{round}\left(1000 - \frac{\text{effectiveElapsedMs}}{\text{timeLimitMs}} \times 500\right) + \min(250, \text{streak} \times 50)$$

---

## 🌐 Network Delay & Fair Play

### 1. Server is the Sole Referee
The server dictates when each question begins, calculates elapsed time, and determines timeouts. The client displays the state but is **never trusted** with score calculations or timing timestamps.

### 2. Fair RTT Compensation (In Plain English)
When candidates play on mobile campus Wi-Fi or 4G data, network packets take time to travel back and forth:
- The server continuously measures each player's round-trip time (RTT) via lightweight ping/pong heartbeats every 2 seconds.
- When a candidate clicks an answer, the packet travels across the internet to the server.
- The server timestamps the answer upon arrival and **credits back half of that player's ping** (their one-way network transit time, capped at 250 ms so it cannot be artificially abused).
- As a result, a candidate with a 150ms connection is credited $\sim 75\text{ms}$ back, receiving the exact same speed score they would have gotten had they been sitting next to the server!

### 3. The 300 ms Grace Window
If a candidate submits an answer right at the last millisecond of the timer, packet transmission over the internet could cause it to arrive slightly after the deadline. AptiQuiz grants a **300 ms grace window** after the timer expires before rejecting the answer as late.

### 4. Single Lock Per Room
All incoming player answers are processed sequentially using an asynchronous queue lock per room (`room.acquireLock`), preventing race conditions, double submissions, or concurrent state corruption.

### 5. Seamless Reconnection
Each player receives a unique secret token stored in `localStorage`. If a player's phone reloads, network switches from Wi-Fi to cellular, or connection drops, they automatically reconnect with their existing score, streak, and team intact without disturbing other players.

---

## 🛡️ Anti-Cheating Architecture

1. **Randomized Option IDs & Shuffled Orders:** Every candidate receives answer options in a completely randomized order with unique ephemeral option IDs (e.g., `opt-3a7x`). The server maps these back to the original index. A student peeking at their neighbor's screen who clicks "Option A (Triangle)" will pick a completely different choice!
2. **Zero Leaks:** The server **never** sends the correct answer or explanation to any client until the round has officially concluded.
3. **Sub-400ms Suspicious Flag:** The average human reading and reaction time for an aptitude question is $\ge 500\text{ms}$. Answers submitted under 400ms effective time are automatically flagged on the host dashboard as suspicious for mentor review.
4. **Duplicate Rejection:** The server only accepts the first answer submitted by a candidate; duplicate attempts are immediately dropped.
5. **Rate Limiting:** WebSocket connections are restricted to 25 messages per second to prevent automated scripting attacks.
6. **Window Blur / Tab Switch Alerts:** The client reports browser visibility change events to the server, displaying a warning count to the host.

### What Else Might a Determined Student Try?
- *Opening browser developer tools to inspect WebSocket frames:* The correct answer is never present in the payload until after the review phase.
- *Automated OCR browser extensions / screen scanners:* Handled by the fast timer (15s in Pressure round), randomized option layouts, and suspicious &lt;400ms reaction flagging. For high-stakes institutional proctoring, webcam integration or full-screen lock APIs could be layered on top.

---

## 🧪 50-Player Concurrent Simulation Test

A standalone Python test script is provided in `test/simulate50.py`. It uses pure Python 3 standard library (`asyncio` stream sockets with RFC 6455 WebSocket framing) and requires **no external packages or pip installs**.

### How to Run the Test

1. Ensure the AptiQuiz server is running:
   ```bash
   npm run dev
   # or
   npm start
   ```
2. In a separate terminal, execute:
   ```bash
   python3 test/simulate50.py
   ```

### What the 50-Player Simulation Test Proves:
1. **Concurrency:** Connects 50 real WebSocket clients simultaneously to an active arena room.
2. **Latency Simulation:** Simulates random network delays between 20ms and 380ms per bot.
3. **Anti-Cheat Validation:** Bots intentionally attempt duplicate answers and late answers past the 300ms grace cutoff—verifying 100% rejection.
4. **Resilient Reconnections:** 4 bots disconnect mid-game, reconnect with their stored tokens, and seamlessly resume gameplay with preserved state.
5. **Power-Ups & Wagers:** Validates server-side execution of Double Points, 50-50 option eliminations, Shields, and Final Boss score wagers.
6. **Leaderboard Integrity:** Produces the final top-5 standings and verifies that all 50 players' scores are computed correctly without race conditions.

---

## 💻 Tech Stack

- **Backend:** Node.js 22, Express 4.21, `ws` (native WebSockets), `@google/genai` (Gemini 3.8 Flash)
- **Frontend:** React 19, TypeScript, Tailwind CSS, Motion, Lucide Icons, Canvas-Confetti
- **Audio:** Synthesized Web Audio API sound generator (zero external audio file dependencies)
- **Testing:** Python 3 asyncio WebSocket stress harness (`test/simulate50.py`)
