import { Type, Static } from '@sinclair/typebox';

export const QuizSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  professorId: Type.String({ format: 'uuid' }),
  themeId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  coverImageUrl: Type.Union([Type.String(), Type.Null()]),
  isPublic: Type.Boolean(),
  sessionDurationMinutes: Type.Integer({ default: 60 }),
  defaultQuestionTimeLimitSeconds: Type.Integer({ default: 20 }),
  defaultExecutionMode: Type.String({ default: 'MANUAL' }),
  level: Type.Union([Type.String(), Type.Null()]),
  subject: Type.Union([Type.String(), Type.Null()]),
  folder: Type.Union([Type.String(), Type.Null()]),
  tags: Type.Array(Type.String()),
  playCount: Type.Integer({ default: 0 }),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const CreateQuizBodySchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  themeId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  coverImageUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isPublic: Type.Optional(Type.Boolean({ default: false })),
  sessionDurationMinutes: Type.Optional(Type.Integer({ minimum: 1, maximum: 1440, default: 60 })),
  defaultQuestionTimeLimitSeconds: Type.Optional(Type.Integer({ minimum: 1, maximum: 3600, default: 20 })),
  defaultExecutionMode: Type.Optional(Type.String({ default: 'MANUAL' })),
  level: Type.Optional(Type.Union([Type.String({ maxLength: 100 }), Type.Null()])),
  subject: Type.Optional(Type.Union([Type.String({ maxLength: 100 }), Type.Null()])),
  folder: Type.Optional(Type.Union([Type.String({ maxLength: 150 }), Type.Null()])),
  tags: Type.Optional(Type.Array(Type.String())),
  playCount: Type.Optional(Type.Integer({ minimum: 0 })),
  professorId: Type.Optional(Type.String({ format: 'uuid' })),
});
export type CreateQuizBody = Static<typeof CreateQuizBodySchema>;

export const UpdateQuizBodySchema = Type.Partial(CreateQuizBodySchema);
export type UpdateQuizBody = Static<typeof UpdateQuizBodySchema>;

export const QuizListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  search: Type.Optional(Type.String()),
  tag: Type.Optional(Type.String()),
  level: Type.Optional(Type.String()),
  subject: Type.Optional(Type.String()),
  folder: Type.Optional(Type.String()),
});
export type QuizListQuery = Static<typeof QuizListQuerySchema>;

export const ActivateQuizBodySchema = Type.Object({
  title: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  classGroup: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  durationMinutes: Type.Optional(Type.Integer({ minimum: 1, maximum: 1440 })),
  themeId: Type.Optional(Type.Union([Type.String({ format: 'uuid' }), Type.Null()])),
  executionMode: Type.Optional(Type.String()),
});
export type ActivateQuizBody = Static<typeof ActivateQuizBodySchema>;

export const ActivateQuizResponseSchema = Type.Object({
  sessionId: Type.String({ format: 'uuid' }),
  pin: Type.String({ minLength: 6, maxLength: 6 }),
  status: Type.String(),
  executionMode: Type.Optional(Type.String()),
  expiresAt: Type.String(),
  quizId: Type.String({ format: 'uuid' }),
  quizTitle: Type.String(),
  totalQuestions: Type.Integer(),
  title: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  classGroup: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});


