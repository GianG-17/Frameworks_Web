import { decodeToken, type TokenPayload } from '@/lib/server/token';

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export function requireUser(request: Request): TokenPayload {
  const token = extractBearerToken(request);
  if (!token) throw jsonError('Não autenticado', 401);

  const user = decodeToken(token);
  if (!user) throw jsonError('Token inválido', 401);

  return user;
}

export function requireAdmin(request: Request): TokenPayload {
  const user = requireUser(request);
  if (user.role !== 'admin') {
    throw jsonError('Acesso restrito a administradores', 403);
  }
  return user;
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
