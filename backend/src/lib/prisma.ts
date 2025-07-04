import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the PrismaClient instance
// This is necessary for the singleton pattern in development with hot-reloading
declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

// Implement the singleton pattern for PrismaClient
// This prevents multiple instances of PrismaClient in development,
// which can cause issues with hot-reloading and connection pooling.
if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance directly
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // In production, log only errors and warnings to keep console clean
    log: ['error', 'warn'],
  });
} else {
  // In development, use a global variable to preserve the instance across hot-reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // In development, log queries, errors, warnings, and info for debugging
      log: ['error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Optional: Add a check for DATABASE_URL for robustness
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in environment variables.');
  // In a production environment, you might want to throw an error and exit
  // process.exit(1);
}

export default prisma;
