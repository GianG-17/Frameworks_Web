/**
 * @module lib/server/totp
 * @description Geração/verificação de tokens TOTP (RFC 6238) para sessão QR de ponto.
 * Passo de 30s, janela de tolerância ±1 para compensar drift de relógio.
 */

import { generateSync, verifySync, generateSecret as libGenerateSecret, generateURI } from 'otplib';

const STEP_SECONDS = 30;
const WINDOW = 1;

export function generateSecret(): string {
  return libGenerateSecret();
}

export function generateToken(secret: string): string {
  return generateSync({ secret, period: STEP_SECONDS });
}

export function verifyToken(token: string, secret: string): boolean {
  const result = verifySync({
    token,
    secret,
    period: STEP_SECONDS,
    epochTolerance: WINDOW * STEP_SECONDS
  });
  return result.valid;
}

/** Segundos até o próximo token começar a valer. */
export function secondsUntilNext(): number {
  const now = Math.floor(Date.now() / 1000);
  return STEP_SECONDS - (now % STEP_SECONDS);
}

export function buildOtpauthUrl(secret: string, label: string, issuer = 'Ponto Digital'): string {
  return generateURI({ secret, label, issuer });
}
