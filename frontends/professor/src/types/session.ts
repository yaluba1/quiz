export interface GameSessionSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  title: string | null;
  classGroup: string | null;
  pin: string;
  status: 'LOBBY' | 'IN_PROGRESS' | 'FINISHED' | 'EXPIRED';
  executionMode?: 'MANUAL' | 'AUTOMATIC';
  totalParticipants: number;
  startedAt: string;
  endedAt: string | null;
  expiresAt: string | null;
}

export interface QuestionMetric {
  questionId: string;
  questionText: string;
  totalAnswers: number;
  correctCount: number;
  wrongCount: number;
  emptyCount?: number;
  correctPercentage: number;
  averageResponseTimeMs: number;
  optionDistribution: Record<string, number>;
}

export interface GameSessionDetail {
  session: {
    id: string;
    title: string | null;
    classGroup: string | null;
    pin: string;
    status: string;
    executionMode?: 'MANUAL' | 'AUTOMATIC';
    totalParticipants: number;
    startedAt: string;
    endedAt: string | null;
    averageScore: number;
    averageResponseTimeMs: number;
    overallAccuracyPercentage: number;
  };
  questions: QuestionMetric[];
}

