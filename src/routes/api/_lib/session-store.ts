import type { PunchRecord } from '@/services/timesheet.service';

// Armazenamento em memória das batidas registradas via API durante a sessão do servidor de dev.
// Resetado quando o servidor reinicia (comportamento esperado em modo mock).
export const sessionPunches: PunchRecord[] = [];
