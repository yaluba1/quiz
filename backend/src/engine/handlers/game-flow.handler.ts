import { Server, Socket } from 'socket.io';
import { eq, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { RoomStateManager } from '../state/room-state.manager.js';
import { calculateScore } from '../scoring/speed-scorer.js';
import { SessionFlusher } from '../persistence/session-flusher.js';

const roomQuestionTimers = new Map<string, NodeJS.Timeout>();

export function clearRoomQuestionTimer(pin: string): void {
  const existing = roomQuestionTimers.get(pin);
  if (existing) {
    clearTimeout(existing);
    roomQuestionTimers.delete(pin);
  }
}

export function registerGameFlowHandlers(io: Server, socket: Socket): void {
  // Helper to load question and options
  async function loadQuestionWithOpts(quizId: string, orderIndex: number) {
    const db = getDb();
    const [q] = await db
      .select()
      .from(schema.questions)
      .where(
        eq(schema.questions.quizId, quizId)
      )
      .orderBy(schema.questions.orderIndex)
      .limit(1)
      .offset(orderIndex);

    if (!q) return null;

    const opts = await db
      .select()
      .from(schema.answerOptions)
      .where(eq(schema.answerOptions.questionId, q.id))
      .orderBy(schema.answerOptions.orderIndex);

    return { question: q, options: opts };
  }

  // Helper to finalize unsubmitted player answers as empty
  async function finalizeEmptyAnswers(pin: string, questionId: string) {
    const answersRecorded = await RoomStateManager.getAnswersForQuestion(pin, questionId);
    const allPlayers = await RoomStateManager.getAllPlayers(pin);
    const answeredIds = new Set(Object.keys(answersRecorded));

    for (const player of allPlayers) {
      if (!answeredIds.has(player.id)) {
        await RoomStateManager.submitAnswerAtomic(
          pin,
          questionId,
          player.id,
          {
            optionId: null,
            responseTimeMs: 0,
            isCorrect: false,
            pointsEarned: 0,
            isEmpty: true,
          },
          0
        );
      }
    }
  }

  // Helper for automatic mode: advance automatically to next question or podium
  async function autoAdvanceQuestion(pin: string, questionIndex: number) {
    clearRoomQuestionTimer(pin);
    const meta = await RoomStateManager.getRoomMeta(pin);
    if (!meta || meta.currentQuestionIndex !== questionIndex) {
      return;
    }

    const qData = await loadQuestionWithOpts(meta.quizId, questionIndex);
    if (qData) {
      await finalizeEmptyAnswers(pin, qData.question.id);
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex < meta.totalQuestions) {
      await RoomStateManager.updateRoomMeta(pin, {
        status: 'COUNTDOWN',
        currentQuestionIndex: nextIndex,
      });

      // 3-second countdown transition
      io.to(pin).emit('game:countdown', {
        seconds: 3,
        nextQuestionIndex: nextIndex,
        totalQuestions: meta.totalQuestions,
      });

      const nextTimer = setTimeout(async () => {
        await launchQuestion(pin, nextIndex);
      }, 3000);
      roomQuestionTimers.set(pin, nextTimer);
    } else {
      // Last question finished in AUTOMATIC mode -> Podium & flush
      await RoomStateManager.updateRoomMeta(pin, { status: 'PODIUM' });
      const allRankings = await RoomStateManager.getAllRankings(pin);

      const podium = allRankings.slice(0, 3).map((r, i) => ({
        rank: (i + 1) as 1 | 2 | 3,
        playerId: r.playerId,
        nickname: r.nickname,
        finalScore: r.score,
      }));

      io.to(pin).emit('game:podium', {
        podium,
        totalPlayers: allRankings.length,
      });

      const db = getDb();
      const questions = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, meta.quizId))
        .orderBy(schema.questions.orderIndex);

      const qIds = questions.map((q) => q.id);
      await SessionFlusher.flushSessionToDatabase(pin, 'FINISHED', qIds);

      io.to(pin).emit('game:ended', {
        pin,
        status: 'FINISHED',
      });
    }
  }

  // Helper to launch question active state
  async function launchQuestion(pin: string, questionIndex: number) {
    clearRoomQuestionTimer(pin);
    const meta = await RoomStateManager.getRoomMeta(pin);
    if (!meta) return;

    const qData = await loadQuestionWithOpts(meta.quizId, questionIndex);
    if (!qData) return;

    const { question, options } = qData;
    const nowMs = Date.now();
    const timeLimitMs = question.timeLimitSeconds * 1000;
    const basePoints = Math.round(1000 * parseFloat(question.pointsMultiplier));

    await RoomStateManager.updateRoomMeta(pin, {
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: questionIndex,
      questionStartTimeMs: nowMs,
      questionTimeLimitMs: timeLimitMs,
      questionBasePoints: basePoints,
    });

    // Broadcast question:active to room
    // Projector/Host gets full question info
    // Pupils get sanitized options if showAnswersOnDevice is false
    io.to(pin).emit('question:active', {
      questionId: question.id,
      questionIndex,
      totalQuestions: meta.totalQuestions,
      questionText: question.questionText,
      questionType: question.questionType,
      timeLimitSeconds: question.timeLimitSeconds,
      mediaUrl: question.mediaUrl,
      mediaType: question.mediaType,
      showAnswersOnDevice: question.showAnswersOnDevice,
      options: options.map((opt) => ({
        id: opt.id,
        orderIndex: opt.orderIndex,
        optionText: opt.optionText,
        colorShapeIndex: opt.colorShapeIndex,
      })),
    });

    // If AUTOMATIC mode, schedule auto-advance when time limit expires
    if (meta.executionMode === 'AUTOMATIC') {
      const autoTimer = setTimeout(async () => {
        try {
          await autoAdvanceQuestion(pin, questionIndex);
        } catch (err) {
          console.error(`[AutoAdvance Error for pin ${pin}]:`, err);
        }
      }, timeLimitMs + 500);
      roomQuestionTimers.set(pin, autoTimer);
    }
  }

  // game:start (Host)
  socket.on('game:start', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta || meta.status !== 'LOBBY') return;

      await RoomStateManager.updateRoomMeta(pin, { status: 'COUNTDOWN', currentQuestionIndex: 0 });

      // Broadcast 5-second countdown
      io.to(pin).emit('game:countdown', {
        seconds: 5,
        nextQuestionIndex: 0,
        totalQuestions: meta.totalQuestions,
      });

      // Schedule question start after 5 seconds
      setTimeout(async () => {
        await launchQuestion(pin, 0);
      }, 5000);
    } catch (err: any) {
      socket.emit('room:error', { code: 'START_FAILED', message: err.message });
    }
  });

  // question:submit_answer (Pupil)
  socket.on(
    'question:submit_answer',
    async (
      payload: {
        pin: string;
        questionId: string;
        optionId?: string | null;
        clientSendTime?: number;
      },
      callback
    ) => {
      try {
        const { pin, questionId, optionId } = payload;
        const playerId = (socket as any).playerId;

        if (!playerId) {
          const err = { code: 'UNAUTHORIZED', message: 'Player session not established' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const meta = await RoomStateManager.getRoomMeta(pin);
        if (!meta || meta.status !== 'QUESTION_ACTIVE') {
          const err = { code: 'QUESTION_NOT_ACTIVE', message: 'Question is not currently active' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const now = Date.now();
        const startMs = meta.questionStartTimeMs || now;
        const timeLimitMs = meta.questionTimeLimitMs || 20000;
        const responseTimeMs = Math.max(0, now - startMs);

        const isEmpty = !optionId || optionId === '__EMPTY__';
        let isCorrect = false;
        let pointsEarned = 0;
        let newStreak = 0;

        if (!isEmpty) {
          // Fetch correct answer option from database
          const db = getDb();
          const [selectedOption] = await db
            .select()
            .from(schema.answerOptions)
            .where(eq(schema.answerOptions.id, optionId))
            .limit(1);

          isCorrect = Boolean(selectedOption?.isCorrect);
          const currentStreak = await RoomStateManager.getStreak(pin, playerId);
          const basePoints = meta.questionBasePoints || 1000;

          const scoreResult = calculateScore({
            basePoints,
            responseTimeMs,
            timeLimitMs,
            isCorrect,
            currentStreak,
          });

          pointsEarned = scoreResult.pointsEarned;
          newStreak = scoreResult.newStreak;
        }

        // Submit to Redis atomically via Lua
        const accepted = await RoomStateManager.submitAnswerAtomic(
          pin,
          questionId,
          playerId,
          {
            optionId: isEmpty ? null : optionId,
            responseTimeMs,
            isCorrect,
            pointsEarned,
            isEmpty,
          },
          pointsEarned
        );

        if (!accepted) {
          const err = { code: 'DUPLICATE_ANSWER', message: 'Answer already submitted for this question' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        // Update streak in Redis
        await RoomStateManager.setStreak(pin, playerId, newStreak);

        // Immediate feedback response to pupil
        const feedback = {
          isCorrect,
          pointsEarned,
          streak: newStreak,
          responseTimeMs,
          isEmpty,
        };

        socket.emit('question:result_pupil', feedback);
        if (typeof callback === 'function') callback({ data: feedback });

        // Update host with count of answers received
        const answersRecorded = await RoomStateManager.getAnswersForQuestion(pin, questionId);
        const allPlayers = await RoomStateManager.getAllPlayers(pin);
        const answeredCount = Object.keys(answersRecorded).length;
        const totalPlayers = allPlayers.length;

        io.to(pin).emit('question:answer_received', {
          answeredCount,
          totalPlayers,
        });

        // In AUTOMATIC mode: if all registered players have answered, advance immediately
        if (meta.executionMode === 'AUTOMATIC' && totalPlayers > 0 && answeredCount >= totalPlayers) {
          clearRoomQuestionTimer(pin);
          await autoAdvanceQuestion(pin, meta.currentQuestionIndex);
        }
      } catch (err: any) {
        socket.emit('room:error', { code: 'SUBMIT_FAILED', message: err.message });
      }
    }
  );

  // question:show_result (Host)
  socket.on('question:show_result', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      clearRoomQuestionTimer(pin);

      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) return;

      await RoomStateManager.updateRoomMeta(pin, { status: 'QUESTION_RESULT' });

      const qData = await loadQuestionWithOpts(meta.quizId, meta.currentQuestionIndex);
      if (!qData) return;

      const { question, options } = qData;
      const correctOption = options.find((o) => o.isCorrect);

      // Finalize unsubmitted answers as empty
      await finalizeEmptyAnswers(pin, question.id);

      const answersRecorded = await RoomStateManager.getAnswersForQuestion(pin, question.id);
      const allPlayers = await RoomStateManager.getAllPlayers(pin);

      // Compute distribution including empty answers
      const distribution: Record<string, number> = {};
      for (const opt of options) {
        distribution[opt.id] = 0;
      }
      distribution['__EMPTY__'] = 0;

      let emptyCount = 0;
      for (const ans of Object.values(answersRecorded)) {
        if (!ans.optionId || ans.isEmpty || ans.optionId === '__EMPTY__') {
          emptyCount++;
        } else if (distribution[ans.optionId] !== undefined) {
          distribution[ans.optionId]++;
        }
      }
      distribution['__EMPTY__'] = emptyCount;

      io.to(pin).emit('question:result_host', {
        questionId: question.id,
        correctOptionId: correctOption?.id,
        distribution,
        answeredCount: Object.keys(answersRecorded).length,
        emptyCount,
        totalPlayers: allPlayers.length,
      });
    } catch (err: any) {
      socket.emit('room:error', { code: 'RESULT_FAILED', message: err.message });
    }
  });

  // game:show_leaderboard (Host)
  socket.on('game:show_leaderboard', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) return;

      await RoomStateManager.updateRoomMeta(pin, { status: 'LEADERBOARD' });

      const leaderboard = await RoomStateManager.getLeaderboard(pin, 5);
      io.to(pin).emit('game:leaderboard', {
        topPlayers: leaderboard,
      });
    } catch (err: any) {
      socket.emit('room:error', { code: 'LEADERBOARD_FAILED', message: err.message });
    }
  });

  // game:next_question (Host)
  socket.on('game:next_question', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      clearRoomQuestionTimer(pin);

      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) return;

      const nextIndex = meta.currentQuestionIndex + 1;

      if (nextIndex < meta.totalQuestions) {
        await RoomStateManager.updateRoomMeta(pin, {
          status: 'COUNTDOWN',
          currentQuestionIndex: nextIndex,
        });

        io.to(pin).emit('game:countdown', {
          seconds: 5,
          nextQuestionIndex: nextIndex,
          totalQuestions: meta.totalQuestions,
        });

        setTimeout(async () => {
          await launchQuestion(pin, nextIndex);
        }, 5000);
      } else {
        // Last question reached -> Podium
        await RoomStateManager.updateRoomMeta(pin, { status: 'PODIUM' });
        const allRankings = await RoomStateManager.getAllRankings(pin);

        const podium = allRankings.slice(0, 3).map((r, i) => ({
          rank: (i + 1) as 1 | 2 | 3,
          playerId: r.playerId,
          nickname: r.nickname,
          finalScore: r.score,
        }));

        io.to(pin).emit('game:podium', {
          podium,
          totalPlayers: allRankings.length,
        });
      }
    } catch (err: any) {
      socket.emit('room:error', { code: 'NEXT_FAILED', message: err.message });
    }
  });

  // game:end (Host)
  socket.on('game:end', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      clearRoomQuestionTimer(pin);

      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) return;

      const db = getDb();
      const questions = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, meta.quizId))
        .orderBy(schema.questions.orderIndex);

      const qIds = questions.map((q) => q.id);

      await SessionFlusher.flushSessionToDatabase(pin, 'FINISHED', qIds);

      io.to(pin).emit('game:ended', {
        pin,
        status: 'FINISHED',
      });
    } catch (err: any) {
      socket.emit('room:error', { code: 'END_FAILED', message: err.message });
    }
  });
}

