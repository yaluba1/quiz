import { pgTable, uuid, integer, text, varchar, boolean, numeric, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { quizzes } from './quizzes.js';

export const questionTypeEnum = pgEnum('question_type', ['MULTIPLE_CHOICE', 'TRUE_FALSE']);
export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'AUDIO', 'VIDEO']);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull(),
    questionText: text('question_text').notNull(),
    questionType: questionTypeEnum('question_type').notNull().default('MULTIPLE_CHOICE'),
    timeLimitSeconds: integer('time_limit_seconds').notNull().default(20),
    pointsMultiplier: numeric('points_multiplier', { precision: 3, scale: 2 }).notNull().default('1.00'),
    mediaUrl: varchar('media_url', { length: 500 }),
    mediaType: mediaTypeEnum('media_type'),
    showAnswersOnDevice: boolean('show_answers_on_device').notNull().default(false),
  },
  (table) => ({
    quizIdIdx: index('idx_questions_quiz_id').on(table.quizId),
    quizOrderIdx: uniqueIndex('idx_questions_quiz_order').on(table.quizId, table.orderIndex),
  })
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

