import fs from 'fs';
import path from 'path';

export interface QuestionTable {
  headers: string[];
  rows: string[][];
}

export interface Question {
  id: string;
  text: string;
  options: string[]; // 4 options
  correctAnswer: number; // 0, 1, 2, or 3
  topic: 'quantitative' | 'logical' | 'verbal' | 'data_interpretation';
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  imageUrl?: string;
  table?: QuestionTable;
}

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  collegeName?: string;
  createdAt: number;
  questions: Question[];
}

export interface CollegeLeagueEntry {
  collegeName: string;
  topPlayerScores: number[]; // top 10 player scores
  collegeScore: number; // average of top 10
  totalPlayers: number;
  totalGames: number;
  updatedAt: number;
}

export interface PlayerLeaderboardEntry {
  playerName: string;
  collegeName: string;
  score: number;
  accuracy: number;
  readinessScore: number;
  date: number;
}

export interface DailyChallengeQuestion extends Question {}

export interface DailyChallengeSubmission {
  deviceId: string;
  playerName: string;
  collegeName: string;
  score: number;
  accuracy: number;
  completedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const QUESTION_SETS_FILE = path.join(DATA_DIR, 'question_sets.json');
const LEAGUE_FILE = path.join(DATA_DIR, 'league.json');
const DAILY_SUBMISSIONS_FILE = path.join(DATA_DIR, 'daily_submissions.json');

// 15 Seed Questions across Quantitative, Logical, Verbal, and Data Interpretation
export const SEED_QUESTIONS: Question[] = [
  // Quantitative Aptitude
  {
    id: 'seed-q1',
    text: 'A pipe can fill a cistern in 12 hours, while another pipe can empty it in 18 hours. If both pipes are opened simultaneously, in how many hours will the cistern be completely filled?',
    options: ['30 hours', '36 hours', '24 hours', '42 hours'],
    correctAnswer: 1, // 36 hours
    topic: 'quantitative',
    difficulty: 'easy',
    explanation: 'Net filling rate per hour = 1/12 - 1/18 = (3 - 2)/36 = 1/36. Hence, it takes 36 hours to fill completely.',
  },
  {
    id: 'seed-q2',
    text: 'A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?',
    options: ['65 seconds', '89 seconds', '85 seconds', '72 seconds'],
    correctAnswer: 1, // 89 seconds
    topic: 'quantitative',
    difficulty: 'medium',
    explanation: 'Speed = 240 m / 24 s = 10 m/s. Total distance to cross platform = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.',
  },
  {
    id: 'seed-q3',
    text: 'If the compound interest on a sum for 2 years at 10% per annum is ₹1,050, what would be the simple interest on the same sum at the same rate and for the same time?',
    options: ['₹950', '₹1,000', '₹1,020', '₹980'],
    correctAnswer: 1, // ₹1,000
    topic: 'quantitative',
    difficulty: 'medium',
    explanation: 'CI formula for 2 years at 10%: Effective CI rate = 10 + 10 + (10*10)/100 = 21%. Given 21% of P = 1050 => P = ₹5,000. SI for 2 years at 10% = 20% of 5,000 = ₹1,000.',
  },
  {
    id: 'seed-q4',
    text: 'In how many different ways can the letters of the word "PLACEMENT" be arranged so that the vowels always come together?',
    options: ['30,240', '15,120', '7,560', '10,080'],
    correctAnswer: 1, // 15,120
    topic: 'quantitative',
    difficulty: 'hard',
    explanation: 'PLACEMENT has 9 letters: P, L, A, C, E, M, E, N, T. Vowels are A, E, E (3 vowels, with E repeating twice). Consonants are P, L, C, M, N, T (6 consonants). Treat vowels as 1 block: (6 + 1) = 7 units. Ways to arrange = 7! = 5040. Inside vowel block (A, E, E): 3! / 2! = 3 ways. Total ways = 5040 * 3 = 15,120.',
  },

  // Logical Reasoning
  {
    id: 'seed-q5',
    text: 'Pointing to a gentleman, Deepak said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Deepak?',
    options: ['Father', 'Uncle', 'Grandfather', 'Brother-in-law'],
    correctAnswer: 1, // Uncle
    topic: 'logical',
    difficulty: 'easy',
    explanation: 'Deepak\'s daughter\'s father is Deepak himself. The father of Deepak is his father. The gentleman\'s only brother is Deepak\'s father. Therefore, the gentleman is Deepak\'s uncle.',
  },
  {
    id: 'seed-q6',
    text: 'Statements: All laptops are machines. Some machines are smart devices. No smart device is analog.\nConclusions:\nI. Some laptops are smart devices.\nII. No machine is analog.',
    options: ['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither I nor II follows'],
    correctAnswer: 3, // Neither follows
    topic: 'logical',
    difficulty: 'medium',
    explanation: 'Laptops are machines, and some machines are smart devices, but there is no necessary overlap between laptops and smart devices. Also, machines that are not smart devices could be analog. Thus neither conclusion follows necessarily.',
  },
  {
    id: 'seed-q7',
    text: 'Find the missing number in the series: 7, 13, 27, 53, 107, ?',
    options: ['211', '213', '215', '217'],
    correctAnswer: 1, // 213
    topic: 'logical',
    difficulty: 'medium',
    explanation: 'Pattern: (7 * 2) - 1 = 13; (13 * 2) + 1 = 27; (27 * 2) - 1 = 53; (53 * 2) + 1 = 107; (107 * 2) - 1 = 213.',
  },
  {
    id: 'seed-q8',
    text: 'Six executives P, Q, R, S, T, and U sit around a circular conference table facing the center. P sits second to the left of U. Q sits opposite to S. R is not an immediate neighbor of P. If T sits to the immediate right of U, who sits opposite to P?',
    options: ['R', 'T', 'U', 'Q'],
    correctAnswer: 0, // R
    topic: 'logical',
    difficulty: 'hard',
    explanation: 'Fix U at position 1 (facing center). Immediate right of U is pos 6: T. Second left of U is pos 3: P. Positions 2, 4, 5 remain. Q sits opposite S: across 6 positions, opposite means difference of 3. Positions 1 & 4, 2 & 5, 3 & 6 are opposite pairs. Pos 1 has U, Pos 6 has T, Pos 3 has P. So Q and S must occupy 2 & 5! Thus pos 4 must be R. Opposite of P (pos 3) is pos 4 (which is R).',
  },

  // Verbal Ability
  {
    id: 'seed-q9',
    text: 'Select the word that is most nearly OPPOSITE in meaning to the capitalized word: "The manager was criticized for his BELLICOSE attitude during client disputes."',
    options: ['Aggressive', 'Conciliatory', 'Indifferent', 'Cautious'],
    correctAnswer: 1, // Conciliatory
    topic: 'verbal',
    difficulty: 'easy',
    explanation: '"Bellicose" means demonstrating aggression and willingness to fight. Its antonym is "Conciliatory" (peace-seeking, placating).',
  },
  {
    id: 'seed-q10',
    text: 'Identify the sentence with the correct grammatical structure and subject-verb agreement:',
    options: [
      'Neither the project manager nor the software developers was aware of the database breach.',
      'Neither the project manager nor the software developers were aware of the database breach.',
      'Either the system analysts or the architect have made an error in the schema.',
      'A collection of technical articles were published in the quarterly tech journal.',
    ],
    correctAnswer: 1, // were aware
    topic: 'verbal',
    difficulty: 'medium',
    explanation: 'In "neither... nor...", the verb agrees with the nearer subject. Since "software developers" is plural, the plural verb "were" is correct.',
  },
  {
    id: 'seed-q11',
    text: 'Rearrange the sentences into a coherent paragraph:\nP: Consequently, recruiters look for problem-solving adaptability.\nQ: Algorithmic hiring tests have evolved drastically over the last decade.\nR: Instead of rote memorization, real-world case simulations are now evaluated.\nS: Modern enterprise tech stacks change faster than university curriculums.',
    options: ['Q - S - R - P', 'S - Q - R - P', 'Q - R - S - P', 'S - P - Q - R'],
    correctAnswer: 0, // Q - S - R - P
    topic: 'verbal',
    difficulty: 'hard',
    explanation: 'Q introduces the evolution of algorithmic hiring tests. S provides the underlying driver (fast tech stack evolution). R specifies the shift from memorization to case simulations. P wraps up with the concluding takeaway ("Consequently...").',
  },

  // Data Interpretation
  {
    id: 'seed-q12',
    text: 'Refer to the table below showing Placement Offers across 4 Engineering Branches over 3 Years. What is the ratio of total offers in CS & IT to total offers in ECE & Mech in Year 2024?',
    options: ['5 : 3', '3 : 2', '7 : 4', '4 : 3'],
    correctAnswer: 0, // 5 : 3
    topic: 'data_interpretation',
    difficulty: 'easy',
    table: {
      headers: ['Branch', '2022', '2023', '2024'],
      rows: [
        ['Computer Science', '320', '350', '400'],
        ['Information Tech', '180', '210', '250'],
        ['Electronics (ECE)', '220', '240', '260'],
        ['Mechanical Eng', '110', '120', '130'],
      ],
    },
    explanation: 'In 2024: CS + IT = 400 + 250 = 650. ECE + Mech = 260 + 130 = 390. Ratio = 650 : 390 = 65 : 39 = 5 : 3.',
  },
  {
    id: 'seed-q13',
    text: 'Based on the company hiring expenditure table below, by what approximate percentage did the Recruitment Tech cost increase from 2023 to 2024?',
    options: ['22.5%', '28.0%', '33.3%', '18.2%'],
    correctAnswer: 2, // 33.3%
    topic: 'data_interpretation',
    difficulty: 'medium',
    table: {
      headers: ['Expense Category (in ₹ Lakhs)', '2022', '2023', '2024'],
      rows: [
        ['Campus Outreach', '45', '50', '55'],
        ['Recruitment Tech Platforms', '30', '36', '48'],
        ['Assessment Vendors', '25', '28', '35'],
        ['Interview Stipends', '15', '16', '18'],
      ],
    },
    explanation: 'Recruitment Tech in 2023 = 36 Lakhs. In 2024 = 48 Lakhs. Increase = 48 - 36 = 12 Lakhs. Percentage increase = (12 / 36) * 100 = 33.33%.',
  },
  {
    id: 'seed-q14',
    text: 'Examine the candidate qualification funnel table. If the target was to achieve at least a 15% overall conversion from Aptitude Test to Final Offer, by how many candidates did the company fall short?',
    options: ['12 candidates', '18 candidates', '24 candidates', '8 candidates'],
    correctAnswer: 1, // 18 candidates
    topic: 'data_interpretation',
    difficulty: 'medium',
    table: {
      headers: ['Funnel Stage', 'Shortlisted Count'],
      rows: [
        ['Stage 1: Aptitude Test Appeared', '1200'],
        ['Stage 2: Technical Round 1 Cleared', '480'],
        ['Stage 3: Technical Round 2 Cleared', '260'],
        ['Stage 4: HR & Cultural Fit Cleared', '190'],
        ['Stage 5: Final Placement Offer Accepted', '162'],
      ],
    },
    explanation: 'Aptitude Test appeared = 1200. Target 15% = 0.15 * 1200 = 180 candidates. Actual final offers = 162. Shortfall = 180 - 162 = 18 candidates.',
  },
  {
    id: 'seed-q15',
    text: 'Review the Average Salary Packages (LPA) across Colleges for 2024. Which college achieved the highest percentage growth in median CTC compared to 2023?',
    options: ['Apex Institute of Tech', 'National Engg College', 'Metro Polytechnic', 'Sunrise University'],
    correctAnswer: 0, // Apex Institute of Tech
    topic: 'data_interpretation',
    difficulty: 'hard',
    table: {
      headers: ['College', '2023 Median (LPA)', '2024 Median (LPA)'],
      rows: [
        ['Apex Institute of Tech', '7.2', '9.6'],
        ['National Engg College', '8.5', '10.2'],
        ['Metro Polytechnic', '4.8', '5.7'],
        ['Sunrise University', '6.0', '7.4'],
      ],
    },
    explanation: 'Apex: (9.6 - 7.2)/7.2 = 2.4/7.2 = 33.33%. National: (10.2 - 8.5)/8.5 = 1.7/8.5 = 20.0%. Metro: (5.7 - 4.8)/4.8 = 0.9/4.8 = 18.75%. Sunrise: (7.4 - 6.0)/6.0 = 1.4/6.0 = 23.33%. Apex had the highest growth at 33.33%.',
  },
];

// In-Memory & File-backed Store
class DatabaseStore {
  private questionSets: QuestionSet[] = [];
  private collegeLeague: Map<string, CollegeLeagueEntry> = new Map();
  private dailySubmissions: DailyChallengeSubmission[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load question sets
    if (fs.existsSync(QUESTION_SETS_FILE)) {
      try {
        const raw = fs.readFileSync(QUESTION_SETS_FILE, 'utf-8');
        this.questionSets = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading question sets:', err);
        this.seedDefaultQuestionSets();
      }
    } else {
      this.seedDefaultQuestionSets();
    }

    // Load league data
    if (fs.existsSync(LEAGUE_FILE)) {
      try {
        const raw = fs.readFileSync(LEAGUE_FILE, 'utf-8');
        const list: CollegeLeagueEntry[] = JSON.parse(raw);
        for (const item of list) {
          this.collegeLeague.set(item.collegeName, item);
        }
      } catch (err) {
        console.error('Failed reading league data:', err);
        this.seedDefaultLeague();
      }
    } else {
      this.seedDefaultLeague();
    }

    // Load daily submissions
    if (fs.existsSync(DAILY_SUBMISSIONS_FILE)) {
      try {
        const raw = fs.readFileSync(DAILY_SUBMISSIONS_FILE, 'utf-8');
        this.dailySubmissions = JSON.parse(raw);
      } catch (err) {
        this.dailySubmissions = [];
      }
    }
  }

