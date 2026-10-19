import { Type, Static } from '@sinclair/typebox';

export const GameSessionSummarySchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  quizId: Type.String({ format: 'uuid' }),
  quizTitle: Type.String(),
  title: Type.Union([Type.String(), Type.Null()]),
  classGroup: Type.Union([Type.String(), Type.Null()]),
  pin: Type.String(),
  status: Type.String(),
  executionMode: Type.Optional(Type.String()),
  totalParticipants: Type.Integer(),
  startedAt: Type.String(),
  endedAt: Type.Union([Type.String(), Type.Null()]),
  expiresAt: Type.Union([Type.String(), Type.Null()]),
});

export const PupilAnswerDetailSchema = Type.Object({
  questionId: Type.String({ format: 'uuid' }),
  selectedOptionId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  responseTimeMs: Type.Optional(Type.Integer()),
  isCorrect: Type.Boolean(),
  pointsEarned: Type.Integer(),
  streakCount: Type.Optional(Type.Integer()),
  isEmpty: Type.Optional(Type.Boolean({ default: false })),
});

export const GameSessionResultSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  nickname: Type.String(),
  finalScore: Type.Integer(),
  finalRank: Type.Integer(),
  correctAnswersCount: Type.Integer(),
  totalQuestionsCount: Type.Integer(),
  answerDetails: Type.Array(PupilAnswerDetailSchema),
});

export const GameSessionDetailSchema = Type.Object({
  session: GameSessionSummarySchema,
  results: Type.Array(GameSessionResultSchema),
});

export const CloseSessionResponseSchema = Type.Object({
  success: Type.Boolean(),
  sessionId: Type.String({ format: 'uuid' }),
  status: Type.String(),
  endedAt: Type.String(),
});

export const QuestionMetricSchema = Type.Object({
  questionId: Type.String({ format: 'uuid' }),
  questionText: Type.String(),
  totalAnswers: Type.Integer(),
  correctCount: Type.Integer(),
  wrongCount: Type.Integer(),
  emptyCount: Type.Optional(Type.Integer({ default: 0 })),
  correctPercentage: Type.Number(),
  averageResponseTimeMs: Type.Number(),
  optionDistribution: Type.Record(Type.String(), Type.Integer()),
});
export type QuestionMetric = Static<typeof QuestionMetricSchema>;

export const SessionMetricsSummarySchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  title: Type.Union([Type.String(), Type.Null()]),
  classGroup: Type.Union([Type.String(), Type.Null()]),
  pin: Type.String(),
  status: Type.String(),
  totalParticipants: Type.Integer(),
  startedAt: Type.String(),
  endedAt: Type.Union([Type.String(), Type.Null()]),
  averageScore: Type.Number(),
  averageResponseTimeMs: Type.Number(),
  overallAccuracyPercentage: Type.Number(),
});
export type SessionMetricsSummary = Static<typeof SessionMetricsSummarySchema>;

export const SessionMetricsResponseSchema = Type.Object({
  session: SessionMetricsSummarySchema,
  questions: Type.Array(QuestionMetricSchema),
});
export type SessionMetricsResponse = Static<typeof SessionMetricsResponseSchema>;


