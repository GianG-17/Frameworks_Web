<!--
  @component Avatar
  @description Avatar circular com iniciais. Cor de fundo customizável.
-->
<script lang="ts">
	interface Props {
		initials: string;
		size?: number;
		color?: string;
	}

	let { initials, size = 32, color = 'var(--color-primary)' }: Props = $props();
</script>

<div
	class="avatar"
	style="width: {size}px; height: {size}px; background: {color}; font-size: {size * 0.35}px;"
>
	{initials}
</div>

<style>
	.avatar {
		border-radius: 50%;
		color: #fff;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		flex-shrink: 0;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}
</style>
