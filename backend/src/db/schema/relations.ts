import { relations } from 'drizzle-orm';
import { professors } from './professors.js';
import { themes } from './themes.js';
import { quizzes } from './quizzes.js';
import { questions } from './questions.js';
import { answerOptions } from './answer-options.js';
import { gameSessions } from './game-sessions.js';
import { gameSessionResults } from './game-session-results.js';

export const professorsRelations = relations(professors, ({ many }) => ({
  quizzes: many(quizzes),
  themes: many(themes),
  gameSessions: many(gameSessions),
}));

export const themesRelations = relations(themes, ({ one, many }) => ({
  professor: one(professors, {
    fields: [themes.professorId],
    references: [professors.id],
  }),
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  professor: one(professors, {
    fields: [quizzes.professorId],
    references: [professors.id],
  }),
  theme: one(themes, {
    fields: [quizzes.themeId],
    references: [themes.id],
  }),
  questions: many(questions),
  gameSessions: many(gameSessions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
  answerOptions: many(answerOptions),
}));

export const answerOptionsRelations = relations(answerOptions, ({ one }) => ({
  question: one(questions, {
    fields: [answerOptions.questionId],
    references: [questions.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [gameSessions.quizId],
    references: [quizzes.id],
  }),
  professor: one(professors, {
    fields: [gameSessions.professorId],
    references: [professors.id],
  }),
  results: many(gameSessionResults),
}));

export const gameSessionResultsRelations = relations(gameSessionResults, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [gameSessionResults.sessionId],
    references: [gameSessions.id],
  }),
}));

