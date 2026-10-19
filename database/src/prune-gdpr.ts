import { sql } from 'drizzle-orm';
import { getDb, closeDb } from './db';

interface PruneResult {
  anonymizedCount: number;
  purgedCount: number;
}

export async function runGdprPrune(
  retentionDays = parseInt(process.env.GDPR_RETENTION_DAYS || '30', 10),
  purgeDays = parseInt(process.env.GDPR_PURGE_DAYS || '180', 10)
): Promise<PruneResult> {
  const db = getDb();
  console.log(`[GDPR Maintenance] Starting prune job: retention=${retentionDays}d, purge=${purgeDays}d`);

  try {
    // Call the PostgreSQL stored procedure if available
    const procResult = await db.execute<{
      anonymized_count: string | number;
      purged_count: string | number;
    }>(
      sql`SELECT * FROM anonymize_expired_game_sessions(${retentionDays}, ${purgeDays});`
    );

    if (procResult.rows && procResult.rows.length > 0) {
      const row = procResult.rows[0];
      const res = {
        anonymizedCount: Number(row.anonymized_count || 0),
        purgedCount: Number(row.purged_count || 0),
      };
      console.log(`[GDPR Maintenance] Stored procedure result: anonymized=${res.anonymizedCount}, purged=${res.purgedCount}`);
      return res;
    }
  } catch (err: any) {
    // If the stored procedure hasn't been created yet, fall back to inline SQL transactions
    console.warn('[GDPR Maintenance] Stored procedure not found or failed, falling back to direct SQL:', err.message);

    const now = new Date();
    const retentionDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const purgeDate = new Date(now.getTime() - purgeDays * 24 * 60 * 60 * 1000);

    // 1. Purge ancient sessions beyond purgeDays
    const purgeQuery = await db.execute(sql`
      DELETE FROM game_sessions
      WHERE ended_at IS NOT NULL
        AND ended_at < ${purgeDate.toISOString()}
        AND status IN ('FINISHED', 'ABORTED', 'EXPIRED');
    `);

    // 2. Anonymize nicknames and scrub high-granularity timing from answer_details for sessions older than retentionDays
    const anonQuery = await db.execute(sql`
      UPDATE game_session_results
      SET nickname = 'Anonymous Pupil',
          answer_details = (
            SELECT jsonb_agg(
              jsonb_build_object(
                'questionId', elem->>'questionId',
                'isCorrect', (elem->>'isCorrect')::boolean,
                'pointsEarned', (elem->>'pointsEarned')::numeric
              )
            )
            FROM jsonb_array_elements(answer_details) AS elem
          )
      WHERE session_id IN (
        SELECT id FROM game_sessions
        WHERE ended_at IS NOT NULL
          AND ended_at < ${retentionDate.toISOString()}
          AND status = 'FINISHED'
      )
      AND nickname != 'Anonymous Pupil';
    `);

    const purged = purgeQuery.rowCount || 0;
    const anonymized = anonQuery.rowCount || 0;
    console.log(`[GDPR Maintenance] Direct SQL result: anonymized=${anonymized}, purged=${purged}`);
    return { anonymizedCount: anonymized, purgedCount: purged };
  }

  return { anonymizedCount: 0, purgedCount: 0 };
}

// When invoked directly via CLI
if (process.argv[1]?.endsWith('prune-gdpr.ts') || process.argv[1]?.endsWith('prune-gdpr.js')) {
  runGdprPrune()
    .then(() => closeDb())
    .catch((err) => {
      console.error('[GDPR Maintenance] Error running maintenance task:', err);
      process.exitCode = 1;
      return closeDb();
    });
}

