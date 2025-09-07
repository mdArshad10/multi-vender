import { PrismaClient } from '@prisma/client';

// Type augmentation with safer typing
declare global {
  var prismaDB: PrismaClient | undefined;
}

// Initialize Prisma Client
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
});

// Store in globalThis only in production to prevent hot-reload issues
if (process.env.NODE_ENV === 'production') {
  global.prismaDB = prisma;
}

// Optional: Add process cleanup handler
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
