/**
 * @module lib/server/db
 * @description Singleton do PrismaClient. Em dev, o HMR do Vite recarrega o módulo
 * várias vezes — armazenar o cliente em globalThis evita esgotar conexões.
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
