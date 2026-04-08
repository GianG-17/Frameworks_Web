<!--
  @component AppShell
  @description Layout principal da aplicação autenticada.
  Renderiza sidebar de navegação + área de conteúdo.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Snippet } from 'svelte';
  import { isAdmin, user, clearUser } from '@/store/auth.store';
  import { authService } from '@/services/auth.service';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  async function handleLogout(): Promise<void> {
    await authService.logout();
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; max-age=0';
    clearUser();
    await goto('/auth/login');
  }
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

    <div class="sidebar__footer">
      {#if $user}
        <span class="sidebar__user">{$user.name}</span>
      {/if}
      <button class="sidebar__logout" onclick={handleLogout}>Sair</button>
    </div>
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

  .sidebar__footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .sidebar__user {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .sidebar__logout {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 150ms ease;
  }

  .sidebar__logout:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .content {
    padding: 2rem;
    background: var(--color-bg, #f8fafc);
  }
</style>
