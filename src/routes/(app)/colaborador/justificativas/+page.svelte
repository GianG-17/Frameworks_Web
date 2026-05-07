<!--
  @page /colaborador/justificativas
  @description Página para colaborador submeter justificativas de falta com suporte a foto.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { justificativaService, type Justificativa } from '@/services/justificativa.service';

  let minhaJustificativas = $state<Justificativa[]>([]);
  let errorMsg = $state('');
  let successMsg = $state('');
  let loading = $state(false);
  let previewUrl = $state<string | null>(null);
  let form = $state({
    data: '',
    motivo: '',
    anexoUrl: '',
    fotoFile: null as File | null
  });

  let fileInput: HTMLInputElement | undefined;

  async function carregar() {
    try {
      minhaJustificativas = await justificativaService.listMy();
    } catch {
      errorMsg = 'Erro ao carregar justificativas.';
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        errorMsg = 'Por favor, selecione uma imagem válida.';
        return;
      }
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        errorMsg = 'A imagem não pode exceder 5MB.';
        return;
      }
      form.fotoFile = file;
      errorMsg = '';
    }
  }

  async function enviarComFoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Formata como data URL
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  async function criar(e: Event) {
    e.preventDefault();
    errorMsg = '';
    successMsg = '';

    try {
      if (!form.data || !form.motivo) {
        errorMsg = 'Data e motivo são obrigatórios.';
        return;
      }

      loading = true;
      let anexoUrl = form.anexoUrl;

      // Se houver arquivo, converte para base64
      if (form.fotoFile) {
        anexoUrl = await enviarComFoto(form.fotoFile);
      }

      await justificativaService.createMy({
        data: form.data,
        motivo: form.motivo,
        anexoUrl: anexoUrl || undefined
      });

      successMsg = 'Justificativa enviada com sucesso!';
      form = { data: '', motivo: '', anexoUrl: '', fotoFile: null };
      if (fileInput) fileInput.value = '';

      await carregar();
    } catch (error) {
      errorMsg = error instanceof Error ? error.message : 'Erro ao enviar justificativa.';
    } finally {
      loading = false;
    }
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function abrirAnexo(url: string) {
    previewUrl = url;
  }

  function fecharPreview() {
    previewUrl = null;
  }

  async function remover(id: string) {
    if (!confirm('Remover esta justificativa?')) return;
    try {
      await justificativaService.removeMy(id);
      await carregar();
    } catch {
      errorMsg = 'Erro ao remover justificativa.';
    }
  }

  onMount(carregar);
</script>

<svelte:head><title>Justificativas — Colaborador</title></svelte:head>

<section class="page">
  <h1>Justificativas de Falta</h1>

  {#if errorMsg}
    <div class="alert alert-error">{errorMsg}</div>
  {/if}

  {#if successMsg}
    <div class="alert alert-success">{successMsg}</div>
  {/if}

  <form class="card form" onsubmit={criar}>
    <h2>Nova justificativa</h2>

    <label>
      Data da falta
      <input type="date" bind:value={form.data} required disabled={loading} />
    </label>

    <label>
      Motivo
      <textarea bind:value={form.motivo} required disabled={loading} placeholder="Descreva o motivo da falta..."></textarea>
    </label>

    <label>
      URL do anexo (opcional)
      <input type="url" bind:value={form.anexoUrl} disabled={loading} placeholder="https://exemplo.com/anexo" />
    </label>

    <label>
      Adicionar foto (opcional)
      <input
        type="file"
        accept="image/*"
        onchange={handleFileChange}
        disabled={loading}
        bind:this={fileInput}
      />
      {#if form.fotoFile}
        <small class="text-success">✓ Arquivo selecionado: {form.fotoFile.name}</small>
      {/if}
    </label>

    <button class="btn" type="submit" disabled={loading}>
      {loading ? 'Enviando...' : 'Enviar Justificativa'}
    </button>
  </form>

  <div class="card">
    <h2>Minhas justificativas</h2>
    {#if minhaJustificativas.length === 0}
      <p class="muted">Nenhuma justificativa enviada.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Motivo</th>
            <th>Anexo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each minhaJustificativas as j (j.id)}
            <tr>
              <td>{fmt(j.data)}</td>
              <td>{j.motivo}</td>
              <td>
                {#if j.anexoUrl}
                  <button class="link-button" type="button" onclick={() => abrirAnexo(j.anexoUrl)}>
                    {j.anexoUrl.startsWith('data:') ? '🖼️ Foto' : 'ver'}
                  </button>
                {:else}
                  —
                {/if}
              </td>
              <td>
                <button class="btn-del" type="button" onclick={() => remover(j.id)}>
                  🗑️
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>

{#if previewUrl}
  <div class="preview-backdrop" role="button" tabindex="0" onclick={fecharPreview} onkeydown={(e) => e.key === 'Escape' && fecharPreview()}>
    <div class="preview-modal" role="dialog" aria-modal="true" aria-label="Visualização de anexo" onclick={(e) => e.stopPropagation()}>
      <button type="button" class="preview-close" onclick={fecharPreview}>Fechar</button>
      <img src={previewUrl} alt="Anexo da justificativa" />
    </div>
  </div>
{/if}

<style>
  .page {
    padding: 2rem;
    max-width: 1000px;
    margin: 0 auto;
  }

  h1 {
    margin: 0 0 1.5rem;
    font-size: 1.875rem;
    color: #1e293b;
  }

  .alert {
    padding: 0.875rem 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .alert-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .alert-success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .card h2 {
    margin: 0 0 1.5rem;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .form label {
    display: block;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
  }

  .form label small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    font-weight: normal;
  }

  .text-success {
    color: #16a34a;
  }

  input,
  textarea,
  select {
    display: block;
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.625rem 0.75rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    font-family: inherit;
    transition: border-color 0.2s;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  input:disabled,
  textarea:disabled {
    background: #f8fafc;
    color: #94a3b8;
    cursor: not-allowed;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .btn:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  .btn-del {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem 0.5rem;
    transition: opacity 0.2s;
  }

  .btn-del:hover {
    opacity: 0.7;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    font-weight: 600;
  }

  td {
    padding: 1rem 0.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .muted {
    color: #64748b;
    font-size: 0.9rem;
  }

  .link-button {
    background: none;
    border: none;
    padding: 0;
    color: #3b82f6;
    cursor: pointer;
    font: inherit;
  }

  .link-button:hover {
    text-decoration: underline;
  }

  .preview-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.75);
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 1000;
  }

  .preview-modal {
    width: min(96vw, 1000px);
    max-height: 92vh;
    background: #0f172a;
    border-radius: 0.75rem;
    padding: 0.75rem;
    display: grid;
    gap: 0.5rem;
  }

  .preview-modal img {
    width: 100%;
    max-height: calc(92vh - 3rem);
    object-fit: contain;
    border-radius: 0.5rem;
    background: #020617;
  }

  .preview-close {
    justify-self: end;
    border: none;
    border-radius: 0.5rem;
    padding: 0.4rem 0.7rem;
    background: #1d4ed8;
    color: #fff;
    cursor: pointer;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
