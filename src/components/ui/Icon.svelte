<!--
  @component Icon
  @description Ícones SVG inline (stroke). Use prop `name` para selecionar.
-->
<script lang="ts">
	export type IconName =
		| 'clock'
		| 'dashboard'
		| 'approval'
		| 'report'
		| 'history'
		| 'logout'
		| 'check'
		| 'check-circle'
		| 'alert'
		| 'download'
		| 'chevron-down'
		| 'chevron-right'
		| 'x'
		| 'qr';

	interface Props {
		name: IconName;
		size?: number;
		stroke?: number;
	}

	let { name, size = 18, stroke = 2 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'clock'}
		<circle cx="12" cy="12" r="10" />
		<polyline points="12,6 12,12 16,14" />
	{:else if name === 'dashboard'}
		<rect x="3" y="3" width="7" height="7" />
		<rect x="14" y="3" width="7" height="7" />
		<rect x="14" y="14" width="7" height="7" />
		<rect x="3" y="14" width="7" height="7" />
	{:else if name === 'approval'}
		<polyline points="9,11 12,14 22,4" />
		<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
	{:else if name === 'report'}
		<line x1="18" y1="20" x2="18" y2="10" />
		<line x1="12" y1="20" x2="12" y2="4" />
		<line x1="6" y1="20" x2="6" y2="14" />
	{:else if name === 'history'}
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<polyline points="14,2 14,8 20,8" />
		<line x1="16" y1="13" x2="8" y2="13" />
		<line x1="16" y1="17" x2="8" y2="17" />
		<polyline points="10,9 9,9 8,9" />
	{:else if name === 'logout'}
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<polyline points="16,17 21,12 16,7" />
		<line x1="21" y1="12" x2="9" y2="12" />
	{:else if name === 'check'}
		<polyline points="20,6 9,17 4,12" />
	{:else if name === 'check-circle'}
		<circle cx="12" cy="12" r="10" />
		<polyline points="9,12 12,15 16,9" />
	{:else if name === 'alert'}
		<path
			d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
		/>
		<line x1="12" y1="9" x2="12" y2="13" />
		<line x1="12" y1="17" x2="12.01" y2="17" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7,10 12,15 17,10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	{:else if name === 'chevron-down'}
		<polyline points="6,9 12,15 18,9" />
	{:else if name === 'chevron-right'}
		<polyline points="9,18 15,12 9,6" />
	{:else if name === 'x'}
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	{:else if name === 'qr'}
		<rect x="3" y="3" width="7" height="7" />
		<rect x="14" y="3" width="7" height="7" />
		<rect x="3" y="14" width="7" height="7" />
		<line x1="14" y1="14" x2="14" y2="21" />
		<line x1="18" y1="14" x2="18" y2="17" />
		<line x1="21" y1="17" x2="14" y2="17" />
		<line x1="18" y1="21" x2="21" y2="21" />
		<line x1="21" y1="20" x2="21" y2="21" />
	{/if}
</svg>
