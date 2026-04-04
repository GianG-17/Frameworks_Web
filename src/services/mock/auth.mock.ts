import type { LoginCredentials, AuthResponse, QrCodePayload } from '../auth.service';
import { MOCK_USERS, MOCK_PASSWORDS, encodeToken, decodeToken, findUserByIdentifier } from './data';

function simulateDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

export const authMockService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const user = findUserByIdentifier(credentials.identifier);
    const normalizedKey = credentials.identifier.replace(/\D/g, '') || credentials.identifier;
    const expectedPassword = MOCK_PASSWORDS[credentials.identifier] ?? MOCK_PASSWORDS[normalizedKey];

    if (!user || credentials.password !== expectedPassword) {
      throw { status: 401, message: 'Credenciais inválidas' };
    }

    const token = encodeToken(user);
    return simulateDelay({ token, user });
  },

  async loginByQrCode(payload: QrCodePayload): Promise<AuthResponse> {
    const colaborador = MOCK_USERS.find((u) => u.role === 'colaborador');

    if (!colaborador || !payload.code) {
      throw { status: 400, message: 'QR Code inválido' };
    }

    const token = encodeToken(colaborador);
    return simulateDelay({ token, user: colaborador });
  },

  async logout(): Promise<void> {
    return simulateDelay(undefined);
  },

  async me(): Promise<AuthResponse['user']> {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    if (!token) {
      throw { status: 401, message: 'Não autenticado' };
    }

    const user = decodeToken(token);
    if (!user) {
      throw { status: 401, message: 'Token inválido' };
    }

    return simulateDelay(user);
  }
};
