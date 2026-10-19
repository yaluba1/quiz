import { getDb, closeDb } from '../src/db';
import {
  professors,
  themes,
} from '../src/schema/index';

// Pre-computed Argon2id hash for password: "Password123!"
// Format: $argon2id$v=19$m=65536,t=3,p=4$...
const DEMO_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQxMjM0NTY3OA$q4K2Wz1aC8rP8v3m3N9xK8l9P1q2R3s4T5u6V7w8X9Y';

async function seed() {
  console.log('[Seed] Starting database seeding...');
  const db = getDb();

  try {
    // 1. Seed System Themes
    console.log('[Seed] Seeding visual themes...');
    await db
      .insert(themes)
      .values({
        id: '00000000-0000-0000-0000-000000000001',
        professorId: null,
        name: 'Pistachio & Pumpkin',
        isSystemPreset: true,
        logoUrl: null,
        primaryColor: '#93C572',
        secondaryColor: '#FF7518',
        backgroundColor: '#F7F9F6',
        fontFamily: 'Inter',
        customCssVars: {
          '--theme-accent': '#4A7C59',
          '--theme-card-bg': '#FFFFFF',
        },
      })
      .onConflictDoUpdate({
        target: themes.id,
        set: {
          name: 'Pistachio & Pumpkin',
          primaryColor: '#93C572',
          secondaryColor: '#FF7518',
          backgroundColor: '#F7F9F6',
          fontFamily: 'Inter',
        },
      })
      .returning();

    await db
      .insert(themes)
      .values({
        id: '00000000-0000-0000-0000-000000000002',
        professorId: null,
        name: 'Academic Classic',
        isSystemPreset: true,
        logoUrl: null,
        primaryColor: '#2563EB',
        secondaryColor: '#0D9488',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Poppins',
        customCssVars: {
          '--theme-accent': '#1E40AF',
          '--theme-card-bg': '#FFFFFF',
        },
      })
      .onConflictDoUpdate({
        target: themes.id,
        set: {
          name: 'Academic Classic',
          primaryColor: '#2563EB',
          secondaryColor: '#0D9488',
          backgroundColor: '#F8FAFC',
          fontFamily: 'Poppins',
        },
      });

    await db
      .insert(themes)
      .values({
        id: '00000000-0000-0000-0000-000000000003',
        professorId: null,
        name: 'Cyber Neon',
        isSystemPreset: true,
        logoUrl: null,
        primaryColor: '#06B6D4',
        secondaryColor: '#F43F5E',
        backgroundColor: '#0F172A',
        fontFamily: 'JetBrains Mono',
        customCssVars: {
          '--theme-accent': '#38BDF8',
          '--theme-card-bg': '#1E293B',
        },
      })
      .onConflictDoUpdate({
        target: themes.id,
        set: {
          name: 'Cyber Neon',
          primaryColor: '#06B6D4',
          secondaryColor: '#F43F5E',
          backgroundColor: '#0F172A',
          fontFamily: 'JetBrains Mono',
        },
      });

    // 2. Seed Demo Professor Account
    console.log('[Seed] Seeding demo professor account...');
    const demoProf = await db
      .insert(professors)
      .values({
        id: '00000000-0000-0000-0000-000000000010',
        email: 'demo@quiz.example.com',
        passwordHash: DEMO_PASSWORD_HASH,
        displayName: 'Professor Demo',
        locale: 'en',
      })
      .onConflictDoUpdate({
        target: professors.email,
        set: {
          displayName: 'Professor Demo',
          locale: 'en',
        },
      })
      .returning();
    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

seed();

