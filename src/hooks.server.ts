/**
 * @module hooks.server
 * @description Server hooks do SvelteKit — intercepta toda requisição.
 *
 * Responsável por:
 *  - Verificar token JWT em cookies
 *  - Popular `event.locals.user`
 *  - Bloquear rotas protegidas para não-autenticados
 *  - Bloquear rotas admin para colaboradores
 */

import type { Handle } from '@sveltejs/kit';
import { redirect, json } from '@sveltejs/kit';

function decodeToken(token: string): App.Locals['user'] {
  try {
    return JSON.parse(atob(token)) as App.Locals['user'];
  } catch {
    return null;
  }
}

// Rotas de API públicas (não exigem token)
const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/qrcode'];

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth_token');

  event.locals.user = token ? decodeToken(token) : null;

  const { pathname } = event.url;

  // Rotas de página públicas e documentação
  if (pathname.startsWith('/auth') || pathname.startsWith('/api-docs')) {
    return resolve(event);
  }

  // Rotas de API públicas (login, qrcode)
  if (PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return resolve(event);
  }

  // Rotas de API protegidas → retornar 401 JSON (não redirecionar)
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return json({ error: 'Não autorizado' }, { status: 401 });
    }
    return resolve(event);
  }

  // Rotas de página protegidas → redirecionar
  if (!token) {
    throw redirect(303, '/auth/login');
  }

  // Rotas admin → verificar role
  if (pathname.startsWith('/admin') && event.locals.user?.role !== 'admin') {
    throw redirect(303, '/colaborador/registro');
  }

  return resolve(event);
};
