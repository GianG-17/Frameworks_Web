<!--
  @page /admin/justificativas
  @description Lista e cadastro de justificativas de falta.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { justificativaService, type Justificativa } from '@/services/justificativa.service';
  import { colaboradorService } from '@/services/colaborador.service';
  import type { Colaborador } from '@/types/colaborador';

  let lista = $state<Justificativa[]>([]);
  let colaboradores = $state<Colaborador[]>([]);
  let errorMsg = $state('');
  let form = $state({ colaboradorId: '', data: '', motivo: '', anexoUrl: '' });

  async function carregar() {
    try {
      [lista, colaboradores] = await Promise.all([
        justificativaService.list(),
        colaboradorService.listar()
      ]);
    } catch {
      errorMsg = 'Erro ao carregar dados.';
    }
  }

  async function criar(e: Event) {
    e.preventDefault();
    try {
      await justificativaService.create({
        colaboradorId: form.colaboradorId,
        data: form.data,
        motivo: form.motivo,
        anexoUrl: form.anexoUrl || undefined
      });
      form = { colaboradorId: '', data: '', motivo: '', anexoUrl: '' };
      await carregar();
    } catch {
      errorMsg = 'Erro ao cadastrar justificativa.';
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover esta justificativa?')) return;
    await justificativaService.remove(id);
    await carregar();
  }

  function fmt(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  onMount(carregar);
</script>

<svelte:head><title>Justificativas — Admin</title></svelte:head>

<section class="page">
  <h1>Justificativas de Falta</h1>

  {#if errorMsg}<div class="error">{errorMsg}</div>{/if}

  <form class="card form" onsubmit={criar}>
    <h2>Nova justificativa</h2>
    <label>
      Colaborador
      <select bind:value={form.colaboradorId} required>
        <option value="">Selecione…</option>
        {#each colaboradores as c (c.id)}
          <option value={c.id}>{c.nome}</option>
        {/each}
      </select>
    </label>
    <label>Data da falta<input type="date" bind:value={form.data} required /></label>
    <label>Motivo<input bind:value={form.motivo} required /></label>
    <label>URL do anexo (opcional)<input bind:value={form.anexoUrl} /></label>
    <button class="btn" type="submit">Cadastrar</button>
  </form>

  <div class="card">
    <h2>Justificativas cadastradas</h2>
    {#if lista.length === 0}
      <p class="muted">Nenhuma justificativa cadastrada.</p>
    {:else}
      <table>
        <thead><tr><th>Colaborador</th><th>Data</th><th>Motivo</th><th>Anexo</th><th></th></tr></thead>
        <tbody>
          {#each lista as j (j.id)}
            <tr>
              <td>{j.colaboradorNome}</td>
              <td>{fmt(j.data)}</td>
              <td>{j.motivo}</td>
              <td>
                {#if j.anexoUrl}
                  <a href={j.anexoUrl} target="_blank" rel="noopener">ver</a>
                {:else}—{/if}
              </td>
              <td><button class="btn-del" onclick={() => remover(j.id)}>🗑️</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</section>

<style>
  .page { padding: 2rem; max-width: 1000px; margin: 0 auto; }
  h1 { margin: 0 0 1.5rem; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
  .card h2 { margin: 0 0 1rem; font-size: 1.125rem; }
  label { display: block; margin-bottom: 0.75rem; font-size: 0.875rem; color: #475569; }
  input, select { display: block; width: 100%; margin-top: 0.25rem; padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.9rem; }
  .btn { padding: 0.625rem 1.25rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; }
  .btn-del { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem 0.5rem; }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th { text-align: left; padding: 0.5rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.75rem 0.5rem; border-bottom: 1px solid #e2e8f0; }
  .muted { color: #64748b; }
  .error { background: #fef2f2; color: #b91c1c; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; }
  a { color: #3b82f6; }
</style>