  private seedDefaultQuestionSets() {
    const defaultSet: QuestionSet = {
      id: 'set-placement-master-15',
      title: 'TCS & Infosys Placement Grand Arena (15 Questions)',
      description: 'Comprehensive 15-question placement assessment covering Quantitative, Logical, Verbal, and Data Interpretation.',
      collegeName: 'National Placement Consortium',
      createdAt: Date.now(),
      questions: SEED_QUESTIONS,
    };
    this.questionSets = [defaultSet];
    this.saveQuestionSets();
  }

  private seedDefaultLeague() {
    const defaultColleges = [
      { name: 'IIT Bombay', scores: [9800, 9450, 9200, 8900, 8750, 8500, 8400, 8100, 7900, 7800] },
      { name: 'BITS Pilani', scores: [9600, 9300, 9050, 8800, 8600, 8450, 8200, 8000, 7750, 7600] },
      { name: 'NIT Trichy', scores: [9500, 9150, 8900, 8700, 8400, 8250, 8100, 7900, 7600, 7400] },
      { name: 'DTU Delhi', scores: [9300, 8950, 8700, 8500, 8200, 8050, 7800, 7600, 7450, 7200] },
      { name: 'VIT Vellore', scores: [9100, 8800, 8500, 8300, 8100, 7900, 7700, 7500, 7300, 7100] },
    ];

    for (const c of defaultColleges) {
      const avg = Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length);
      this.collegeLeague.set(c.name, {
        collegeName: c.name,
        topPlayerScores: c.scores,
        collegeScore: avg,
        totalPlayers: c.scores.length + 12,
        totalGames: 8,
        updatedAt: Date.now() - Math.floor(Math.random() * 86400000 * 3),
      });
    }
    this.saveLeague();
  }

