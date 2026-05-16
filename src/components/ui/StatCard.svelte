<!--
  @component StatCard
  @description Card colorido com valor grande + label.
-->
<script lang="ts">
	type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

	interface Props {
		label: string;
		value: string | number;
		tone?: Tone;
	}

	let { label, value, tone = 'info' }: Props = $props();
</script>

<div class="stat stat--{tone}">
	<span class="stat__value">{value}</span>
	<span class="stat__label">{label}</span>
</div>

<style>
	.stat {
		border-radius: var(--radius-md);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stat__value {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.stat__label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.8;
	}

	.stat--success {
		background: var(--color-success-bg);
		color: var(--color-success);
	}
	.stat--warning {
		background: var(--color-warning-bg);
		color: var(--color-warning);
	}
	.stat--danger {
		background: var(--color-danger-bg);
		color: var(--color-danger);
	}
	.stat--info {
		background: var(--color-info-bg);
		color: var(--color-info);
	}
	.stat--neutral {
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}
</style>
