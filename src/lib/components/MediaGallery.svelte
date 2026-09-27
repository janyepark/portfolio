<script lang="ts">
	import { videoUrl, runtime, type Media, type Still } from '$lib/site';
	import { reveal } from '$lib/actions/reveal';
	import Lightbox from './Lightbox.svelte';

	type Props = { items: Media[]; title: string };
	let { items, title }: Props = $props();

	/** Wide enough to get a row to itself. Anything narrower shares a grid. */
	const isWide = (item: Media) => item.width / item.height >= 1.2;

	type Row = { wide: true; item: Media; index: number } | { wide: false; cells: { item: Media; index: number }[] };

	/** Consecutive narrow items are gathered into one grid, so a run of vertical cuts sits side by side. */
	const rows = $derived.by(() => {
		const out: Row[] = [];
		items.forEach((item, index) => {
			if (isWide(item)) return out.push({ wide: true, item, index });
			const last = out.at(-1);
			if (last && !last.wide) last.cells.push({ item, index });
			else out.push({ wide: false, cells: [{ item, index }] });
		});
		return out;
	});

	// Only the images go to the lightbox; videos have their own controls.
	const stills = $derived(
		items.flatMap((item, index): (Still & { index: number })[] =>
			item.kind === 'image'
				? [{ src: item.src, width: item.width, height: item.height, alt: altFor(item, index), caption: item.caption, index }]
				: []
		)
	);

	let openIndex = $state<number | null>(null);

	function altFor(item: Media, index: number) {
		return item.caption ? `${title} — ${item.caption}` : `${title}, ${index + 1} of ${items.length}`;
	}

	/** One video at a time: starting one pauses whichever else is playing. */
	function onplay(event: Event) {
		for (const video of document.querySelectorAll('video')) {
			if (video !== event.currentTarget) video.pause();
		}
	}
</script>

{#snippet cell(item: Media, index: number)}
	<figure use:reveal>
		{#if item.kind === 'video'}
			<!-- No caption files exist for these cuts yet. -->
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				src={videoUrl(item)}
				poster={item.poster}
				width={item.width}
				height={item.height}
				controls
				playsinline
				preload="none"
				{onplay}
				aria-label={altFor(item, index)}
				class="block h-auto w-full rounded-[5px]"
				style:aspect-ratio="{item.width} / {item.height}"
				style:background-color={item.tone}
			></video>
		{:else}
			<button
				type="button"
				onclick={() => (openIndex = stills.findIndex((still) => still.index === index))}
				class="block w-full cursor-zoom-in overflow-hidden rounded-[5px]"
				style:aspect-ratio="{item.width} / {item.height}"
				style:background-color={item.tone}
				aria-label="View {altFor(item, index)} larger"
			>
				<img
					src={item.src}
					alt={altFor(item, index)}
					width={item.width}
					height={item.height}
					loading={index < 2 ? 'eager' : 'lazy'}
					decoding="async"
					class="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.015]"
				/>
			</button>
		{/if}

		{#if item.caption || item.kind === 'video'}
			<figcaption class="mt-2 flex items-baseline justify-between gap-4 font-mono text-[0.8rem] text-dim">
				<span>{item.caption ?? ''}</span>
				{#if item.kind === 'video'}
					<span class="tabular-nums">{runtime(item.duration)}</span>
				{/if}
			</figcaption>
		{/if}
	</figure>
{/snippet}

<div class="space-y-2">
	{#each rows as row, r (r)}
		{#if row.wide}
			{@render cell(row.item, row.index)}
		{:else}
			<!-- Written out in full so Tailwind sees the class names at build time. -->
			<div
				class="grid items-start gap-2 {row.cells.length === 1
					? 'mx-auto max-w-md'
					: row.cells.length === 2 || row.cells.length === 4
						? 'grid-cols-2'
						: 'grid-cols-2 lg:grid-cols-3'}"
			>
				{#each row.cells as { item, index } (index)}
					{@render cell(item, index)}
				{/each}
			</div>
		{/if}
	{/each}
</div>

<Lightbox photos={stills} bind:index={openIndex} />
