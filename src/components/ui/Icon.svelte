<!--
  @component Icon
  @description Renderiza um SVG da pasta src/lib/icons/.
  Para adicionar/trocar um ícone: dropar (ou substituir) um arquivo `.svg` em src/lib/icons/.
  O nome do arquivo (sem .svg) vira o valor aceito em `name`.
  SVGs devem usar `stroke="currentColor"` (ou `fill="currentColor"`) para herdar a cor do CSS pai.
-->
<script lang="ts" module>
	const svgs = import.meta.glob('/src/lib/icons/*.svg', {
		query: '?raw',
		import: 'default',
		eager: true
	}) as Record<string, string>;

	const ICONS: Record<string, string> = {};
	for (const [path, content] of Object.entries(svgs)) {
		const name = path.split('/').pop()!.replace('.svg', '');
		ICONS[name] = content;
	}

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		size?: number;
		stroke?: number;
	}

	let { name, size = 18, stroke = 2 }: Props = $props();

	const html = $derived(
		(ICONS[name] ?? '')
			.replace(/\swidth="[^"]*"/, ` width="${size}"`)
			.replace(/\sheight="[^"]*"/, ` height="${size}"`)
			.replace(/\sstroke-width="[^"]*"/, ` stroke-width="${stroke}"`)
	);
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -- conteúdo vem de SVGs do próprio repo carregados em build-time via import.meta.glob -->
{@html html}
