import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getPubSubClients } from '../redis/client.js';
import { config } from '../config/env.js';
import { registerLobbyHandlers } from './handlers/lobby.handler.js';
import { registerGameFlowHandlers } from './handlers/game-flow.handler.js';
import { registerHostControlHandlers } from './handlers/host-control.handler.js';
import { registerDisconnectHandler } from './handlers/disconnect.handler.js';
import { ExpirationTracker } from './state/expiration-tracker.js';

let ioInstance: SocketServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  ioInstance = new SocketServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Attach Redis adapter for Swarm multi-node pub/sub sync unless in test mode
  if (config.nodeEnv !== 'test') {
    try {
      const { pubClient, subClient } = getPubSubClients();
      ioInstance.adapter(createAdapter(pubClient, subClient));
    } catch (err: any) {
      console.warn('[Socket.io] Running without Redis adapter:', err.message);
    }
  }

  // Register connection events
  ioInstance.on('connection', (socket) => {
    registerLobbyHandlers(ioInstance!, socket);
    registerGameFlowHandlers(ioInstance!, socket);
    registerHostControlHandlers(ioInstance!, socket);
    registerDisconnectHandler(ioInstance!, socket);
  });

  // Start background expiration scheduler (checks every 15s)
  if (config.nodeEnv !== 'test') {
    ExpirationTracker.startScheduler(ioInstance, 15000);
  }

  return ioInstance;
}

export function getSocketServer(): SocketServer | null {
  return ioInstance;
}

export async function closeSocketServer(): Promise<void> {
  ExpirationTracker.stopScheduler();
  if (ioInstance) {
    await new Promise<void>((resolve) => {
      ioInstance!.close(() => resolve());
    });
    ioInstance = null;
  }
}

