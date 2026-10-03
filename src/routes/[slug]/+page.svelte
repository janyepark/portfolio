<script lang="ts">
	import { resolve } from '$app/paths';
	import { site, heroFor, restFor, stillOf } from '$lib/site';
	import MediaGallery from '$lib/components/MediaGallery.svelte';
	import { shrinkwrap } from '$lib/actions/shrinkwrap';

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
	class="mb-4 inline-block font-sans text-[0.85rem] text-dim italic transition-colors hover:text-fg lg:hidden"
>
	← All projects
</a>

<article class="@container">
	{#if hero}
		<MediaGallery items={[hero]} title={project.title} priority />
	{/if}

	<!-- Laid out by the room beside the sidebar, not the screen: an iPad shows
	     the sidebar but leaves too little width for three columns.
	     Wide: three columns all starting on the title's line — title and
	     tools, description, credits — with the year above. The outer two are
	     as wide as their text (up to a cap) and the description takes the
	     rest, so the visible space between the three is the same gap.
	     Medium: title beside description, credits under the description at
	     that same gap. Narrow: stacked. -->
	<header
		class="grid gap-x-7 gap-y-4 py-10 text-[1.25rem] leading-snug @2xl:grid-cols-[fit-content(16rem)_minmax(0,1fr)] @2xl:gap-y-1 @min-[60rem]:grid-cols-[fit-content(16rem)_minmax(0,1fr)_fit-content(16rem)]"
	>
		<p class="@2xl:col-span-2 @min-[60rem]:col-span-3">{project.year}</p>

		<div use:shrinkwrap class="@2xl:row-span-2 @2xl:w-(--shrinkwrap) @min-[60rem]:row-span-1">
			<h1 class="text-[1.75rem] leading-tight font-semibold">
				{#each titleParts as part, i (i)}{#if part.italic}<em class="font-sans text-[0.75em]"
							>{part.text}</em
						>{:else}{part.text}{/if}{/each}
			</h1>
			<p class="mt-2 font-sans text-[0.75em] italic">{project.tools.join(', ')}</p>
		</div>

		<p class="text-pretty">{project.description}</p>

		<!-- mt-6 on top of the 4px row gap matches the 28px column gap. -->
		<dl class="@2xl:col-start-2 @2xl:mt-6 @min-[60rem]:col-start-auto @min-[60rem]:mt-0">
			{#each credits as credit (credit.label)}
				<div>
					<dt class="inline font-semibold">{credit.label}</dt>
					<dd class="inline">— {credit.value}</dd>
				</div>
			{/each}
		</dl>
	</header>

	{#if rest.length}
		<MediaGallery items={rest} title={project.title} seamless={project.seamless} />
	{/if}
</article>

<nav class="mt-16 border-t border-rule pt-4" aria-label="Next project">
	<a
		href={resolve('/[slug]', { slug: next.slug })}
		class="group flex items-baseline gap-2 text-[1.25rem]"
	>
		<span class="font-sans text-[0.75em] text-dim italic">Next</span>
		<span class="transition-colors group-hover:text-dim">{next.label}</span>
		<span class="font-sans text-[0.75em] text-dim italic">{next.subtitle}</span>
		<span class="ml-auto transition-transform group-hover:translate-x-1">→</span>
	</a>
</nav>
