import { pgTable, uuid, integer, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { questions } from './questions.js';

export const answerOptions = pgTable(
  'answer_options',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull(),
    optionText: text('option_text').notNull(),
    isCorrect: boolean('is_correct').notNull().default(false),
    colorShapeIndex: integer('color_shape_index').notNull(),
  },
  (table) => ({
    questionIdIdx: index('idx_answer_options_question_id').on(table.questionId),
    questionOrderIdx: uniqueIndex('idx_answer_options_question_order').on(table.questionId, table.orderIndex),
  })
);

export type AnswerOption = typeof answerOptions.$inferSelect;
export type NewAnswerOption = typeof answerOptions.$inferInsert;

