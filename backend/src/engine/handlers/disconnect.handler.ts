import { Server, Socket } from 'socket.io';
import { RoomStateManager } from '../state/room-state.manager.js';

export function registerDisconnectHandler(io: Server, socket: Socket): void {
  socket.on('disconnect', async () => {
    const pin = (socket as any).pin;
    const playerId = (socket as any).playerId;

    if (pin && playerId) {
      const player = await RoomStateManager.getPlayer(pin, playerId);
      if (player) {
        player.connected = false;
        await RoomStateManager.addPlayer(pin, player);

        // Notify room of connection status change
        const players = await RoomStateManager.getAllPlayers(pin);
        io.to(pin).emit('room:player_list', {
          players: players.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            connected: p.connected,
          })),
        });
      }
    }
  });
}

