/**
 * @module hooks.server
 * @description Server hooks do SvelteKit — intercepta toda requisição.
 *
 * Responsável por:
 *  - Verificar token em cookies
 *  - Popular `event.locals.user`
 *  - Bloquear rotas protegidas para não-autenticados
 *  - Bloquear rotas admin para colaboradores
 */

import type { Handle } from '@sveltejs/kit';
import { redirect, json } from '@sveltejs/kit';
import { decodeToken } from '@/lib/server/token';

// Rotas de API públicas (não exigem token)
const PUBLIC_API_PATHS = ['/api/auth/login'];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('auth_token');
	const decoded = token ? decodeToken(token) : null;

	// Token presente mas inválido → tratar como sessão expirada e limpar cookie.
	if (token && !decoded) {
		event.cookies.delete('auth_token', { path: '/' });
	}

	event.locals.user = decoded as App.Locals['user'];

	const { pathname } = event.url;

	// Rotas de página públicas e documentação
	if (pathname.startsWith('/auth') || pathname.startsWith('/api-docs')) {
		return resolve(event);
	}

	// Rotas de API públicas (login)
	if (PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
		return resolve(event);
	}

	// Rotas de API protegidas → retornar 401 JSON (não redirecionar)
	if (pathname.startsWith('/api/')) {
		if (!decoded) {
			return json({ error: 'Não autorizado' }, { status: 401 });
		}
		return resolve(event);
	}

	// Rotas de página protegidas → redirecionar
	if (!decoded) {
		throw redirect(303, '/auth/login');
	}

	// Rotas admin → verificar role
	if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
		throw redirect(303, '/colaborador/registro');
	}

	return resolve(event);
};
