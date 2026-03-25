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
  role: 'admin' | 'colaborador';
}

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, ($user) => $user !== null);
export const isAdmin = derived(user, ($user) => $user?.role === 'admin');

export function setUser(data: User) {
  user.set(data);
}

export function clearUser() {
  user.set(null);
}
