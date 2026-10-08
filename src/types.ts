export interface QuestionTable {
  headers: string[];
  rows: string[][];
}

export interface QuestionOption {
  id: string;
  text: string;
  shape: 'triangle' | 'circle' | 'square' | 'diamond';
  symbol: string;
  color: string;
  colorName: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: number;
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

export interface PlayerLeaderboardEntry {
  id: string;
  name: string;
  teamName?: string;
  score: number;
  rank: number;
  rankDelta: number; // positive = up, negative = down, 0 = same
  pointsGained: number;
  avatarColor: string;
  streak: number;
  bestStreak?: number;
  accuracy?: number;
}

export interface TeamLeaderboardEntry {
  teamName: string;
  averageScore: number;
  memberCount: number;
  rank: number;
}

export interface PersonalResult {
  rank: number;
  score: number;
  accuracy: number;
  avgResponseTimeMs: number;
  bestStreak: number;
  readinessScore: number;
  topicStrength: Record<string, { correct: number; total: number }>;
  weakestTopic: string;
  strongestTopic: string;
  weaknessTip: string;
  collegeName: string;
  playerName: string;
}

export interface HostLiveStats {
  answeredCount: number;
  totalPlayers: number;
  distribution: { [key: number]: number };
  adaptiveMode: boolean;
  suspiciousEventsCount: number;
  tabSwitchTotal: number;
}

export interface CollegeLeagueEntry {
  collegeName: string;
  topPlayerScores: number[];
  collegeScore: number;
  totalPlayers: number;
  totalGames: number;
  updatedAt: number;
}

export interface DailySubmission {
  deviceId: string;
  playerName: string;
  collegeName: string;
  score: number;
  accuracy: number;
  completedAt: number;
}

export type PowerupType = 'double_points' | 'fifty_fifty' | 'shield';

export interface UserSettings {
  soundEnabled: boolean;
  largeTextMode: boolean;
  lowDataMode: boolean;
}
