import { config } from './config/env.js';
import { createServer } from './api/server.js';
import { initSocketServer, closeSocketServer } from './engine/socket.js';
import { closeDb } from './db/index.js';
import { closeRedis } from './redis/client.js';

async function bootstrap() {
  const app = await createServer();

  // Attach Socket.io to the underlying HTTP server
  initSocketServer(app.server);

  // Graceful shutdown signals
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await closeSocketServer();
        await app.close();
        await closeDb();
        await closeRedis();
        app.log.info('Graceful shutdown completed');
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error during shutdown');
        process.exit(1);
      }
    });
  }

  try {
    await app.listen({ port: config.port, host: config.host });
    app.log.info(
      `Open Quiz Backend running on http://${config.host}:${config.port} (API docs: http://${config.host}:${config.port}/api/docs)`
    );
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});

