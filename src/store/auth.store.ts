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
	name: string;
	email: string;
	cpf: string;
	role: 'admin' | 'colaborador';
	empresaId: string;
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
 * Reidrata o store a partir do token salvo em localStorage.
 * Chamada no boot do client para sobreviver a full reloads (HMR/refresh).
 * Em caso de token inválido, limpa cookie + storage.
 */
export function hydrateFromStorage(): void {
	if (typeof window === 'undefined') return;
	const token = localStorage.getItem('auth_token');
	if (!token) return;
	try {
		const parsed = JSON.parse(atob(token)) as User;
		if (parsed && (parsed.role === 'admin' || parsed.role === 'colaborador')) {
			user.set(parsed);
			return;
		}
		throw new Error('payload inválido');
	} catch {
		clearUser();
	}
}
