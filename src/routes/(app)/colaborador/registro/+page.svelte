<!--
  @page /colaborador/registro
  @description Página de registro de ponto — bater ponto e ver punches do dia.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Button from '@/components/ui/Button.svelte';
  import { timesheetService } from '@/services/timesheet.service';
  import type { PunchType, DailySummary } from '@/services/timesheet.service';
  import { formatDate, formatTime } from '@/utils/date';
  import { useQrScanner } from '@/hooks/useQrScanner';

  const PUNCH_LABELS: Record<PunchType, string> = {
    entrada: 'Entrada',
    saida_almoco: 'Saída Almoço',
    retorno_almoco: 'Retorno Almoço',
    saida: 'Saída'
  };

  const PUNCH_SEQUENCE: PunchType[] = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'];

  let summary = $state<DailySummary | null>(null);
  let loading = $state(false);
  let punching = $state(false);
  let errorMsg = $state('');
  let now = $state(new Date());

  let nextPunchType: PunchType | null = $derived.by(() => {
    if (!summary) return 'entrada';
    const registered = summary.punches.map((p) => p.type);
    return PUNCH_SEQUENCE.find((type) => !registered.includes(type)) ?? null;
  });

  async function loadToday(): Promise<void> {
    loading = true;
    try {
      summary = await timesheetService.today();
    } catch {
      errorMsg = 'Erro ao carregar registros do dia.';
    } finally {
      loading = false;
    }
  }

  let qrInput = $state('');
  let scannerOpen = $state(false);
  let videoEl: HTMLVideoElement | undefined = $state();
  const scanner = useQrScanner();
  const scannerError = scanner.error;
  const scannerResult = scanner.lastResult;

  async function abrirScanner() {
    errorMsg = '';
    scannerOpen = true;
    // aguarda render do <video> antes de iniciar
    await Promise.resolve();
    if (videoEl) await scanner.start(videoEl);
  }

  function fecharScanner() {
    scanner.stop();
    scannerOpen = false;
  }

  async function handlePunch(): Promise<void> {
    const type = nextPunchType;
    if (!type) return;

    punching = true;
    errorMsg = '';
    try {
      await timesheetService.punch({ type, method: 'manual' });
      await loadToday();
    } catch {
      errorMsg = 'Erro ao registrar ponto.';
    } finally {
      punching = false;
    }
  }

  async function processarPayload(payload: string): Promise<void> {
    const type = nextPunchType;
    if (!type) return;
    punching = true;
    errorMsg = '';
    try {
      const parsed = JSON.parse(payload) as { empresaId: string; token: string };
      if (!parsed.empresaId || !parsed.token) throw new Error('formato');
      await timesheetService.punchQr({ empresaId: parsed.empresaId, token: parsed.token, type });
      qrInput = '';
      fecharScanner();
      await loadToday();
    } catch {
      errorMsg = 'QR Code inválido ou expirado.';
    } finally {
      punching = false;
    }
  }

  async function handleQrPunch(): Promise<void> {
    if (!qrInput.trim()) {
      errorMsg = 'Cole o conteúdo do QR Code.';
      return;
    }
    await processarPayload(qrInput);
  }

  // Processa QR automaticamente quando o scanner decodifica algo
  scannerResult.subscribe((value) => {
    if (value && scannerOpen && !punching) {
      processarPayload(value);
    }
  });

  onMount(() => {
    loadToday();
    const timer = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(timer);
  });

  onDestroy(() => {
    scanner.stop();
  });
</script>

<svelte:head>
  <title>Registrar Ponto — Ponto Digital</title>
</svelte:head>

<section class="registro">
  <h1>Registrar Ponto</h1>

  <div class="registro__clock">
    <span class="clock__date">{formatDate(now)}</span>
    <span class="clock__time">
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  </div>

  {#if errorMsg}
    <div class="error" role="alert">{errorMsg}</div>
  {/if}

  <div class="registro__action">
    {#if nextPunchType}
      <Button variant="primary" size="lg" loading={punching} onclick={handlePunch}>
        {PUNCH_LABELS[nextPunchType]}
      </Button>
    {:else}
      <p class="registro__done">Todos os registros do dia foram feitos.</p>
    {/if}
  </div>

  {#if nextPunchType}
    <div class="qr-box">
      <h3>Registrar via QR Code</h3>
      <p class="qr-hint">
        Escaneie o QR Code exibido pela empresa para registrar <strong>{PUNCH_LABELS[nextPunchType]}</strong>.
      </p>

      {#if scannerOpen}
        <div class="scanner">
          <video bind:this={videoEl}><track kind="captions" /></video>
          {#if $scannerError}<p class="error">{$scannerError}</p>{/if}
          <Button variant="secondary" size="md" onclick={fecharScanner}>Fechar câmera</Button>
        </div>
      {:else}
        <Button variant="secondary" size="md" onclick={abrirScanner}>
          📷 Abrir câmera
        </Button>
      {/if}

      <details class="manual">
        <summary>Inserir manualmente</summary>
        <textarea bind:value={qrInput} placeholder={'{"empresaId":"...","token":"123456"}'} rows="3"></textarea>
        <Button variant="secondary" size="md" loading={punching} onclick={handleQrPunch}>
          Confirmar
        </Button>
      </details>
    </div>
  {/if}

  <div class="registro__list">
    <h2>Registros de hoje</h2>

    {#if loading}
      <p class="registro__loading">Carregando...</p>
    {:else if summary && summary.punches.length > 0}
      <ul>
        {#each summary.punches as punch (punch)}
          <li class="punch-item">
            <span class="punch-item__type">{PUNCH_LABELS[punch.type]}</span>
            <span class="punch-item__time">{formatTime(punch.timestamp)}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="registro__empty">Nenhum registro ainda.</p>
    {/if}
  </div>
</section>

<style>
  .registro {
    max-width: 480px;
    margin: 0 auto;
  }

  .registro__clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .clock__date {
    font-size: 0.875rem;
    color: #64748b;
  }

  .clock__time {
    font-size: 2.5rem;
    font-weight: 700;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .registro__action {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .registro__done {
    color: #16a34a;
    font-weight: 600;
    text-align: center;
  }

  .registro__list h2 {
    font-size: 1.125rem;
    margin-bottom: 0.75rem;
    color: #0f172a;
  }

  .registro__list ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .punch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .punch-item__type {
    font-weight: 600;
    color: #334155;
  }

  .punch-item__time {
    font-variant-numeric: tabular-nums;
    color: #2563eb;
    font-weight: 600;
  }

  .registro__loading,
  .registro__empty {
    text-align: center;
    color: #94a3b8;
    padding: 1rem;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .qr-box {
    margin: 1.5rem 0;
    padding: 1.25rem;
    background: #fff;
    border: 1px dashed #cbd5e1;
    border-radius: 0.75rem;
  }

  .qr-box h3 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  .qr-hint {
    color: #64748b;
    font-size: 0.85rem;
    margin: 0 0 0.75rem;
  }

  .scanner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .scanner video {
    width: 100%;
    max-width: 320px;
    border-radius: 0.5rem;
    background: #000;
  }

  .manual {
    margin-top: 0.75rem;
  }

  .manual summary {
    cursor: pointer;
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .qr-box textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-family: monospace;
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
    resize: vertical;
  }
</style>
