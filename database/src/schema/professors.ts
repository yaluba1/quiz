import { pgTable, uuid, varchar, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const professors = pgTable(
  'professors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    locale: varchar('locale', { length: 10 }).notNull().default('en'),
    emailVerified: boolean('email_verified').notNull().default(false),
    verificationToken: varchar('verification_token', { length: 255 }),
    verificationTokenExpiresAt: timestamp('verification_token_expires_at', { withTimezone: true }),
    resetToken: varchar('reset_token', { length: 255 }),
    resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('idx_professors_email').on(table.email),
    verificationTokenIdx: index('idx_professors_verification_token')
      .on(table.verificationToken)
      .where(sql`${table.verificationToken} IS NOT NULL`),
    resetTokenIdx: index('idx_professors_reset_token')
      .on(table.resetToken)
      .where(sql`${table.resetToken} IS NOT NULL`),
  })
);

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;

