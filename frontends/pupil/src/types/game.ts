export type GameState =
  | 'JOIN'
  | 'LOBBY'
  | 'COUNTDOWN'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_RESULT'
  | 'LEADERBOARD'
  | 'PODIUM'
  | 'FINISHED'
  | 'EXPIRED'
  | 'ERROR';

export interface AnswerOption {
  id: string;
  orderIndex: number;
  optionText: string;
  colorShapeIndex: number; // 0: Red Triangle, 1: Blue Diamond, 2: Yellow Circle, 3: Green Square
}

export interface QuestionData {
  questionId: string;
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  questionType: string;
  timeLimitSeconds: number;
  mediaUrl?: string | null;
  mediaType?: 'IMAGE' | 'AUDIO' | 'VIDEO' | null;
  showAnswersOnDevice: boolean;
  options: AnswerOption[];
}

export interface PupilFeedback {
  isCorrect: boolean;
  pointsEarned: number;
  streak: number;
  responseTimeMs: number;
  rank?: number;
  isEmpty?: boolean;
}

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  playerId: string;
  nickname: string;
  finalScore: number;
}

export interface ThemeMeta {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  logoUrl?: string | null;
}

export interface JoinSuccessData {
  success: boolean;
  playerId: string;
  pin: string;
  nickname: string;
  quizTitle?: string;
  theme?: ThemeMeta | null;
}

