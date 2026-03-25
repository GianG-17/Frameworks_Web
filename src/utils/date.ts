/**
 * @module utils/date
 * @description Funções utilitárias para formatação e cálculo de datas/horas.
 *
 * Usa Intl.DateTimeFormat nativo — sem dependência de libs externas.
 */

const LOCALE = 'pt-BR';
const TIMEZONE = 'America/Sao_Paulo';

/** "25/03/2026" */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date));
}

/** "08:32" */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(date));
}

/** "08h 32min" */
export function formatHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(Math.abs(totalMinutes) / 60);
  const m = Math.abs(totalMinutes) % 60;
  const sign = totalMinutes < 0 ? '-' : '';
  return `${sign}${h}h ${String(m).padStart(2, '0')}min`;
}

/** Diferença em minutos entre dois timestamps */
export function diffInMinutes(start: Date | string, end: Date | string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 60_000);
}

/** Verifica se uma data é hoje */
export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
