/**
 * @module services/relatorio.service
 * @description Relatórios: espelho individual e consolidado mensal.
 */

import { get } from './api';
import type { DailySummary } from './timesheet.service';

export interface EspelhoRelatorio {
  colaborador: { id: string; nome: string };
  inicio: string;
  fim: string;
  dias: DailySummary[];
  totais: { horas: number; extras: number; deficit: number };
}

export interface ConsolidadoLinha {
  colaboradorId: string;
  colaboradorNome: string;
  diasTrabalhados: number;
  horas: number;
  extras: number;
  deficit: number;
  periodosFerias: number;
  faltasJustificadas: number;
}

export interface ConsolidadoRelatorio {
  mes: string;
  linhas: ConsolidadoLinha[];
}

export const relatorioService = {
  espelho: (params: { colaboradorId: string; inicio: string; fim: string }) =>
    get<EspelhoRelatorio>(
      `/relatorios/espelho?colaboradorId=${params.colaboradorId}&inicio=${params.inicio}&fim=${params.fim}`
    ),
  consolidado: (mes: string) =>
    get<ConsolidadoRelatorio>(`/relatorios/consolidado?mes=${mes}`)
};
