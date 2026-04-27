<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    // SwaggerUIBundle e SwaggerUIStandalonePreset são injetados via CDN
    const ui = (window as any).SwaggerUIBundle;
    const preset = (window as any).SwaggerUIStandalonePreset;

    ui({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [ui.presets.apis, preset],
      layout: 'StandaloneLayout',
      deepLinking: true,
      tryItOutEnabled: true
    });
  });
</script>

<svelte:head>
  <title>API Docs — Ponto Digital</title>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
  />
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
</svelte:head>

<div id="swagger-ui"></div>
