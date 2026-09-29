<script lang="ts">
	import { videoUrl, type Media, type Still } from '$lib/site';
	import { rowsOf, frameStyle } from '$lib/frame';
	import { reveal } from '$lib/actions/reveal';
	import Lightbox from './Lightbox.svelte';

	type Props = {
		items: Media[];
		title: string;
		/** Load the first item eagerly — for a hero at the top of the page. */
		priority?: boolean;
	};
	let { items, title, priority = false }: Props = $props();

	const rows = $derived(rowsOf(items));

	// Written out in full so Tailwind sees the class names.
	const grid = {
		1: '',
		2: 'grid grid-cols-2 gap-2',
		3: 'grid grid-cols-3 gap-2',
		4: 'grid grid-cols-2 gap-2 sm:grid-cols-4'
	};

	// Only the images go to the lightbox; videos have their own controls.
	const stills = $derived(
		items.flatMap((item, index): (Still & { index: number })[] =>
			item.kind === 'image'
				? [{ src: item.src, width: item.width, height: item.height, alt: altFor(index), index }]
				: []
		)
	);

	let openIndex = $state<number | null>(null);

	function altFor(index: number) {
		return items.length === 1 ? title : `${title}, ${index + 1} of ${items.length}`;
	}

	/** One video at a time: starting one pauses whichever else is playing. */
	function onplay(event: Event) {
		for (const video of document.querySelectorAll('video')) {
			if (video !== event.currentTarget) video.pause();
		}
	}
</script>

{#snippet deliverable(item: Media, index: number, style: string)}
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
			aria-label={altFor(index)}
			class="mx-auto block h-auto rounded-[5px]"
			{style}
		></video>
	{:else}
		<button
			type="button"
			onclick={() => (openIndex = stills.findIndex((still) => still.index === index))}
			class="mx-auto block cursor-zoom-in overflow-hidden rounded-[5px]"
			{style}
			aria-label="View {altFor(index)} larger"
		>
			<img
				src={item.src}
				alt={altFor(index)}
				width={item.width}
				height={item.height}
				loading={priority && index === 0 ? 'eager' : 'lazy'}
				decoding="async"
				class="block h-full w-full"
			/>
		</button>
	{/if}
{/snippet}

<div class="space-y-2">
	{#each rows as row, r (r)}
		{#if row.cols === 1}
			<!-- Alone in its row: shown whole, and capped to the screen if it's tall. -->
			<div use:reveal>
				{@render deliverable(row.items[0].item, row.items[0].index, frameStyle(row.items[0].item))}
			</div>
		{:else}
			<!-- Identically sized pieces, so every cell is the same shape and nothing crops. -->
			<div class={grid[row.cols]}>
				{#each row.items as { item, index } (index)}
					<div use:reveal>
						{@render deliverable(item, index, frameStyle(item))}
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</div>

<Lightbox photos={stills} bind:index={openIndex} />
