import { Type, Static } from '@sinclair/typebox';

export const AnswerOptionInputSchema = Type.Object({
  id: Type.Optional(Type.String({ format: 'uuid' })),
  orderIndex: Type.Integer({ minimum: 0, maximum: 5 }),
  optionText: Type.String({ minLength: 1 }),
  isCorrect: Type.Boolean(),
  colorShapeIndex: Type.Integer({ minimum: 0, maximum: 5 }),
});
export type AnswerOptionInput = Static<typeof AnswerOptionInputSchema>;

export const AnswerOptionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  questionId: Type.String({ format: 'uuid' }),
  orderIndex: Type.Integer(),
  optionText: Type.String(),
  isCorrect: Type.Boolean(),
  colorShapeIndex: Type.Integer(),
});

export const QuestionTypeEnum = Type.Union([
  Type.Literal('MULTIPLE_CHOICE'),
  Type.Literal('TRUE_FALSE'),
]);

export const MediaTypeEnum = Type.Union([
  Type.Literal('IMAGE'),
  Type.Literal('AUDIO'),
  Type.Literal('VIDEO'),
]);

export const CreateQuestionBodySchema = Type.Object({
  orderIndex: Type.Optional(Type.Integer({ minimum: 0 })),
  questionText: Type.String({ minLength: 1 }),
  questionType: Type.Optional(QuestionTypeEnum),
  timeLimitSeconds: Type.Optional(Type.Integer({ minimum: 5, maximum: 300, default: 20 })),
  pointsMultiplier: Type.Optional(Type.String({ default: '1.00' })),
  mediaUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  mediaType: Type.Optional(Type.Union([MediaTypeEnum, Type.Null()])),
  showAnswersOnDevice: Type.Optional(Type.Boolean({ default: false })),
  options: Type.Optional(Type.Array(AnswerOptionInputSchema, { minItems: 2, maxItems: 6 })),
  answerOptions: Type.Optional(Type.Array(AnswerOptionInputSchema, { minItems: 2, maxItems: 6 })),
});
export type CreateQuestionBody = Static<typeof CreateQuestionBodySchema>;

export const UpdateQuestionBodySchema = Type.Partial(CreateQuestionBodySchema);
export type UpdateQuestionBody = Static<typeof UpdateQuestionBodySchema>;

export const ReorderQuestionsBodySchema = Type.Object({
  questionIds: Type.Array(Type.String({ format: 'uuid' })),
});
export type ReorderQuestionsBody = Static<typeof ReorderQuestionsBodySchema>;

export const QuestionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  quizId: Type.String({ format: 'uuid' }),
  orderIndex: Type.Integer(),
  questionText: Type.String(),
  questionType: Type.String(),
  timeLimitSeconds: Type.Integer(),
  pointsMultiplier: Type.String(),
  mediaUrl: Type.Union([Type.String(), Type.Null()]),
  mediaType: Type.Optional(Type.Union([MediaTypeEnum, Type.Null()])),
  showAnswersOnDevice: Type.Boolean(),
  options: Type.Array(AnswerOptionSchema),
});

