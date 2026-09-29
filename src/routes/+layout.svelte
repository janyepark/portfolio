<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { site, intro, links, projects } from '$lib/site';

	let { children } = $props();

	const home = $derived(page.url.pathname === resolve('/'));
	const isCurrent = (slug: string) => page.url.pathname === resolve('/[slug]', { slug });

	// Written out in full so Tailwind sees the class names.
	const nameColor = {
		yellow: 'text-name-yellow',
		green: 'text-name-green',
		red: 'text-name-red',
		blue: 'text-name-blue'
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content={site.description} />
</svelte:head>

<div
	class="min-h-dvh bg-page font-serif text-fg antialiased lg:grid lg:grid-cols-[minmax(22rem,30vw)_1fr]"
>
	<!-- Sticky and independently scrollable on desktop, like a table of contents.
	     On phones it's a plain header, and the project list only shows on the
	     homepage so a project page opens on its work. -->
	<aside
		class="px-5 pt-5 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:pb-8"
		aria-label="About and projects"
	>
		<p class="text-[1.5rem] leading-[1.25] text-pretty lg:text-[1.75rem]">
			{#each intro as part, i (i)}
				{#if i === 0}
					<a
						href={resolve('/')}
						class="{part.color && nameColor[part.color]} transition-opacity hover:opacity-70"
						>{part.text}</a
					>
				{:else if part.href}
					<a
						href={part.href}
						target="_blank"
						rel="external noopener"
						class="{part.color && nameColor[part.color]} transition-opacity hover:opacity-70"
						>{part.text}</a
					>
				{:else if part.color}
					<span class={nameColor[part.color]}>{part.text}</span>
				{:else}
					{part.text}
				{/if}
			{/each}
		</p>

		<nav aria-label="Projects" class="mt-5" class:max-lg:hidden={!home}>
			<ul class="border-t border-rule">
				{#each projects as project (project.slug)}
					<li class="border-b border-rule">
						<a
							href={resolve('/[slug]', { slug: project.slug })}
							aria-current={isCurrent(project.slug) ? 'page' : undefined}
							class="group flex items-baseline gap-2 py-2.5 text-[1.25rem] leading-tight"
						>
							<span class="shrink-0">{project.label}</span>
							<span
								class="truncate text-dim italic transition-colors group-hover:text-fg group-aria-[current=page]:text-fg"
							>
								{project.subtitle}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<ul class="mt-5 space-y-0.5 text-[1.25rem] max-lg:hidden">
			{#each links as link (link.href)}
				<li>
					<a href={link.href} rel="external" class="transition-colors hover:text-dim">
						{link.label === 'Email' ? site.email : link.label}
					</a>
				</li>
			{/each}
		</ul>
	</aside>

	<main class="min-w-0 px-5 pt-5 pb-16">
		{@render children()}

		<!-- The sidebar's links, repeated where phones will find them. -->
		<ul class="mt-16 space-y-0.5 text-[1.25rem] lg:hidden">
			{#each links as link (link.href)}
				<li>
					<a href={link.href} rel="external">
						{link.label === 'Email' ? site.email : link.label}
					</a>
				</li>
			{/each}
		</ul>
	</main>
</div>
