import { pgTable, uuid, varchar, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { gameSessions } from './game-sessions.js';

export interface PupilAnswerDetail {
  questionId: string;
  selectedOptionId?: string | null;
  responseTimeMs?: number;
  isCorrect: boolean;
  pointsEarned: number;
  streakCount?: number;
  isEmpty?: boolean;
}

export const gameSessionResults = pgTable(
  'game_session_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    nickname: varchar('nickname', { length: 50 }).notNull(),
    finalScore: integer('final_score').notNull().default(0),
    finalRank: integer('final_rank').notNull(),
    correctAnswersCount: integer('correct_answers_count').notNull().default(0),
    totalQuestionsCount: integer('total_questions_count').notNull().default(0),
    answerDetails: jsonb('answer_details').$type<PupilAnswerDetail[]>().notNull().default([]),
  },
  (table) => ({
    sessionIdIdx: index('idx_game_session_results_session_id').on(table.sessionId),
    rankIdx: index('idx_game_session_results_rank').on(table.sessionId, table.finalRank),
  })
);

export type GameSessionResult = typeof gameSessionResults.$inferSelect;
export type NewGameSessionResult = typeof gameSessionResults.$inferInsert;

