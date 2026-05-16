<!--
  @component Badge
  @description Pill com variantes coloridas e dot opcional.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

	interface Props {
		variant?: Variant;
		dot?: boolean;
		children: Snippet;
	}

	let { variant = 'neutral', dot = false, children }: Props = $props();
</script>

<span class="badge badge--{variant}">
	{#if dot}
		<span class="badge__dot"></span>
	{/if}
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.6rem;
		border-radius: var(--radius-pill);
		font-size: 0.7rem;
		font-weight: 700;
		line-height: 1;
		white-space: nowrap;
	}

	.badge__dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}

	.badge--success {
		background: var(--color-success-bg);
		color: var(--color-success);
	}
	.badge--warning {
		background: var(--color-warning-bg);
		color: var(--color-warning);
	}
	.badge--danger {
		background: var(--color-danger-bg);
		color: var(--color-danger);
	}
	.badge--info {
		background: var(--color-info-bg);
		color: var(--color-info);
	}
	.badge--primary {
		background: var(--color-primary-soft);
		color: var(--color-primary-soft-fg);
	}
	.badge--neutral {
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}
</style>
