import { Server, Socket } from 'socket.io';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { RoomStateManager } from '../state/room-state.manager.js';
import { SessionFlusher } from '../persistence/session-flusher.js';

export function registerHostControlHandlers(io: Server, socket: Socket): void {
  // room:close (Host manually closes active session)
  socket.on('room:close', async (payload: { pin: string }) => {
    try {
      const { pin } = payload;
      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) return;

      const db = getDb();
      const questions = await db
        .select({ id: schema.questions.id })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, meta.quizId))
        .orderBy(schema.questions.orderIndex);

      const qIds = questions.map((q) => q.id);

      // Broadcast room:closed to all sockets in room
      io.to(pin).emit('room:closed', {
        pin,
        reason: 'Host has closed the quiz session',
      });

      // Flush to database as FINISHED
      await SessionFlusher.flushSessionToDatabase(pin, 'FINISHED', qIds);
    } catch (err: any) {
      socket.emit('room:error', { code: 'CLOSE_FAILED', message: err.message });
    }
  });
}

