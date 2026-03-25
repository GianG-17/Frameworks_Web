<!--
  @component AppShell
  @description Layout principal da aplicação autenticada.
  Renderiza sidebar de navegação + área de conteúdo.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { isAdmin } from '@/store/auth.store';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="app-shell">
  <aside class="sidebar">
    <div class="sidebar__logo">
      <span>⏱</span> Ponto Digital
    </div>

    <nav class="sidebar__nav">
      {#if $isAdmin}
        <a href="/admin/dashboard">Dashboard</a>
        <a href="/admin/colaboradores">Colaboradores</a>
        <a href="/admin/jornadas">Jornadas</a>
      {:else}
        <a href="/colaborador/registro">Registrar Ponto</a>
        <a href="/colaborador/historico">Histórico</a>
      {/if}
    </nav>
  </aside>

  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .app-shell {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    background: var(--color-surface, #1e293b);
    color: #fff;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .sidebar__logo {
    font-size: 1.25rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sidebar__nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sidebar__nav a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    padding: 0.625rem 0.75rem;
    border-radius: 0.375rem;
    transition: all 150ms ease;
  }

  .sidebar__nav a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .content {
    padding: 2rem;
    background: var(--color-bg, #f8fafc);
  }
</style>
