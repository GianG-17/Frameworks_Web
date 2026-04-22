/**
 * @module hooks/useQrScanner
 * @description Hook para leitura de QR Code via câmera usando `qr-scanner`.
 *
 * Uso em componente Svelte:
 *   const { scanning, lastResult, error, start, stop } = useQrScanner();
 *   onMount(() => start(videoEl));
 *   onDestroy(stop);
 *   $: if ($lastResult) handlePayload($lastResult);
 */

import { writable } from 'svelte/store';
import QrScanner from 'qr-scanner';

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

  let instance: QrScanner | null = null;

  async function start(videoElement: HTMLVideoElement) {
    try {
      error.set(null);
      instance = new QrScanner(
        videoElement,
        (result) => lastResult.set(result.data),
        { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' }
      );
      await instance.start();
      scanning.set(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      error.set(message);
      scanning.set(false);
    }
  }

  function stop() {
    if (instance) {
      instance.stop();
      instance.destroy();
      instance = null;
    }
    scanning.set(false);
  }

  return { scanning, lastResult, error, start, stop };
}
