export type GameState =
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_RESULT'
  | 'LEADERBOARD'
  | 'PODIUM'
  | 'FINISHED'
  | 'EXPIRED';

export interface PlayerSession {
  id: string;
  nickname: string;
  socketId: string;
  connected: boolean;
  joinedAt: number;
}

export interface RoomMeta {
  sessionId: string;
  professorId: string;
  quizId: string;
  pin: string;
  status: GameState;
  currentQuestionIndex: number;
  totalQuestions: number;
  expiresAt: string;
  questionStartTimeMs?: number;
  questionTimeLimitMs?: number;
  questionBasePoints?: number;
  quizTitle?: string;
  theme?: ThemeMeta;
  executionMode?: 'MANUAL' | 'AUTOMATIC';
}

export interface ThemeMeta {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl?: string | null;
}

export interface PupilAnswerSubmission {
  pin: string;
  questionId: string;
  optionId?: string | null;
  clientSendTime: number;
}

export interface PlayerScoreSummary {
  playerId: string;
  nickname: string;
  score: number;
  streak: number;
  rank: number;
  delta?: number;
}

export interface QuestionResultHostData {
  questionId: string;
  correctOptionId?: string;
  distribution: Record<string, number>;
  answeredCount: number;
  emptyCount: number;
  totalPlayers: number;
}

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  playerId: string;
  nickname: string;
  finalScore: number;
}

