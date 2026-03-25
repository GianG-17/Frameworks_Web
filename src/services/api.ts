/**
 * @module services/api
 * @description Cliente HTTP centralizado para comunicação com a API.
 *
 * Todas as requisições do app passam por aqui, garantindo:
 *  - Base URL única
 *  - Headers padrão (Content-Type, Authorization)
 *  - Interceptação de erros (401 → redirect p/ login)
 *  - Tipagem forte nos retornos
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function buildHeaders(custom?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...custom
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<TResponse>(response: Response): Promise<TResponse> {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth/login';
    }

    const error: ApiError = {
      status: response.status,
      message: response.statusText,
      details: await response.json().catch(() => null)
    };

    throw error;
  }

  if (response.status === 204) return undefined as TResponse;
  return response.json() as Promise<TResponse>;
}

export async function api<TResponse, TBody = unknown>(
  endpoint: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = 'GET', body, headers, signal } = options;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: buildHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  return handleResponse<TResponse>(response);
}

/** Atalhos tipados para cada verbo HTTP */
export const get = <T>(url: string, signal?: AbortSignal) =>
  api<T>(url, { signal });

export const post = <T, B = unknown>(url: string, body: B) =>
  api<T, B>(url, { method: 'POST', body });

export const put = <T, B = unknown>(url: string, body: B) =>
  api<T, B>(url, { method: 'PUT', body });

export const patch = <T, B = unknown>(url: string, body: B) =>
  api<T, B>(url, { method: 'PATCH', body });

export const del = <T>(url: string) =>
  api<T>(url, { method: 'DELETE' });
