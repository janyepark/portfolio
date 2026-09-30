<script lang="ts">
	import { resolve } from '$app/paths';
	import { videoUrl, stillOf, type Media, type Project } from '$lib/site';
	import { reveal } from '$lib/actions/reveal';

	type Props = {
		project: Project;
		/** The project's hero, shown whole at its own aspect ratio. */
		hero: Media;
		/** Inline sizing from frameStyle. */
		style: string;
		/** Skip lazy-loading — use for anything above the fold. */
		priority?: boolean;
	};

	let { project, hero, style, priority = false }: Props = $props();

	let video = $state<HTMLVideoElement | null>(null);
	let loaded = $state(false);
	let img = $state<HTMLImageElement | null>(null);

	// A cached image can finish decoding before hydration, in which case `onload`
	// never fires and the cover would sit at opacity 0 forever.
	$effect(() => {
		if (img?.complete) loaded = true;
	});

	const canHover = () => window.matchMedia('(hover: hover)').matches;
	const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Preview only on real hover, so phones don't start pulling video on scroll.
	function preview(on: boolean) {
		if (!video || !canHover() || reduced()) return;
		if (on) video.play().catch(() => {});
		else video.pause();
	}
</script>

<a
	href={resolve('/[slug]', { slug: project.slug })}
	use:reveal
	onpointerenter={() => preview(true)}
	onpointerleave={() => preview(false)}
	onfocus={() => preview(true)}
	onblur={() => preview(false)}
	class="group relative mx-auto block overflow-hidden rounded-[5px]"
	{style}
>
	<img
		bind:this={img}
		src={stillOf(hero)}
		alt=""
		width={hero.width}
		height={hero.height}
		loading={priority ? 'eager' : 'lazy'}
		decoding="async"
		onload={() => (loaded = true)}
		class="absolute inset-0 h-full w-full transition-opacity duration-700"
		class:opacity-0={!loaded}
	/>
	{#if hero.kind === 'video'}
		<video
			bind:this={video}
			src={videoUrl(hero)}
			muted
			loop
			playsinline
			preload="none"
			aria-hidden="true"
			tabindex="-1"
			class="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
		></video>
	{/if}

	<span
		class="absolute inset-x-0 bottom-0 flex items-baseline gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-[1.25rem] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
	>
		{project.label}
		<span class="font-sans text-[0.85em] text-white/70 italic">{project.subtitle}</span>
	</span>
	<span class="sr-only">{project.title}</span>
</a>