  private saveQuestionSets() {
    try {
      fs.writeFileSync(QUESTION_SETS_FILE, JSON.stringify(this.questionSets, null, 2));
    } catch (err) {
      console.error('Failed saving question sets:', err);
    }
  }

  private saveLeague() {
    try {
      const list = Array.from(this.collegeLeague.values());
      fs.writeFileSync(LEAGUE_FILE, JSON.stringify(list, null, 2));
    } catch (err) {
      console.error('Failed saving league data:', err);
    }
  }

  private saveDailySubmissions() {
    try {
      fs.writeFileSync(DAILY_SUBMISSIONS_FILE, JSON.stringify(this.dailySubmissions, null, 2));
    } catch (err) {
      console.error('Failed saving daily submissions:', err);
    }
  }

  // Question Set Methods
  getQuestionSets(): QuestionSet[] {
    return this.questionSets;
  }

  getQuestionSetById(id: string): QuestionSet | undefined {
    return this.questionSets.find(s => s.id === id);
  }

  saveQuestionSet(set: QuestionSet): QuestionSet {
    const idx = this.questionSets.findIndex(s => s.id === set.id);
    if (idx >= 0) {
      this.questionSets[idx] = set;
    } else {
      this.questionSets.push(set);
    }
    this.saveQuestionSets();
    return set;
  }

