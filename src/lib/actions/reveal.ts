import type { Action } from 'svelte/action';

type Options = { delay?: number };

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fades an element up as it scrolls into view.
 *
 * The hidden state is applied here rather than in CSS on purpose: the site is
 * prerendered, so markup must be fully visible before JS runs. Anything hidden
 * by default would stay invisible for readers without JS.
 */
export const reveal: Action<HTMLElement, Options | undefined> = (node, options) => {
	if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;

	node.dataset.reveal = 'hidden';
	if (options?.delay) node.style.setProperty('--reveal-delay', `${options.delay}ms`);

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.dataset.reveal = 'shown';
				observer.unobserve(entry.target);
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
	);

	observer.observe(node);

	return { destroy: () => observer.disconnect() };
};
