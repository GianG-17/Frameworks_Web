/**
 * @module lib
 * @description Ponto de entrada da pasta $lib do SvelteKit.
 *
 * O SvelteKit resolve automaticamente `$lib` para `src/lib`.
 * Use este arquivo para re-exportar utilitários, constantes e tipos
 * que devem ser acessíveis de qualquer lugar do projeto.
 */

// Re-exports de conveniência
export { api, get, post, put, patch, del } from '../services/api';
export { formatDate, formatTime, formatHoursMinutes } from '../utils/date';
