import { pgTable, uuid, varchar, integer, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { professors } from './professors';
import { quizzes } from './quizzes';

export const gameSessionStatusEnum = pgEnum('game_session_status', [
  'LOBBY',
  'IN_PROGRESS',
  'FINISHED',
  'ABORTED',
  'EXPIRED',
]);

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quizzes.id, { onDelete: 'restrict' }),
    professorId: uuid('professor_id')
      .notNull()
      .references(() => professors.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }),
    classGroup: varchar('class_group', { length: 100 }),
    pin: varchar('pin', { length: 6 }).notNull(),
    status: gameSessionStatusEnum('status').notNull().default('LOBBY'),
    executionMode: varchar('execution_mode', { length: 20 }).notNull().default('MANUAL'),
    totalParticipants: integer('total_participants').notNull().default(0),
    started_at: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    ended_at: timestamp('ended_at', { withTimezone: true }),
    expires_at: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    quizIdIdx: index('idx_game_sessions_quiz_id').on(table.quizId),
    professorIdx: index('idx_game_sessions_professor').on(table.professorId, table.started_at),
    pinIdx: index('idx_game_sessions_pin').on(table.pin),
    activePinIdx: index('idx_game_sessions_active_pin')
      .on(table.pin)
      .where(sql`${table.status} IN ('LOBBY', 'IN_PROGRESS')`),
    endedAtIdx: index('idx_game_sessions_ended_at')
      .on(table.ended_at)
      .where(sql`${table.status} = 'FINISHED'`),
    statusExpiresIdx: index('idx_game_sessions_status_expires').on(
      table.status,
      table.expires_at
    ),
    classGroupIdx: index('idx_game_sessions_class_group').on(table.classGroup),
  })
);

export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
