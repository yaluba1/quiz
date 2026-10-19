import { pgTable, uuid, varchar, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { professors } from './professors.js';

export const themes = pgTable(
  'themes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    professorId: uuid('professor_id').references(() => professors.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    isSystemPreset: boolean('is_system_preset').notNull().default(false),
    logoUrl: varchar('logo_url', { length: 500 }),
    primaryColor: varchar('primary_color', { length: 20 }).notNull().default('#93C572'),
    secondaryColor: varchar('secondary_color', { length: 20 }).notNull().default('#FF7518'),
    backgroundColor: varchar('background_color', { length: 20 }).notNull().default('#F7F9F6'),
    fontFamily: varchar('font_family', { length: 100 }).notNull().default('Inter'),
    customCssVars: jsonb('custom_css_vars').$type<Record<string, string>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    professorIdIdx: index('idx_themes_professor_id').on(table.professorId),
    systemPresetIdx: index('idx_themes_system_preset').on(table.isSystemPreset),
  })
);

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;

