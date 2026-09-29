<script lang="ts">
	import type { Still } from '$lib/site';

	type Props = { photos: Still[]; index: number | null };
	let { photos, index = $bindable() }: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);
	const current = $derived(index === null ? null : photos[index]);

	// showModal() gives us focus trapping, inert background and Esc for free.
	$effect(() => {
		if (!dialog) return;
		if (index === null) {
			if (dialog.open) dialog.close();
		} else if (!dialog.open) {
			dialog.showModal();
		}
	});

	function step(delta: number) {
		if (index === null) return;
		index = (index + delta + photos.length) % photos.length;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			step(1);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			step(-1);
		}
	}
</script>

<dialog
	bind:this={dialog}
	{onkeydown}
	onclose={() => (index = null)}
	onclick={(event) => {
		// Clicks land on the dialog itself only when they miss the figure.
		if (event.target === dialog) index = null;
	}}
	class="lightbox m-auto max-h-dvh max-w-dvw bg-transparent p-4 text-white backdrop:bg-black/90 sm:p-8"
>
	{#if current}
		<figure class="flex max-h-[92dvh] flex-col items-center gap-4">
			{#key current.src}
				<img
					src={current.src}
					alt={current.alt}
					width={current.width}
					height={current.height}
					class="lightbox-photo max-h-[80dvh] w-auto max-w-full rounded-sm object-contain"
				/>
			{/key}

			<figcaption class="flex items-baseline gap-3 text-sm">
				<span class="text-white/40 tabular-nums">{(index ?? 0) + 1}/{photos.length}</span>
			</figcaption>
		</figure>

		<button
			type="button"
			onclick={() => step(-1)}
			aria-label="Previous image"
			class="absolute top-1/2 left-2 -translate-y-1/2 rounded-full p-3 text-2xl leading-none text-white/60 transition hover:bg-white/10 hover:text-white sm:left-4"
		>
			‹
		</button>
		<button
			type="button"
			onclick={() => step(1)}
			aria-label="Next image"
			class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-3 text-2xl leading-none text-white/60 transition hover:bg-white/10 hover:text-white sm:right-4"
		>
			›
		</button>
		<button
			type="button"
			onclick={() => (index = null)}
			aria-label="Close"
			class="absolute top-2 right-2 rounded-full p-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white sm:top-4 sm:right-4"
		>
			Esc
		</button>
	{/if}
</dialog>
