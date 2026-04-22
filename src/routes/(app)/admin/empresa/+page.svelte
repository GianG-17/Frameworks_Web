<!--
  @page /admin/empresa
  @description Dados da empresa + QR Code rotativo para ponto via leitor.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import { empresaService, type Empresa, type QrCodeSession } from '@/services/empresa.service';
  import { user as userStore } from '@/store/auth.store';
  import { get } from 'svelte/store';

  let empresa = $state<Empresa | null>(null);
  let qrSession = $state<QrCodeSession | null>(null);
  let qrDataUrl = $state<string>('');
  let salvando = $state(false);
  let errorMsg = $state('');
  let countdown = $state(30);

  let form = $state({ nome: '', cnpj: '', horaAbertura: '', horaFechamento: '' });

  let pollTimer: ReturnType<typeof setInterval> | null = null;

  async function loadEmpresa() {
    const user = get(userStore);
    if (!user) return;
    empresa = await empresaService.get(user.empresaId);
    form = {
      nome: empresa.nome,
      cnpj: empresa.cnpj ?? '',
      horaAbertura: empresa.horaAbertura,
      horaFechamento: empresa.horaFechamento
    };
  }

  async function refreshQr() {
    const user = get(userStore);
    if (!user) return;
    qrSession = await empresaService.qrcode(user.empresaId);
    qrDataUrl = await QRCode.toDataURL(qrSession.qrPayload, { width: 280, margin: 1 });
    countdown = qrSession.expiresInSeconds;
  }

  async function salvar() {
    if (!empresa) return;
    salvando = true;
    errorMsg = '';
    try {
      empresa = await empresaService.update(empresa.id, {
        nome: form.nome,
        cnpj: form.cnpj || undefined,
        horaAbertura: form.horaAbertura,
        horaFechamento: form.horaFechamento
      });
    } catch {
      errorMsg = 'Erro ao salvar.';
    } finally {
      salvando = false;
    }
  }

  onMount(async () => {
    await loadEmpresa();
    await refreshQr();
    pollTimer = setInterval(async () => {
      countdown -= 1;
      if (countdown <= 0) await refreshQr();
    }, 1000);
  });

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer);
  });
</script>

<svelte:head><title>Empresa — Admin</title></svelte:head>

<section class="page">
  <h1>Empresa</h1>

  {#if errorMsg}<div class="error">{errorMsg}</div>{/if}

  <div class="grid">
    <div class="card">
      <h2>Dados e horários</h2>
      <label>Nome<input bind:value={form.nome} /></label>
      <label>CNPJ<input bind:value={form.cnpj} /></label>
      <div class="row">
        <label>Abertura<input type="time" bind:value={form.horaAbertura} /></label>
        <label>Fechamento<input type="time" bind:value={form.horaFechamento} /></label>
      </div>
      <button class="btn" disabled={salvando} onclick={salvar}>
        {salvando ? 'Salvando…' : 'Salvar'}
      </button>
    </div>

    <div class="card qr-card">
      <h2>QR Code de ponto</h2>
      <p class="muted">Colaboradores escaneiam o QR para registrar ponto.</p>
      {#if qrDataUrl}
        <img src={qrDataUrl} alt="QR Code da sessão" class="qr" />
        <div class="token">
          Token: <code>{qrSession?.currentToken}</code>
        </div>
        <div class="countdown">Renova em <strong>{countdown}s</strong></div>
      {:else}
        <p>Gerando QR…</p>
      {/if}
    </div>
  </div>
</section>

<style>
  .page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
  h1 { margin: 0 0 1.5rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; }
  .card h2 { margin: 0 0 1rem; font-size: 1.125rem; }
  label { display: block; margin-bottom: 0.75rem; font-size: 0.875rem; color: #475569; }
  input { display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.9rem; }
  .row { display: flex; gap: 0.75rem; }
  .row label { flex: 1; }
  .btn { margin-top: 0.5rem; padding: 0.625rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; }
  .btn:disabled { opacity: 0.6; }
  .qr-card { text-align: center; }
  .qr { width: 280px; height: 280px; margin: 1rem auto; }
  .token { font-family: monospace; font-size: 1.25rem; margin: 0.5rem 0; }
  .countdown { color: #64748b; font-size: 0.875rem; }
  .muted { color: #64748b; font-size: 0.875rem; }
  .error { background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
  @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
</style>
