/**
 * @module lib/server/timesheet
 * @description Utilitários server-side para cálculo de resumo diário de ponto.
 *
 * Conformidade com Portaria 671/2021:
 *  - Registros (Punch) são imutáveis.
 *  - Correções via batidas manuais (createdBy) ou anulações (PunchAnulacao).
 *  - Cálculo ignora batidas anuladas, mas o DTO continua expondo a anulação
 *    para que o front exiba a marcação visual e o AFD futuro liste tudo.
 */

import type { Punch, PunchAnulacao } from '@prisma/client';

export interface AnulacaoDTO {
  motivo: string;
  anuladoPor: string;
  anuladoEm: string;
}

export interface PunchDTO {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  method: string;
  latitude: number | null;
  longitude: number | null;
  createdBy: string | null;
  createdReason: string | null;
  anulacao: AnulacaoDTO | null;
}

export interface DailySummaryDTO {
  date: string;
  punches: PunchDTO[];
  totalHours: number;
  overtime: number;
  deficit: number;
}

export type PunchWithAnulacao = Punch & { anulacao?: PunchAnulacao | null };

export function toPunchDTO(p: PunchWithAnulacao): PunchDTO {
  return {
    id: p.id,
    userId: p.userId,
    type: p.type,
    timestamp: p.timestamp.toISOString(),
    method: p.method,
    latitude: p.latitude,
    longitude: p.longitude,
    createdBy: p.createdBy ?? null,
    createdReason: p.createdReason ?? null,
    anulacao: p.anulacao
      ? {
          motivo: p.anulacao.motivo,
          anuladoPor: p.anulacao.anuladoPor,
          anuladoEm: p.anulacao.anuladoEm.toISOString()
        }
      : null
  };
}

export function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Agrupa pontos por data e calcula totalHours / overtime / deficit por dia.
 * Regra: totalHours = (saida_almoco - entrada) + (saida - retorno_almoco) em horas decimais.
 * Batidas anuladas são exibidas no DTO mas ignoradas no cálculo.
 * Se faltar qualquer um dos 4 tipos válidos, totalHours = 0. Jornada base: 8h/dia.
 */
export function buildDailySummaries(punches: PunchWithAnulacao[]): DailySummaryDTO[] {
  const byDay = new Map<string, PunchWithAnulacao[]>();

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

export function buildSummary(date: string, punches: PunchWithAnulacao[]): DailySummaryDTO {
  const validas = punches.filter((p) => !p.anulacao);
  const byType = new Map(validas.map((p) => [p.type, p]));
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
