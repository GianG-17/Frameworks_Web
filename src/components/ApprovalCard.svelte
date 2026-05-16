<!--
  @component ApprovalCard
  @description Card de item (justificativa, férias) com avatar, título, badge
  e área expansível com detalhes.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Avatar from '@/components/ui/Avatar.svelte';
	import Badge from '@/components/ui/Badge.svelte';

	type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

	interface Props {
		nome: string;
		titulo: string;
		dataLabel?: string;
		badgeLabel?: string;
		badgeVariant?: Variant;
		expanded?: boolean;
		onToggle?: () => void;
		details: Snippet;
		actions?: Snippet;
	}

	let {
		nome,
		titulo,
		dataLabel = '',
		badgeLabel = '',
		badgeVariant = 'neutral',
		expanded = false,
		onToggle,
		details,
		actions
	}: Props = $props();

	function initialsFromName(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0])
			.join('')
			.toUpperCase();
	}

	const avatarColors = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706'];

	function colorFor(name: string): string {
		const idx = (name.charCodeAt(0) + name.length) % avatarColors.length;
		return avatarColors[idx];
	}
</script>

<div class="card" class:is-open={expanded}>
	<button class="header" onclick={onToggle}>
		<Avatar initials={initialsFromName(nome)} size={38} color={colorFor(nome)} />
		<div class="meta">
			<div class="meta__head">
				<span class="meta__nome">{nome}</span>
				{#if dataLabel}<span class="meta__data">{dataLabel}</span>{/if}
			</div>
			<div class="meta__sub">{titulo}</div>
		</div>
		{#if badgeLabel}
			<Badge variant={badgeVariant}>{badgeLabel}</Badge>
		{/if}
	</button>

	{#if expanded}
		<div class="details">
			{@render details()}
			{#if actions}
				<div class="actions">{@render actions()}</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.card {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		border: 2px solid transparent;
		transition: border-color 0.15s;
		overflow: hidden;
	}

	.card.is-open {
		border-color: var(--color-primary);
	}

	.header {
		display: flex;
		gap: 0.875rem;
		align-items: flex-start;
		width: 100%;
		background: none;
		border: none;
		cursor: pointer;
		padding: 1rem 1.25rem;
		font-family: inherit;
		text-align: left;
	}

	.meta {
		flex: 1;
		min-width: 0;
	}

	.meta__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.meta__nome {
		font-weight: 700;
		color: var(--color-text);
		font-size: 0.9375rem;
	}

	.meta__data {
		font-size: 0.7rem;
		color: var(--color-text-subtle);
	}

	.meta__sub {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		margin-top: 0.125rem;
	}

	.details {
		border-top: 1px solid var(--color-border-soft);
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
	}
</style>
