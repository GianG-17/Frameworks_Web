/**
 * @module services/biometria.service
 * @description Status da biometria do colaborador (cadastro é feito no leitor por CPF).
 */

import { get } from './api';

export interface BiometriaStatus {
	biometriaId: number | null;
}

export const biometriaService = {
	/** Status atual da biometria do colaborador logado. */
	status: () => get<BiometriaStatus>('/biometria/status')
};
