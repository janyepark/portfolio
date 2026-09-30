<script lang="ts">
	import { site, projects, heroFor, type Media, type Project } from '$lib/site';
	import { rowsOf, frameStyle } from '$lib/frame';
	import ProjectTile from '$lib/components/ProjectTile.svelte';

	// Each project is featured by its hero deliverable, in sidebar order.
	const features = projects.flatMap((project) => {
		const hero = heroFor(project);
		return hero ? [{ project, hero }] : [];
	});

	// Same rule as a project page: heroes only share a row when they're the
	// same size and not wide; everything else is full width.
	const byHero = new Map<Media, Project>(features.map(({ project, hero }) => [hero, project]));
	const rows = rowsOf(features.map(({ hero }) => hero));

	// Written out in full so Tailwind sees the class names.
	const grid = {
		1: '',
		2: 'grid grid-cols-2 gap-2',
		3: 'grid grid-cols-3 gap-2'
	};
</script>

<svelte:head>
	<title>{site.title} — {site.tagline}</title>
</svelte:head>

<h1 class="sr-only">{site.name} — selected work</h1>

<div class="space-y-2">
	{#each rows as row, r (r)}
		<div class={grid[row.cols]}>
			{#each row.items as { item, index } (index)}
				<ProjectTile
					project={byHero.get(item)!}
					hero={item}
					style={frameStyle(item)}
					priority={index < 2}
				/>
			{/each}
		</div>
	{/each}
</div>
