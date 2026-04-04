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
import { redirect } from '@sveltejs/kit';

function decodeToken(token: string): App.Locals['user'] {
  try {
    return JSON.parse(atob(token)) as App.Locals['user'];
  } catch {
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('auth_token');

  event.locals.user = token ? decodeToken(token) : null;

  const { pathname } = event.url;

  // Rotas públicas — não precisa de auth
  if (pathname.startsWith('/auth')) {
    return resolve(event);
  }

  // Rota protegida sem token → redirect
  if (!token) {
    throw redirect(303, '/auth/login');
  }

  // Rotas admin → verificar role
  if (pathname.startsWith('/admin') && event.locals.user?.role !== 'admin') {
    throw redirect(303, '/colaborador/registro');
  }

  return resolve(event);
};
