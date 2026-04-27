/**
 * @module lib/server/timesheet
 * @description Utilitários server-side para cálculo de resumo diário de ponto.
 */

import type { Punch } from '@prisma/client';

export interface PunchDTO {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  method: string;
  latitude: number | null;
  longitude: number | null;
}

export interface DailySummaryDTO {
  date: string;
  punches: PunchDTO[];
  totalHours: number;
  overtime: number;
  deficit: number;
}

export function toPunchDTO(p: Punch): PunchDTO {
  return {
    id: p.id,
    userId: p.userId,
    type: p.type,
    timestamp: p.timestamp.toISOString(),
    method: p.method,
    latitude: p.latitude,
    longitude: p.longitude
  };
}

export function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Agrupa pontos por data e calcula totalHours / overtime / deficit por dia.
 * Regra: totalHours = (saida_almoco - entrada) + (saida - retorno_almoco) em horas decimais.
 * Se faltar qualquer um dos 4 tipos, totalHours = 0. Jornada base considerada: 8h/dia.
 */
export function buildDailySummaries(punches: Punch[]): DailySummaryDTO[] {
  const byDay = new Map<string, Punch[]>();

  for (const p of punches) {
    const key = dateKey(p.timestamp);
    const list = byDay.get(key) ?? [];
    list.push(p);
    byDay.set(key, list);
  }

  const summaries: DailySummaryDTO[] = [];
  for (const [date, dayPunches] of byDay.entries()) {
    dayPunches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    summaries.push(buildSummary(date, dayPunches));
  }

  summaries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return summaries;
}

export function buildSummary(date: string, punches: Punch[]): DailySummaryDTO {
  const byType = new Map(punches.map((p) => [p.type, p]));
  const entrada = byType.get('entrada');
  const saidaAlmoco = byType.get('saida_almoco');
  const retornoAlmoco = byType.get('retorno_almoco');
  const saida = byType.get('saida');

  let totalHours = 0;
  if (entrada && saidaAlmoco && retornoAlmoco && saida) {
    const manha = (saidaAlmoco.timestamp.getTime() - entrada.timestamp.getTime()) / 3_600_000;
    const tarde = (saida.timestamp.getTime() - retornoAlmoco.timestamp.getTime()) / 3_600_000;
    totalHours = Number((manha + tarde).toFixed(2));
  }

  const JORNADA_BASE = 8;
  const overtime = Math.max(0, Number((totalHours - JORNADA_BASE).toFixed(2)));
  const deficit = totalHours > 0 ? Math.max(0, Number((JORNADA_BASE - totalHours).toFixed(2))) : 0;

  return {
    date,
    punches: punches.map(toPunchDTO),
    totalHours,
    overtime,
    deficit
  };
}
