/**
 * @module services/auth.service
 * @description Serviço de autenticação — login por credenciais.
 */

import { post, get } from './api';

export interface LoginCredentials {
	identifier: string;
	password: string;
}

export interface AuthResponse {
	token: string;
	user: {
		id: string;
		nome: string;
		email: string;
		cpf: string;
		role: 'admin' | 'colaborador';
		empresaId: string;
		colaboradorId: string | null;
	};
}

export interface MessageResponse {
	message: string;
}

export const authService = {
	login: (credentials: LoginCredentials) => post<AuthResponse>('/auth/login', credentials),

	logout: () => post<void>('/auth/logout', {}),

	me: () => get<AuthResponse['user']>('/auth/me'),

	/** Dispara o e-mail de recuperação. Resposta sempre genérica (anti-enumeração). */
	forgotPassword: (identifier: string) =>
		post<MessageResponse>('/auth/forgot-password', { identifier }),

	/** Redefine a senha a partir do token recebido por e-mail. */
	resetPassword: (token: string, password: string) =>
		post<MessageResponse>('/auth/reset-password', { token, password })
};
