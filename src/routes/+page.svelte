<script lang="ts">
	import { site, projects } from '$lib/site';
	import ProjectTile from '$lib/components/ProjectTile.svelte';

	/**
	 * The mosaic repeats in threes: one project across the full width, then two
	 * side by side. Written out in full so Tailwind sees the class names.
	 */
	const layout = (i: number) =>
		i % 3 === 0
			? { span: 'sm:col-span-2', aspect: 'aspect-[16/9]' }
			: { span: '', aspect: 'aspect-[4/5]' };
</script>

<svelte:head>
	<title>{site.title} — {site.tagline}</title>
</svelte:head>

<h1 class="sr-only">{site.name} — selected work</h1>

<div class="grid gap-2 sm:grid-cols-2">
	{#each projects as project, i (project.slug)}
		{@const { span, aspect } = layout(i)}
		<div class={span}>
			<ProjectTile {project} {aspect} priority={i < 3} delay={i % 3 === 2 ? 90 : 0} />
		</div>
	{/each}
</div>
