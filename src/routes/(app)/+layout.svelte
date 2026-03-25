<!--
  @layout (app)
  @description Layout compartilhado para rotas autenticadas (admin + colaborador).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppShell from '@/components/layout/AppShell.svelte';

  interface Props { children: Snippet }
  let { children }: Props = $props();
</script>

<AppShell>
  {@render children()}
</AppShell>