  deleteQuestionSet(id: string): boolean {
    const idx = this.questionSets.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.questionSets.splice(idx, 1);
      this.saveQuestionSets();
      return true;
    }
    return false;
  }

  // League Records Methods
  recordFinishedGame(collegeName: string, playerScores: { name: string; score: number }[]) {
    if (!collegeName || !playerScores.length) return;
    const cleanCollege = collegeName.trim();
    let entry = this.collegeLeague.get(cleanCollege);
    if (!entry) {
      entry = {
        collegeName: cleanCollege,
        topPlayerScores: [],
        collegeScore: 0,
        totalPlayers: 0,
        totalGames: 0,
        updatedAt: Date.now(),
      };
    }

    entry.totalGames += 1;
    entry.totalPlayers += playerScores.length;
    entry.updatedAt = Date.now();

    // Incorporate scores
    const allScores = [...entry.topPlayerScores, ...playerScores.map(p => p.score)].sort((a, b) => b - a);
    entry.topPlayerScores = allScores.slice(0, 10);
    // College score = average of top 10 player scores
    const sum = entry.topPlayerScores.reduce((acc, cur) => acc + cur, 0);
    entry.collegeScore = Math.round(sum / entry.topPlayerScores.length);

    this.collegeLeague.set(cleanCollege, entry);
    this.saveLeague();
  }

  getCollegeLeague(filter: 'this_week' | 'this_month' | 'all_time' = 'all_time'): CollegeLeagueEntry[] {
    const now = Date.now();
    const list = Array.from(this.collegeLeague.values());

    return list
      .filter(item => {
        if (filter === 'this_week') {
          return now - item.updatedAt <= 7 * 86400000;
        }
        if (filter === 'this_month') {
          return now - item.updatedAt <= 30 * 86400000;
        }
        return true;
      })
      .sort((a, b) => b.collegeScore - a.collegeScore);
  }

  // Daily Challenge Methods
  getDailyChallengeQuestions(): DailyChallengeQuestion[] {
    // Pick deterministic 5 questions based on today's calendar date
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash << 5) - hash + today.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    const pool = SEED_QUESTIONS;
    const selected: DailyChallengeQuestion[] = [];
    for (let i = 0; i < 5; i++) {
      const idx = (absHash + i * 3) % pool.length;
      selected.push(pool[idx]);
    }
    return selected;
  }

  hasSubmittedDaily(deviceId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return this.dailySubmissions.some(
      s => s.deviceId === deviceId && new Date(s.completedAt).toISOString().slice(0, 10) === today
    );
  }

  submitDailyChallenge(submission: DailyChallengeSubmission): { success: boolean; message?: string } {
    const today = new Date().toISOString().slice(0, 10);
    const existing = this.dailySubmissions.find(
      s => s.deviceId === submission.deviceId && new Date(s.completedAt).toISOString().slice(0, 10) === today
    );
    if (existing) {
      return { success: false, message: 'Daily challenge already completed for today!' };
    }
    this.dailySubmissions.push(submission);
    this.saveDailySubmissions();

    // Also record towards college league
    this.recordFinishedGame(submission.collegeName, [{ name: submission.playerName, score: submission.score }]);

    return { success: true };
  }

  getDailyLeaderboard(): DailyChallengeSubmission[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.dailySubmissions
      .filter(s => new Date(s.completedAt).toISOString().slice(0, 10) === today)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }
}

export const db = new DatabaseStore();
