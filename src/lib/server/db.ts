/**
 * @module lib/server/db
 * @description Singleton do PrismaClient. Em dev, o HMR do Vite recarrega o módulo
 * várias vezes — armazenar o cliente em globalThis evita esgotar conexões.
 *
 * Prisma 7 exige um driver adapter explícito (sem engine binário).
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './prisma-client/client';

declare global {
	var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
	globalThis.__prisma = prisma;
}
