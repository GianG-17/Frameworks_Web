<!--
  @layout (app)
  @description Layout compartilhado para rotas autenticadas (admin + colaborador).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import AppShell from '@/components/layout/AppShell.svelte';
  import { hydrateFromStorage } from '@/store/auth.store';

  interface Props { children: Snippet }
  let { children }: Props = $props();

  onMount(hydrateFromStorage);
</script>

<AppShell>
  {@render children()}
</AppShell>
