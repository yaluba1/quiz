import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { RoomStateManager } from '../state/room-state.manager.js';
import { allocateUniquePin } from '../state/pin-generator.js';
import { PlayerSession, RoomMeta } from '../types.js';
import { ROOM_GRACE_PERIOD_SECONDS } from '../../redis/keys.js';

export function registerLobbyHandlers(io: Server, socket: Socket): void {
  // room:create (Host)
  socket.on(
    'room:create',
    async (
      payload: {
        quizId: string;
        durationMinutes?: number;
        themeId?: string;
        title?: string;
        classGroup?: string;
        executionMode?: 'MANUAL' | 'AUTOMATIC';
      },
      callback
    ) => {
      try {
        const { quizId, durationMinutes = 60, themeId, title, classGroup, executionMode } = payload;
        const db = getDb();

        const [quiz] = await db
          .select()
          .from(schema.quizzes)
          .where(eq(schema.quizzes.id, quizId))
          .limit(1);

        if (!quiz) {
          const err = { code: 'QUIZ_NOT_FOUND', message: 'Quiz not found' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        // Fetch questions count
        const questions = await db
          .select({ id: schema.questions.id })
          .from(schema.questions)
          .where(eq(schema.questions.quizId, quizId));

        if (questions.length === 0) {
          const err = { code: 'NO_QUESTIONS', message: 'Quiz contains no questions' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const pin = await allocateUniquePin();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
        const resolvedExecutionMode: 'MANUAL' | 'AUTOMATIC' =
          executionMode || (quiz.defaultExecutionMode as 'MANUAL' | 'AUTOMATIC') || 'MANUAL';

        // Fetch theme if assigned
        let themeMeta = null;
        const activeThemeId = themeId || quiz.themeId;
        if (activeThemeId) {
          const [t] = await db
            .select()
            .from(schema.themes)
            .where(eq(schema.themes.id, activeThemeId))
            .limit(1);
          if (t) {
            themeMeta = {
              primaryColor: t.primaryColor,
              secondaryColor: t.secondaryColor,
              backgroundColor: t.backgroundColor,
              fontFamily: t.fontFamily,
              logoUrl: t.logoUrl,
            };
          }
        }

        // Insert database session
        const [session] = await db
          .insert(schema.gameSessions)
          .values({
            quizId,
            professorId: quiz.professorId,
            title: title?.trim() || null,
            classGroup: classGroup?.trim() || null,
            pin,
            status: 'LOBBY',
            executionMode: resolvedExecutionMode,
            totalParticipants: 0,
            started_at: now,
            expires_at: expiresAt,
          })
          .returning();

        const roomMeta: RoomMeta = {
          sessionId: session.id,
          professorId: quiz.professorId,
          quizId,
          quizTitle: quiz.title,
          theme: themeMeta || undefined,
          executionMode: resolvedExecutionMode,
          pin,
          status: 'LOBBY',
          currentQuestionIndex: -1,
          totalQuestions: questions.length,
          expiresAt: expiresAt.toISOString(),
        };

        const ttlSeconds = durationMinutes * 60 + ROOM_GRACE_PERIOD_SECONDS;
        await RoomStateManager.setRoomMeta(pin, roomMeta, ttlSeconds);

        // Join host to socket room
        await socket.join(pin);

        const responsePayload = {
          pin,
          sessionId: session.id,
          executionMode: resolvedExecutionMode,
          expiresAt: expiresAt.toISOString(),
          theme: themeMeta,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            totalQuestions: questions.length,
          },
        };

        socket.emit('room:created', responsePayload);
        if (typeof callback === 'function') callback({ data: responsePayload });
      } catch (err: any) {
        socket.emit('room:error', { code: 'CREATE_FAILED', message: err.message });
      }
    }
  );

  // room:host_join (Host joining an activated room)
  socket.on(
    'room:host_join',
    async (payload: { pin: string }, callback) => {
      try {
        const { pin } = payload;
        const meta = await RoomStateManager.getRoomMeta(pin);
        if (!meta) {
          const err = { code: 'ROOM_NOT_FOUND', message: 'Room not found with this PIN' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        await socket.join(pin);
        const hostPayload = {
          success: true,
          pin,
          sessionId: meta.sessionId,
          quizId: meta.quizId,
          quizTitle: meta.quizTitle,
          status: meta.status,
          executionMode: meta.executionMode || 'MANUAL',
          totalQuestions: meta.totalQuestions,
        };

        socket.emit('room:host_joined', hostPayload);
        if (typeof callback === 'function') callback({ data: hostPayload });
      } catch (err: any) {
        socket.emit('room:error', { code: 'HOST_JOIN_FAILED', message: err.message });
      }
    }
  );

  // room:join (Pupil)
  socket.on(
    'room:join',
    async (payload: { pin: string; nickname: string }, callback) => {
      try {
        const { pin, nickname } = payload;

        if (!pin || pin.length !== 6) {
          const err = { code: 'INVALID_PIN', message: 'PIN must be 6 digits' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const trimmedNickname = (nickname || '').trim();
        if (trimmedNickname.length < 1 || trimmedNickname.length > 50) {
          const err = { code: 'INVALID_NICKNAME', message: 'Nickname must be between 1 and 50 characters' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const meta = await RoomStateManager.getRoomMeta(pin);
        if (!meta) {
          const err = { code: 'ROOM_NOT_FOUND', message: 'Room not found with this PIN' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        if (meta.status !== 'LOBBY') {
          const err = { code: 'GAME_ALREADY_STARTED', message: 'Game has already started or ended' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        // Check nickname collision
        const currentPlayers = await RoomStateManager.getAllPlayers(pin);
        const nameCollision = currentPlayers.some(
          (p) => p.nickname.toLowerCase() === trimmedNickname.toLowerCase()
        );

        if (nameCollision) {
          const err = { code: 'NICKNAME_TAKEN', message: 'Nickname is already in use by another player' };
          socket.emit('room:error', err);
          if (typeof callback === 'function') callback({ error: err });
          return;
        }

        const playerId = crypto.randomUUID();
        const player: PlayerSession = {
          id: playerId,
          nickname: trimmedNickname,
          socketId: socket.id,
          connected: true,
          joinedAt: Date.now(),
        };

        await RoomStateManager.addPlayer(pin, player);
        await socket.join(pin);

        // Store player info on socket object for disconnection lookup
        (socket as any).pin = pin;
        (socket as any).playerId = playerId;

        const joinResponse = {
          success: true,
          playerId,
          pin,
          nickname: trimmedNickname,
          quizTitle: meta.quizTitle,
          theme: meta.theme,
        };

        socket.emit('room:joined', joinResponse);
        if (typeof callback === 'function') callback({ data: joinResponse });

        // Broadcast player:joined for host projector
        io.to(pin).emit('player:joined', {
          playerId,
          nickname: trimmedNickname,
          connected: true,
        });

        // Broadcast updated player roster to room
        const updatedPlayers = await RoomStateManager.getAllPlayers(pin);
        io.to(pin).emit('room:player_list', {
          players: updatedPlayers.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            connected: p.connected,
          })),
        });
      } catch (err: any) {
        socket.emit('room:error', { code: 'JOIN_FAILED', message: err.message });
      }
    }
  );

  // room:kick_player (Host)
  socket.on(
    'room:kick_player',
    async (payload: { pin: string; playerId: string }) => {
      try {
        const { pin, playerId } = payload;
        const player = await RoomStateManager.getPlayer(pin, playerId);
        if (!player) return;

        await RoomStateManager.removePlayer(pin, playerId);

        // Send kick event to the specific player socket
        io.to(player.socketId).emit('room:player_kicked', {
          reason: 'You have been removed from the session by the host',
        });

        // Broadcast updated player list
        const remainingPlayers = await RoomStateManager.getAllPlayers(pin);
        io.to(pin).emit('room:player_list', {
          players: remainingPlayers.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            connected: p.connected,
          })),
        });
      } catch (err: any) {
        socket.emit('room:error', { code: 'KICK_FAILED', message: err.message });
      }
    }
  );
}

