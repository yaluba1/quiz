export type HostGameState =
  | 'DISCONNECTED'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_RESULT'
  | 'LEADERBOARD'
  | 'PODIUM'
  | 'FINISHED';

export interface JoinedPlayer {
  playerId: string;
  nickname: string;
  avatarSeed?: string;
  score?: number;
}

export interface QuestionActivePayload {
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  timeLimitSeconds: number;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | null;
  showAnswersOnDevice?: boolean;
  options: {
    id: string;
    orderIndex: number;
    optionText: string;
    colorShapeIndex: number;
  }[];
}

export interface QuestionResultHostPayload {
  questionId: string;
  correctOptionId?: string;
  distribution: Record<string, number>;
  answeredCount: number;
  totalPlayers: number;
  emptyCount?: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  streak?: number;
}

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  playerId: string;
  nickname: string;
  finalScore: number;
}

