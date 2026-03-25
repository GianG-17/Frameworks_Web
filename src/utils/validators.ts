/**
 * @module utils/validators
 * @description Funções de validação reutilizáveis para formulários.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}
