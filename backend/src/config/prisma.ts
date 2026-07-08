import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple instances during hot-reload in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProd ? ['error'] : ['query', 'warn', 'error'],
  });

if (!env.isProd) {
  globalForPrisma.prisma = prisma;
}
