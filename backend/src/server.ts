import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connected');

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server running at http://localhost:${env.port}`);
      // eslint-disable-next-line no-console
      console.log(`📚 API base:      http://localhost:${env.port}${env.apiPrefix}`);
      // eslint-disable-next-line no-console
      console.log(`🩺 Health check:  http://localhost:${env.port}${env.apiPrefix}/health`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
