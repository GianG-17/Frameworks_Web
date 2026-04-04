/**
 * @module services/auth.service
 * @description Serviço de autenticação — login por credenciais e QR Code.
 */

import { post, get } from './api';
import { authMockService } from './mock/auth.mock';

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
  };
}

export interface QrCodePayload {
  code: string;
  timestamp: number;
}

const USE_MOCK = !import.meta.env.VITE_API_URL || import.meta.env.VITE_USE_MOCK === 'true';

const realAuthService = {
  login: (credentials: LoginCredentials) =>
    post<AuthResponse>('/auth/login', credentials) as Promise<AuthResponse>,

  loginByQrCode: (payload: QrCodePayload) =>
    post<AuthResponse>('/auth/qrcode', payload),

  logout: () =>
    post<void>('/auth/logout', {}),

  me: () =>
    get<AuthResponse['user']>('/auth/me')
};

export const authService = USE_MOCK ? authMockService : realAuthService;
