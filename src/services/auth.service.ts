/**
 * @module services/auth.service
 * @description Serviço de autenticação — login por credenciais e QR Code.
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

export interface QrCodePayload {
  code: string;
  timestamp: number;
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    post<AuthResponse>('/auth/login', credentials),

  loginByQrCode: (payload: QrCodePayload) =>
    post<AuthResponse>('/auth/qrcode', payload),

  logout: () =>
    post<void>('/auth/logout', {}),

  me: () =>
    get<AuthResponse['user']>('/auth/me')
};
