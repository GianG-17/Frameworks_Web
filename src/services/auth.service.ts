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
		name: string;
		email: string;
		cpf: string;
		role: 'admin' | 'colaborador';
		empresaId: string;
	};
}

export const authService = {
	login: (credentials: LoginCredentials) => post<AuthResponse>('/auth/login', credentials),

	logout: () => post<void>('/auth/logout', {}),

	me: () => get<AuthResponse['user']>('/auth/me')
};
