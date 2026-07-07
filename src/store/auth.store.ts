/**
 * @module store/auth.store
 * @description Estado global de autenticação usando Svelte Stores.
 *
 * Compatível com Svelte 5 — usa writable stores (padrão SvelteKit).
 * Para migrar para runes ($state), basta substituir pelo módulo svelte/reactivity.
 */

import { writable, derived } from 'svelte/store';

export interface User {
	id: string;
	nome: string;
	email: string;
	cpf: string;
	role: 'admin' | 'colaborador';
	empresaId: string;
	colaboradorId: string | null;
}

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, ($user) => $user !== null);
export const isAdmin = derived(user, ($user) => $user?.role === 'admin');

export function setUser(data: User) {
	user.set(data);
}

export function clearUser() {
	user.set(null);
	if (typeof window !== 'undefined') {
		localStorage.removeItem('auth_token');
		document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Lax';
	}
}

/**
 * Decodifica o payload de um JWT (`header.payload.assinatura`) sem verificar a
 * assinatura — a verificação real acontece no servidor (`token.ts`). Aqui só
 * lemos os claims para reidratar o store no client.
 */
function decodeJwtPayload(token: string): (User & { exp?: number }) | null {
	const part = token.split('.')[1];
	if (!part) return null;
	// base64url → base64 + padding, pois atob não entende base64url.
	const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
	return JSON.parse(atob(padded));
}

/**
 * Reidrata o store a partir do token salvo em localStorage.
 * Chamada no boot do client para sobreviver a full reloads (HMR/refresh).
 * Em caso de token inválido ou expirado, limpa cookie + storage.
 */
export function hydrateFromStorage(): void {
	if (typeof window === 'undefined') return;
	const token = localStorage.getItem('auth_token');
	if (!token) return;
	try {
		const parsed = decodeJwtPayload(token);
		const expirado = parsed?.exp != null && parsed.exp * 1000 <= Date.now();
		if (parsed && !expirado && (parsed.role === 'admin' || parsed.role === 'colaborador')) {
			user.set({
				id: parsed.id,
				nome: parsed.nome,
				email: parsed.email,
				cpf: parsed.cpf,
				role: parsed.role,
				empresaId: parsed.empresaId,
				colaboradorId: parsed.colaboradorId ?? null
			});
			return;
		}
		throw new Error('payload inválido');
	} catch {
		clearUser();
	}
}
