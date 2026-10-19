import { Type, Static } from '@sinclair/typebox';

export const ErrorResponseSchema = Type.Object({
  statusCode: Type.Integer(),
  error: Type.String(),
  message: Type.String(),
  timestamp: Type.Optional(Type.String()),
});

export const UuidParamSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Resource UUID identifier' }),
});
export type UuidParam = Static<typeof UuidParamSchema>;

export const QuizIdParamSchema = Type.Object({
  quizId: Type.String({ format: 'uuid', description: 'Quiz UUID identifier' }),
});
export type QuizIdParam = Static<typeof QuizIdParamSchema>;

export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  search: Type.Optional(Type.String()),
});
export type PaginationQuery = Static<typeof PaginationQuerySchema>;

