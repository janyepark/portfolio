<script lang="ts">
	import { resolve } from '$app/paths';
	import { site, heroFor, restFor, stillOf } from '$lib/site';
	import MediaGallery from '$lib/components/MediaGallery.svelte';

	let { data } = $props();

	const project = $derived(data.project);
	const next = $derived(data.next);
	const hero = $derived(heroFor(project));
	const rest = $derived(restFor(project));

	const credits = $derived([
		{ label: 'Client', value: project.client },
		{ label: 'Agency', value: project.agency },
		{ label: 'Role', value: project.role },
		{ label: 'Discipline', value: project.discipline.join(', ') }
	]);

	// Only the words inside a title's parenthetical are italic; the brackets stay
	// upright — "Red Bull Gives You Slides (*Spec Shoot*)".
	const titleParts = $derived(
		project.title
			.split(/\(([^)]*)\)/)
			.flatMap((text, i) =>
				i % 2 ? [{ text: '(' }, { text, italic: true }, { text: ')' }] : text ? [{ text }] : []
			)
	);
</script>

<svelte:head>
	<title>{project.title} — {site.title}</title>
	<meta name="description" content={project.description} />
	<meta property="og:title" content={project.title} />
	<meta property="og:description" content={project.description} />
	{#if hero}
		<meta property="og:image" content={site.url + stillOf(hero)} />
	{/if}
</svelte:head>

<a
	href={resolve('/')}
	class="mb-4 inline-block font-sans text-[1.125rem] text-dim italic transition-colors hover:text-fg lg:hidden"
>
	← All projects
</a>

<article>
	{#if hero}
		<MediaGallery items={[hero]} title={project.title} priority />
	{/if}

	<!-- Three columns spanning the media's full width, all starting on the
	     title's line: title and tools, description, credits. The year sits
	     above, over the first column. Fixed proportions, so the columns fall
	     in the same place on every project whatever their text. -->
	<header
		class="grid gap-x-10 gap-y-4 py-10 text-[1.25rem] leading-snug md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)] md:gap-y-1"
	>
		<p class="md:col-span-3">{project.year}</p>

		<div>
			<h1 class="text-[1.75rem] leading-tight font-semibold text-balance">
				{#each titleParts as part, i (i)}{#if part.italic}<em class="font-sans">{part.text}</em
						>{:else}{part.text}{/if}{/each}
			</h1>
			<p class="mt-2 font-sans italic">{project.tools.join(', ')}</p>
		</div>

		<p class="text-pretty">{project.description}</p>

		<dl>
			{#each credits as credit (credit.label)}
				<div>
					<dt class="inline font-semibold">{credit.label}</dt>
					<dd class="inline">— {credit.value}</dd>
				</div>
			{/each}
		</dl>
	</header>

	{#if rest.length}
		<MediaGallery items={rest} title={project.title} />
	{/if}
</article>

<nav class="mt-16 border-t border-rule pt-4" aria-label="Next project">
	<a
		href={resolve('/[slug]', { slug: next.slug })}
		class="group flex items-baseline gap-2 text-[1.25rem]"
	>
		<span class="font-sans text-dim italic">Next</span>
		<span class="transition-colors group-hover:text-dim">{next.label}</span>
		<span class="font-sans text-dim italic">{next.subtitle}</span>
		<span class="ml-auto transition-transform group-hover:translate-x-1">→</span>
	</a>
</nav>
