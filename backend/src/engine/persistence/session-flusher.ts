import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { RoomStateManager } from '../state/room-state.manager.js';
import { PupilAnswerDetail } from '../../db/schema/game-session-results.js';

export class SessionFlusher {
  /**
   * Flushes in-memory room data from Redis to PostgreSQL for long-term reporting.
   *
   * @param pin 6-digit room PIN
   * @param finalStatus 'FINISHED' or 'EXPIRED'
   * @param questionIds Ordered list of question IDs from the quiz
   */
  static async flushSessionToDatabase(
    pin: string,
    finalStatus: 'FINISHED' | 'EXPIRED' = 'FINISHED',
    questionIds: string[] = []
  ): Promise<void> {
    const meta = await RoomStateManager.getRoomMeta(pin);
    if (!meta) return;

    const db = getDb();
    const players = await RoomStateManager.getAllPlayers(pin);
    const rankings = await RoomStateManager.getAllRankings(pin);

    const now = new Date();

    // 1. Update game_sessions record
    await db
      .update(schema.gameSessions)
      .set({
        status: finalStatus,
        totalParticipants: players.length,
        ended_at: now,
      })
      .where(eq(schema.gameSessions.id, meta.sessionId));

    // 2. Fetch answer details across all questions
    const answersByQuestion: Map<string, Record<string, any>> = new Map();
    for (const qId of questionIds) {
      const qAnswers = await RoomStateManager.getAnswersForQuestion(pin, qId);
      answersByQuestion.set(qId, qAnswers);
    }

    // 3. Prepare game_session_results entries
    const resultsToInsert = rankings.map((rankedPlayer) => {
      let correctCount = 0;
      const pupilAnswerDetails: PupilAnswerDetail[] = [];

      for (const qId of questionIds) {
        const qAnswers = answersByQuestion.get(qId) || {};
        const pupilAns = qAnswers[rankedPlayer.playerId];

        if (pupilAns) {
          if (pupilAns.isCorrect) correctCount++;
          pupilAnswerDetails.push({
            questionId: qId,
            selectedOptionId: pupilAns.optionId || null,
            responseTimeMs: pupilAns.responseTimeMs,
            isCorrect: pupilAns.isCorrect,
            pointsEarned: pupilAns.pointsEarned,
            isEmpty: Boolean(pupilAns.isEmpty || !pupilAns.optionId),
          });
        } else {
          pupilAnswerDetails.push({
            questionId: qId,
            selectedOptionId: null,
            isCorrect: false,
            pointsEarned: 0,
            isEmpty: true,
          });
        }
      }

      return {
        sessionId: meta.sessionId,
        nickname: rankedPlayer.nickname,
        finalScore: rankedPlayer.score,
        finalRank: rankedPlayer.rank,
        correctAnswersCount: correctCount,
        totalQuestionsCount: questionIds.length,
        answerDetails: pupilAnswerDetails,
      };
    });

    if (resultsToInsert.length > 0) {
      await db.insert(schema.gameSessionResults).values(resultsToInsert);
    }

    // 4. Update status in Redis and clean up active mark
    await RoomStateManager.updateRoomMeta(pin, { status: finalStatus });
    await RoomStateManager.cleanupRoom(pin);
  }
}

