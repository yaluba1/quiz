import { pgTable, uuid, varchar, text, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { professors } from './professors.js';
import { themes } from './themes.js';

export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    professorId: uuid('professor_id')
      .notNull()
      .references(() => professors.id, { onDelete: 'cascade' }),
    themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    coverImageUrl: varchar('cover_image_url', { length: 500 }),
    isPublic: boolean('is_public').notNull().default(false),
    session_duration_minutes: integer('session_duration_minutes').notNull().default(60),
    defaultQuestionTimeLimitSeconds: integer('default_question_time_limit_seconds').notNull().default(20),
    defaultExecutionMode: varchar('default_execution_mode', { length: 20 }).notNull().default('MANUAL'),
    level: varchar('level', { length: 100 }),
    subject: varchar('subject', { length: 100 }),
    folder: varchar('folder', { length: 150 }),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    professorIdIdx: index('idx_quizzes_professor_id').on(table.professorId),
    themeIdIdx: index('idx_quizzes_theme_id').on(table.themeId),
    titleIdx: index('idx_quizzes_title').on(table.title),
    publicIdx: index('idx_quizzes_public').on(table.isPublic),
    levelIdx: index('idx_quizzes_level').on(table.level),
    subjectIdx: index('idx_quizzes_subject').on(table.subject),
    folderIdx: index('idx_quizzes_folder').on(table.folder),
    tagsIdx: index('idx_quizzes_tags').using('gin', table.tags),
  })
);

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
