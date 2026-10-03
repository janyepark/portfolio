import type { Action } from 'svelte/action';

/**
 * Sets `--shrinkwrap` on the node to the width of its longest wrapped line.
 *
 * A box with wrapped text stays as wide as the space it wrapped in, so the
 * ragged end of every line leaves a gap CSS alone can't close. Sizing the box
 * to its longest line closes it, so the gutter beside it is exactly the gap
 * set in CSS. Without JS the variable is unset and the box keeps its width.
 */
export const shrinkwrap: Action<HTMLElement> = (node) => {
	const range = document.createRange();

	function measure() {
		node.style.removeProperty('--shrinkwrap');
		// Text nodes one at a time: a range over whole elements would also
		// report their full-width block boxes.
		let right = -Infinity;
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			range.selectNodeContents(walker.currentNode);
			for (const rect of range.getClientRects()) right = Math.max(right, rect.right);
		}
		const left = node.getBoundingClientRect().left;
		if (Number.isFinite(right)) {
			node.style.setProperty('--shrinkwrap', `${Math.ceil(right - left)}px`);
		}
	}

	measure();
	// Fonts swap in after first paint and change every line's width.
	document.fonts?.ready.then(measure);
	const observer = new ResizeObserver(() => requestAnimationFrame(measure));
	observer.observe(node.parentElement ?? node);

	return { destroy: () => observer.disconnect() };
};
