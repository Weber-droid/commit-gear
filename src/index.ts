import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { createContainer } from './container.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  await connectDatabase();
  const container = await createContainer();
  const app = createApp(container);

  app.listen(env.PORT, () => {
    logger.info(`Commit Gear API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
