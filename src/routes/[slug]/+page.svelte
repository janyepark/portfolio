<script lang="ts">
	import { resolve } from '$app/paths';
	import { site, mediaFor, coverFor } from '$lib/site';
	import MediaGallery from '$lib/components/MediaGallery.svelte';

	let { data } = $props();

	const project = $derived(data.project);
	const next = $derived(data.next);
	const cover = $derived(coverFor(project));
</script>

<svelte:head>
	<title>{project.title} — {site.title}</title>
	<meta name="description" content={project.description} />
	<meta property="og:title" content={project.title} />
	<meta property="og:description" content={project.description} />
	{#if cover}
		<meta property="og:image" content={site.url + cover.src} />
	{/if}
</svelte:head>

<a
	href={resolve('/')}
	class="mb-4 inline-block font-mono text-[0.8rem] text-dim transition-colors hover:text-fg lg:hidden"
>
	← All projects
</a>

<article>
	<!-- Two columns, like a credit block: the facts on the left, the story on the right. -->
	<header class="grid gap-x-8 gap-y-6 pb-10 text-[0.95rem] leading-snug md:grid-cols-2 md:pb-14">
		<div>
			<p>{project.year}</p>
			<h1 class="text-[1.375rem] leading-tight font-medium tracking-[-0.01em] text-white">
				{project.title}
			</h1>

			<dl class="mt-4">
				<div class="flex gap-1.5">
					<dt class="sr-only">Client</dt>
					<dd>{project.client}</dd>
				</div>
				<div class="flex gap-1.5">
					<dt class="text-dim">Agency —</dt>
					<dd>{project.agency}</dd>
				</div>
				<div class="flex gap-1.5">
					<dt class="text-dim">Role —</dt>
					<dd>{project.role}</dd>
				</div>
			</dl>

			<p class="mt-4 font-mono text-[0.8rem] text-dim">{project.tools.join(', ')}</p>
		</div>

		<div class="max-w-xl">
			<p class="text-pretty">{project.description}</p>
			<p class="mt-4 text-dim italic">{project.discipline.join(', ')}</p>
		</div>
	</header>

	<MediaGallery items={mediaFor(project)} title={project.title} />
</article>

<nav class="mt-16 border-t border-rule pt-4" aria-label="Next project">
	<a
		href={resolve('/[slug]', { slug: next.slug })}
		class="group flex items-baseline gap-2 text-[0.95rem]"
	>
		<span class="font-mono text-[0.8rem] text-dim">Next</span>
		<span class="transition-colors group-hover:text-white">{next.label}</span>
		<span class="font-mono text-[0.8rem] text-dim">{next.subtitle}</span>
		<span class="ml-auto transition-transform group-hover:translate-x-1">→</span>
	</a>
</nav>
