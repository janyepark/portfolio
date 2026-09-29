import type { Media } from '$lib/site';

/** Wide enough to always get a row to itself. */
export const isWide = (item: Media) => item.width / item.height >= 1.2;

/** Same pixel size — the only case where deliverables may share a row. */
export const sameSize = (a: Media, b: Media) => a.width === b.width && a.height === b.height;

/**
 * Inline style that shows a deliverable whole, never cropped: its own aspect
 * ratio, as wide as the column allows but no taller than `maxVh` of the
 * screen, so a lone vertical cut doesn't run two screens tall.
 */
export function frameStyle(item: Media, maxVh = 85) {
	const ratio = item.width / item.height;
	return [
		`aspect-ratio: ${item.width} / ${item.height}`,
		`width: min(100%, ${(maxVh * ratio).toFixed(2)}dvh)`,
		`background-color: ${item.tone}`
	].join('; ');
}

/** `cols` is shared by every row of a run, so a short last row keeps the same cell size. */
export type Row = { items: { item: Media; index: number }[]; cols: 1 | 2 | 3 };

/**
 * Deliverables in display order, grouped into rows: a run of identically sized
 * vertical or square pieces shares rows, everything else gets a row of its own.
 * Runs split into rows of up to three, except four, which reads better as 2 + 2.
 */
export function rowsOf(items: Media[]): Row[] {
	const runs: Row['items'][] = [];
	items.forEach((item, index) => {
		const run = runs.at(-1);
		if (run && !isWide(item) && !isWide(run[0].item) && sameSize(run[0].item, item)) {
			run.push({ item, index });
		} else {
			runs.push([{ item, index }]);
		}
	});

	return runs.flatMap((run) => {
		const cols = run.length === 4 ? 2 : (Math.min(run.length, 3) as Row['cols']);
		const rows: Row[] = [];
		for (let i = 0; i < run.length; i += cols) rows.push({ items: run.slice(i, i + cols), cols });
		return rows;
	});
}
