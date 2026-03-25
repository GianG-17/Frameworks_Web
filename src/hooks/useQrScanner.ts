/**
 * @module hooks/useQrScanner
 * @description Hook reativo para leitura de QR Code via câmera.
 *
 * Encapsula a lógica de permissão de câmera, streaming de vídeo
 * e decodificação do QR Code. Retorna stores reativos.
 *
 * Uso em componente Svelte:
 *   const { scanning, lastResult, error, start, stop } = useQrScanner();
 */

import { writable } from 'svelte/store';

export interface QrScannerState {
  scanning: ReturnType<typeof writable<boolean>>;
  lastResult: ReturnType<typeof writable<string | null>>;
  error: ReturnType<typeof writable<string | null>>;
  start: (videoElement: HTMLVideoElement) => Promise<void>;
  stop: () => void;
}

export function useQrScanner(): QrScannerState {
  const scanning = writable(false);
  const lastResult = writable<string | null>(null);
  const error = writable<string | null>(null);

  let stream: MediaStream | null = null;
  let animationFrame: number | null = null;

  async function start(videoElement: HTMLVideoElement) {
    try {
      error.set(null);
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      videoElement.srcObject = stream;
      await videoElement.play();
      scanning.set(true);

      // TODO: integrar lib de decodificação (ex: jsQR, @nicolo-ribaudo/qr-reader)
      // A cada frame, capturar imagem do vídeo e decodificar
      function tick() {
        // Placeholder para lógica de decodificação
        animationFrame = requestAnimationFrame(tick);
      }
      tick();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      error.set(message);
      scanning.set(false);
    }
  }

  function stop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    scanning.set(false);
  }

  return { scanning, lastResult, error, start, stop };
}
