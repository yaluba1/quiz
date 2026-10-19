-- ==============================================================================
-- Open Quiz Platform - GDPR Data Retention & Anonymization Routine
-- ==============================================================================

CREATE OR REPLACE FUNCTION anonymize_expired_game_sessions(
    retention_days INTEGER DEFAULT 30,
    purge_days INTEGER DEFAULT 180
)
RETURNS TABLE (
    anonymized_count BIGINT,
    purged_count BIGINT
) AS $$
DECLARE
    v_retention_date TIMESTAMPTZ;
    v_purge_date TIMESTAMPTZ;
    v_anonymized BIGINT := 0;
    v_purged BIGINT := 0;
BEGIN
    v_retention_date := NOW() - (retention_days || ' days')::INTERVAL;
    v_purge_date := NOW() - (purge_days || ' days')::INTERVAL;

    -- 1. Hard purge game sessions older than purge_days
    WITH deleted_sessions AS (
        DELETE FROM game_sessions
        WHERE ended_at IS NOT NULL
          AND ended_at < v_purge_date
          AND status IN ('FINISHED', 'ABORTED', 'EXPIRED')
        RETURNING id
    )
    SELECT COUNT(*) INTO v_purged FROM deleted_sessions;

    -- 2. Anonymize nicknames and strip response latency from answer_details for results past retention window
    WITH updated_results AS (
        UPDATE game_session_results
        SET nickname = 'Anonymous Pupil',
            answer_details = (
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'questionId', elem->>'questionId',
                            'isCorrect', (elem->>'isCorrect')::boolean,
                            'pointsEarned', (elem->>'pointsEarned')::numeric
                        )
                    ),
                    '[]'::jsonb
                )
                FROM jsonb_array_elements(answer_details) AS elem
            )
        WHERE session_id IN (
            SELECT id FROM game_sessions
            WHERE ended_at IS NOT NULL
              AND ended_at < v_retention_date
              AND status = 'FINISHED'
        )
        AND nickname != 'Anonymous Pupil'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_anonymized FROM updated_results;

    RETURN QUERY SELECT v_anonymized, v_purged;
END;
$$ LANGUAGE plpgsql;

