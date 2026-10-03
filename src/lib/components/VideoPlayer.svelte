<script lang="ts">
	import { videoUrl, type Media } from '$lib/site';
	import VideoPlayer from './VideoPlayer.svelte';

	type Video = Extract<Media, { kind: 'video' }>;
	type Props = {
		item: Video;
		label: string;
		/** Inline sizing from frameStyle. */
		style?: string;
		/** Set on the copy in the lightbox: where to pick up, and whether to keep playing. */
		resume?: { time: number; playing: boolean };
		/** Set on the copy in the lightbox: its button closes the lightbox instead of opening one. */
		onshrink?: () => void;
	};
	let { item, label, style, resume, onshrink }: Props = $props();

	// The browser's own controls dim the picture on hover and pause, offer a
	// picture-in-picture button, and go fullscreen in a separate space. These
	// controls only draw what they need, and "full screen" is a lightbox on
	// the page.

	let video = $state<HTMLVideoElement | null>(null);
	let paused = $state(true);
	let time = $state(0);
	let loadedDuration = $state(0);
	let muted = $state(false);
	let waiting = $state(false);
	let played = $state(false);
	/** Pointer moved recently — controls show while playing. */
	let active = $state(false);
	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	/** Past the poster: the lightbox copy always is. */
	const started = $derived(played || !!resume);
	const duration = $derived(loadedDuration || item.duration);
	const progress = $derived(duration ? Math.min(1, time / duration) : 0);
	const showControls = $derived(started && (paused || active));

	let dialog = $state<HTMLDialogElement | null>(null);
	let expanded = $state<{ time: number; playing: boolean } | null>(null);

	const format = (seconds: number) => {
		const s = Math.max(0, Math.floor(seconds));
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	};

	function wake() {
		active = true;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (active = false), 2000);
	}

	/**
	 * On a touchscreen there's no hover to bring up the controls, so a tap on a
	 * playing video with them hidden only shows them; the next tap pauses.
	 */
	let revealOnly = false;

	function onpointerdown(event: PointerEvent) {
		revealOnly = event.pointerType !== 'mouse' && !paused && !active;
		wake();
	}

	function toggle() {
		if (!video) return;
		if (video.paused) video.play().catch(() => {});
		else video.pause();
	}

	/** One video at a time: starting one pauses whichever else is playing. */
	function onplay() {
		played = true;
		for (const other of document.querySelectorAll('video')) {
			if (other !== video) other.pause();
		}
	}

	function onloadedmetadata() {
		if (!video || !resume) return;
		video.currentTime = resume.time;
		if (resume.playing) video.play().catch(() => {});
	}

	// --- Seeking -------------------------------------------------------------

	let seekBar = $state<HTMLDivElement | null>(null);

	function seekTo(event: PointerEvent) {
		if (!video || !seekBar || !duration) return;
		const rect = seekBar.getBoundingClientRect();
		const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		video.currentTime = time = fraction * duration;
	}

	function onseekdown(event: PointerEvent) {
		seekBar?.setPointerCapture(event.pointerId);
		seekTo(event);
	}

	function onseekmove(event: PointerEvent) {
		if (seekBar?.hasPointerCapture(event.pointerId)) seekTo(event);
	}

	function onseekkey(event: KeyboardEvent) {
		if (!video) return;
		const step = { ArrowLeft: -5, ArrowRight: 5 }[event.key];
		if (step === undefined) return;
		event.preventDefault();
		video.currentTime = time = Math.min(duration, Math.max(0, video.currentTime + step));
	}

	// --- Lightbox --------------------------------------------------------------

	function expand() {
		if (!video) return;
		expanded = { time: video.currentTime, playing: !video.paused };
		video.pause();
	}

	$effect(() => {
		if (dialog && expanded && !dialog.open) dialog.showModal();
	});

	/**
	 * Closes the lightbox and picks up inline wherever it left off. Esc closes
	 * the dialog by itself, so this also runs from its close event.
	 */
	function shrink() {
		if (!expanded) return;
		const big = dialog?.querySelector('video');
		// Closed before it loaded: it never got as far as where it was opened.
		const loaded = !!big && big.readyState > 0;
		if (video) {
			video.currentTime = loaded ? big.currentTime : expanded.time;
			if (loaded ? !big.paused : expanded.playing) video.play().catch(() => {});
		}
		expanded = null;
		dialog?.close();
	}
</script>

<div
	class="relative mx-auto block overflow-hidden rounded-[5px]"
	class:cursor-none={!paused && !active}
	{style}
	onpointermove={wake}
	{onpointerdown}
	onpointerleave={() => (active = false)}
	onfocusin={wake}
	role="group"
	aria-label={label}
>
	<!-- No caption files exist for these cuts yet. -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video
		bind:this={video}
		bind:paused
		bind:currentTime={time}
		bind:duration={loadedDuration}
		bind:muted
		src={videoUrl(item)}
		poster={resume?.time ? undefined : item.poster}
		width={item.width}
		height={item.height}
		playsinline
		disablepictureinpicture
		preload={resume ? 'auto' : 'none'}
		{onplay}
		{onloadedmetadata}
		onwaiting={() => (waiting = true)}
		onplaying={() => (waiting = false)}
		onclick={() => revealOnly || toggle()}
		class="block h-full w-full"
	></video>

	{#if !started}
		<button
			type="button"
			onclick={toggle}
			aria-label="Play {label}"
			class="absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition hover:scale-105 hover:bg-black/50"
		>
			<svg viewBox="0 0 24 24" class="ml-1 size-7 fill-current" aria-hidden="true">
				<path d="M7 4.5v15l13-7.5z" />
			</svg>
		</button>
	{:else if waiting && !paused}
		<span
			class="pointer-events-none absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/30 border-t-white"
			aria-hidden="true"
		></span>
	{/if}

	<!-- No gradient or scrim behind these: the picture stays as bright as it is.
	     A drop shadow keeps them legible on light footage. -->
	<div
		class="absolute inset-x-0 bottom-0 flex items-center gap-3 px-3 pb-2 font-sans text-[0.8rem] text-white tabular-nums drop-shadow-[0_1px_3px_rgb(0_0_0/0.7)] transition-opacity duration-300 sm:gap-4 sm:px-4 sm:pb-3"
		class:opacity-0={!showControls}
		class:pointer-events-none={!showControls}
		inert={!showControls}
	>
		<button type="button" onclick={toggle} aria-label={paused ? 'Play' : 'Pause'} class="p-1">
			<svg viewBox="0 0 24 24" class="size-5 fill-current" aria-hidden="true">
				{#if paused}
					<path d="M7 4.5v15l13-7.5z" />
				{:else}
					<path d="M6 4.5h4v15H6zM14 4.5h4v15h-4z" />
				{/if}
			</svg>
		</button>

		<span class="shrink-0">{format(time)} / {format(duration)}</span>

		<div
			bind:this={seekBar}
			role="slider"
			tabindex="0"
			aria-label="Seek"
			aria-valuemin={0}
			aria-valuemax={Math.round(duration)}
			aria-valuenow={Math.round(time)}
			aria-valuetext="{format(time)} of {format(duration)}"
			onpointerdown={onseekdown}
			onpointermove={onseekmove}
			onkeydown={onseekkey}
			class="group/seek relative h-6 flex-1 cursor-pointer touch-none"
		>
			<div
				class="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/35 transition-[height] group-hover/seek:h-[5px]"
			>
				<div class="h-full rounded-full bg-white" style="width: {progress * 100}%"></div>
			</div>
		</div>

		<button
			type="button"
			onclick={() => (muted = !muted)}
			aria-label={muted ? 'Unmute' : 'Mute'}
			class="p-1"
		>
			<svg
				viewBox="0 0 24 24"
				class="size-5 fill-none stroke-current stroke-2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" class="fill-current" />
				{#if muted}
					<path d="M16 9.5l5 5M21 9.5l-5 5" />
				{:else}
					<path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
				{/if}
			</svg>
		</button>

		<button
			type="button"
			onclick={onshrink ?? expand}
			aria-label={onshrink ? 'Exit full screen' : 'Full screen'}
			class="p-1"
		>
			<svg
				viewBox="0 0 24 24"
				class="size-5 fill-none stroke-current stroke-2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				{#if onshrink}
					<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
				{:else}
					<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
				{/if}
			</svg>
		</button>
	</div>
</div>

{#if !onshrink}
	<!-- The lightbox: the same video, as large as the screen allows, over the
	     dimmed page. Esc, the corner button or a click outside closes it. -->
	<dialog
		bind:this={dialog}
		onclose={shrink}
		onclick={(event) => {
			if (event.target === dialog) shrink();
		}}
		class="lightbox m-auto max-h-dvh max-w-dvw bg-transparent p-4 backdrop:bg-black/90 sm:p-8"
	>
		{#if expanded}
			<VideoPlayer
				{item}
				{label}
				resume={expanded}
				onshrink={shrink}
				style="aspect-ratio: {item.width} / {item.height}; width: min(calc(100vw - 4rem), calc((100dvh - 4rem) * {item.width} / {item.height})); background-color: {item.tone}"
			/>

			<button
				type="button"
				onclick={shrink}
				aria-label="Close"
				class="fixed top-2 right-2 rounded-full p-3 font-sans text-sm text-white/60 transition hover:bg-white/10 hover:text-white sm:top-4 sm:right-4"
			>
				Esc
			</button>
		{/if}
	</dialog>
{/if}
