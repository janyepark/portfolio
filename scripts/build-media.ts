/**
 * Turns the raw project folders into web-sized media.
 *
 *   bun run build:media [source-dir]
 *
 * Videos are re-encoded to H.264 with the long edge capped at 1920 and written
 * to ../portfolio-media, which is what gets uploaded to R2 — they're far too
 * big for the repo or for Workers static assets (25 MiB per file). Stills,
 * PDF pages and video posters are small, so they go straight into static/.
 *
 * Every output is skipped if it already exists, so re-running after adding a
 * project only encodes the new files. Delete an output to force it.
 *
 * Needs ffmpeg, ffprobe, pdftoppm (poppler) and cwebp on PATH.
 */

import { $ } from 'bun';
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
/**
 * Where the project folders live, searched in order: each file is taken from
 * the first that has it. Files already on the site have been moved into a
 * `done/` folder inside their project's folder, which is searched too.
 */
const SOURCES = (
	process.argv.length > 2
		? process.argv.slice(2)
		: ['/Volumes/MP Creative/JANE PORT', '/Volumes/who dat/PORTFOLIO']
).map((dir) => resolve(dir));
const VIDEO_OUT = resolve(ROOT, '../portfolio-media');
const STATIC_OUT = join(ROOT, 'static');
const MANIFEST = join(ROOT, 'src/lib/generated/media.ts');

/** Long edge, in px, for stills and PDF pages. */
const STILL_EDGE = 2400;
/** Long edge for video and its poster. */
const VIDEO_EDGE = 1920;

/**
 * Outputs are named by position — `01`, `02`, … — counting every item without
 * a `name`, omitted ones included. A file added between existing ones gets a
 * `name` instead, so nothing after it is renumbered: existing outputs are
 * reused by name, and renumbering would pair them with the wrong source (and
 * overwrite videos already live in R2).
 */
type Source = { name?: string } & (
	| /** `posterAt` picks the poster frame, in seconds, when the default lands on a title card or black. */
	  { file: string; posterAt?: number }
	  /** Each page of a PDF becomes its own still: every page, or just `pages` (1-based). */
	| { pdf: string; pages?: number[] }
	/** Left off the site but still counted, so every later file keeps its number. */
	| { omit: string }
);

/**
 * What to take from each project folder, in display order. The `-compressed`
 * duplicates are left out on purpose: re-encoding from the original looks
 * better than re-encoding an already-compressed copy. A path starting `../` is
 * a file loose at the top of a source folder rather than in a project's.
 */
/** `1.mp4` … `n.mp4`, with poster times (seconds) for any that need picking by hand. */
const numbered = (count: number, posterAt: Record<number, number> = {}): Source[] =>
	Array.from({ length: count }, (_, i) => ({ file: `${i + 1}.mp4`, posterAt: posterAt[i + 1] }));

/**
 * `draft` projects are skipped entirely: anything written to static/ ships with
 * the site and is public at its URL, even if no page links to it. Remove the
 * flag (and `hidden` in site.ts) when the project is ready.
 */
const projects: Record<string, { dir: string; items: Source[]; draft?: boolean }> = {
	'curb-the-crisis': {
		dir: 'Curb The Crisis',
		items: [{ file: '2 min.mp4' }, { file: '30 sec.mp4' }, { file: '6 sec.mp4' }]
	},
	'mjff-parkinsons-act': {
		dir: 'MJFF Pro Bono Video',
		items: [{ file: 'MJFF Case Study.mp4', posterAt: 3 }, { file: 'MJF-Shoot_Ted-2_110624.jpg' }]
	},
	'nc-safe': {
		dir: 'NC SAFE',
		// NCDPS is the square re-cut of what was 5.mp4, and takes its place.
		items: [
			...numbered(4),
			{ omit: '5.mp4' },
			{ file: '../NCDPS.mp4', name: 'ncdps', posterAt: 14 }
		]
	},
	'vim-open-enrollment': {
		dir: 'VIM Ad Campaign',
		items: [...numbered(5, { 1: 21, 2: 28 }), { file: '../VIM.mp4' }]
	},
	'usda-cep': {
		dir: 'USDA',
		items: numbered(3, { 1: 10, 2: 34, 3: 13 })
	},
	'sofar-sounds': {
		dir: 'Sofar Sounds',
		items: [
			{ file: 'Parisalexa Performance.mp4', posterAt: 1 },
			{ file: 'TeZA Talks Interview.mp4', posterAt: 13 },
			{ file: 'Hamzaa Interview.mp4', name: 'hamzaa-interview', posterAt: 13 },
			{ file: 'toronto_performance_jordan_v02.mov' },
			{ file: 'nashville_short_10s_v01.mov' }
		]
	},
	'red-bull-gives-you-slides': {
		dir: 'Red Bull Spec Shoot',
		items: [
			{ file: 'Red Bull Gives You Slides.mp4', posterAt: 46 },
			...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => ({ file: `${n}.png` }))
		]
	},
	ramenya: {
		dir: 'Ramenya',
		// RMY 1 and 2 follow the first pair of posters. RMY 3 is the new menu,
		// in place of 5.pdf.
		items: [
			{ file: 'ramenya promo.mp4', posterAt: 44 },
			{ pdf: '1.pdf' },
			{ pdf: '2.pdf' },
			{ pdf: 'RMY 1.pdf', name: 'rmy-1' },
			{ pdf: 'RMY 2.pdf', name: 'rmy-2' },
			{ pdf: '3.pdf' },
			{ pdf: '4.pdf' },
			{ omit: '5.pdf' },
			{ pdf: 'RMY 3.pdf', name: 'rmy-3' }
		]
	},
	'fci-catalog': {
		dir: 'FCI Catalog',
		items: ['1', '2', '3', '4', '5', '6'].map((n) => ({ file: `FCI ${n}.png` }))
	},
	'sushi-and-sake': {
		dir: 'Sushi & Sake',
		items: [
			{ pdf: 'SME 1.pdf', name: 'sme-1' },
			// 4.pdf is the square event poster, left off the site.
			...['1', '2', '3', '4', '5', '6', '7', '8'].map((n) =>
				n === '4' ? { omit: `${n}.pdf` } : { pdf: `${n}.pdf` }
			)
		]
	},
	'maru-matcha': {
		dir: 'Maru Matcha',
		// MM 1–3 are the finished versions of Logo Drafting's page 3, so that
		// page makes way for them: MM 1 leads, MM 2 and 3 sit between the first
		// two directions and the mascot pages.
		items: [
			{ pdf: 'MM 1.pdf', name: 'mm-1' },
			{ pdf: 'Logo Drafting.pdf', pages: [1, 2] },
			{ pdf: 'MM 2.pdf', name: 'mm-2' },
			{ pdf: 'MM 3.pdf', name: 'mm-3' },
			{ pdf: 'Logo Drafting.pdf', pages: [4, 5, 6], name: '01' }
		]
	},
	kokodak: {
		dir: 'Kokodak',
		items: [{ file: 'Kokodak Animation.mp4', posterAt: 9 }, { pdf: 'Kokodak Branding.pdf' }]
	},
	ksa: {
		dir: 'KSA',
		items: [
			...numbered(5, { 1: 7, 2: 16, 3: 3, 4: 87, 5: 0 }),
			{ file: '6 - KSA.mp4', posterAt: 0 }
		]
	},
	'freelance-film': {
		dir: 'Freelance Film',
		items: [...numbered(7, { 1: 139, 2: 27, 3: 29, 4: 21 }), { file: '../FREELANCE.mp4' }]
	}
};

/** The source file, from the first source folder that has it — or null if none does. */
function find(dir: string, file: string) {
	for (const source of SOURCES) {
		for (const path of [join(source, dir, file), join(source, dir, 'done', file)]) {
			if (existsSync(path)) return path;
		}
	}
	return null;
}

type Media =
	| {
			kind: 'image';
			src: string;
			width: number;
			height: number;
			tone: string;
	  }
	| {
			kind: 'video';
			/** Path under the media origin (R2), not the site. */
			src: string;
			poster: string;
			width: number;
			height: number;
			tone: string;
			/** Seconds. */
			duration: number;
	  };

const VIDEO = /\.(mp4|mov|m4v)$/i;

async function probe(path: string) {
	const out =
		await $`ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of json ${path}`.json();
	return {
		width: Number(out.streams[0].width),
		height: Number(out.streams[0].height),
		duration: Number(out.format.duration)
	};
}

/**
 * Whether a file would play everywhere as-is: H.264 in 8-bit 4:2:0, no bigger
 * than the site ever shows, at most 30fps, with AAC audio or none.
 */
async function webReady(path: string) {
	if (!/\.(mp4|m4v)$/i.test(path)) return false;
	const { streams } =
		await $`ffprobe -v error -show_entries stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate -of json ${path}`.json();
	const video = streams.find((s: { codec_type: string }) => s.codec_type === 'video');
	const audio = streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
	const [num, den] = String(video?.avg_frame_rate ?? '0/1')
		.split('/')
		.map(Number);
	return (
		video?.codec_name === 'h264' &&
		video.pix_fmt === 'yuv420p' &&
		Math.max(video.width, video.height) <= VIDEO_EDGE &&
		num / (den || 1) <= 30.5 &&
		(!audio || audio.codec_name === 'aac')
	);
}

/** Average colour, painted behind the media until it loads. */
async function tone(path: string) {
	const buf =
		await $`ffmpeg -v error -i ${path} -vf scale=1:1 -frames:v 1 -f rawvideo -pix_fmt rgb24 -`
			.quiet()
			.arrayBuffer();
	const [r, g, b] = new Uint8Array(buf);
	return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Caps the long edge without upscaling; -2 keeps the other edge even for H.264. */
const fit = (edge: number) =>
	`scale='if(gte(iw,ih),min(${edge},iw),-2)':'if(gte(iw,ih),-2,min(${edge},ih))'`;

/**
 * A source that's needed because its output doesn't exist yet. Missing sources
 * are fine otherwise: once encoded, a file can come off the drive.
 */
function need(input: string | null, output: string): string {
	if (input) return input;
	throw new Error(`No source for ${output} in any of: ${SOURCES.join(', ')}`);
}

async function toWebp(input: string | null, output: string) {
	if (existsSync(output)) return;
	input = need(input, output);
	const tmp = mkdtempSync(join(tmpdir(), 'still-'));
	const png = join(tmp, 'still.png');
	await $`ffmpeg -v error -y -i ${input} -vf ${fit(STILL_EDGE)} -frames:v 1 ${png}`;
	await $`cwebp -quiet -q 82 -m 6 ${png} -o ${output}`;
	rmSync(tmp, { recursive: true });
}

async function still(input: string | null, slug: string, name: string): Promise<Media> {
	const output = join(STATIC_OUT, 'work', slug, `${name}.webp`);
	await toWebp(input, output);
	const { width, height } = await probe(output);
	return {
		kind: 'image',
		src: `/work/${slug}/${name}.webp`,
		width,
		height,
		tone: await tone(output)
	};
}

async function video(
	input: string | null,
	slug: string,
	name: string,
	posterAt?: number
): Promise<Media> {
	const output = join(VIDEO_OUT, 'work', slug, `${name}.mp4`);
	mkdirSync(join(VIDEO_OUT, 'work', slug), { recursive: true });

	if (!existsSync(output)) {
		input = need(input, output);
		console.log(`  encoding ${slug}/${name}.mp4`);
		const partial = `${output}.part.mp4`;
		// -fpsmax holds 60fps sources to 30 and leaves slower ones alone.
		await $`ffmpeg -v error -stats -y -i ${input} -vf ${fit(VIDEO_EDGE)} -fpsmax 30 -c:v libx264 -preset slow -crf 22 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 160k -ac 2 -movflags +faststart ${partial}`;

		// Some exports are already web-sized. Re-encoding those only makes them
		// bigger and a generation softer, so keep the original stream instead —
		// just moved into a fast-start MP4 so it plays before it's fully loaded.
		if ((await webReady(input)) && statSync(input).size <= statSync(partial).size) {
			console.log(`  keeping original for ${slug}/${name}.mp4`);
			await $`ffmpeg -v error -y -i ${input} -map 0:v:0 -map 0:a:0? -c copy -movflags +faststart ${partial}`;
		}
		await $`mv ${partial} ${output}`;
	}

	const { width, height, duration } = await probe(output);

	// A frame a little way in, so it isn't a fade from black.
	const poster = join(STATIC_OUT, 'work', slug, `${name}.webp`);
	if (!existsSync(poster)) {
		const tmp = mkdtempSync(join(tmpdir(), 'poster-'));
		const png = join(tmp, 'poster.png');
		const at = (posterAt ?? Math.min(2, duration * 0.15)).toFixed(2);
		await $`ffmpeg -v error -y -ss ${at} -i ${output} -frames:v 1 ${png}`;
		await $`cwebp -quiet -q 80 -m 6 ${png} -o ${poster}`;
		rmSync(tmp, { recursive: true });
	}

	return {
		kind: 'video',
		src: `/work/${slug}/${name}.mp4`,
		poster: `/work/${slug}/${name}.webp`,
		width,
		height,
		tone: await tone(poster),
		duration: Math.round(duration)
	};
}

/**
 * A PDF's pages as stills, named `<prefix>-<page>` (just `<prefix>` for a
 * one-page PDF). Pages are rendered one at a time and only if their output is
 * missing; with no source, the pages already in static/ are used.
 */
async function pdfPages(input: string | null, slug: string, prefix: string, only?: number[]) {
	const dir = join(STATIC_OUT, 'work', slug);
	let pages: { n: number; name: string }[];

	if (input) {
		const info = await $`pdfinfo ${input}`.quiet().text();
		const count = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
		pages = (only ?? Array.from({ length: count }, (_, i) => i + 1)).map((n) => ({
			n,
			name: count === 1 ? prefix : `${prefix}-${n}`
		}));
	} else if (existsSync(join(dir, `${prefix}.webp`))) {
		pages = [{ n: 1, name: prefix }];
	} else {
		pages = readdirSync(dir)
			.map((f) => Number(new RegExp(`^${prefix}-(\\d+)\\.webp$`).exec(f)?.[1]))
			.filter((n) => n && (!only || only.includes(n)))
			.sort((a, b) => a - b)
			.map((n) => ({ n, name: `${prefix}-${n}` }));
		if (!pages.length) need(null, join(dir, `${prefix}.webp`));
	}

	const out: Media[] = [];
	for (const { n, name } of pages) {
		let png: string | null = null;
		const tmp = mkdtempSync(join(tmpdir(), 'pdf-'));
		if (input && !existsSync(join(dir, `${name}.webp`))) {
			await $`pdftoppm -png -scale-to ${STILL_EDGE} -f ${n} -l ${n} -singlefile ${input} ${join(tmp, 'page')}`.quiet();
			png = join(tmp, 'page.png');
		}
		out.push(await still(png, slug, name));
		rmSync(tmp, { recursive: true });
	}
	return out;
}

const missing = SOURCES.filter((dir) => !existsSync(dir));
if (missing.length) {
	console.error(`Source folder not found: ${missing.join(', ')}`);
	process.exit(1);
}

const manifest: Record<string, Media[]> = {};

for (const [slug, { dir, items, draft }] of Object.entries(projects)) {
	if (draft) {
		console.log(`${slug} (draft, skipped)`);
		continue;
	}
	console.log(slug);
	mkdirSync(join(STATIC_OUT, 'work', slug), { recursive: true });
	const media: Media[] = [];

	let position = 0;
	for (const item of items) {
		const name = item.name ?? String(++position).padStart(2, '0');
		if ('omit' in item) continue;
		if ('pdf' in item) {
			media.push(...(await pdfPages(find(dir, item.pdf), slug, name, item.pages)));
		} else if (VIDEO.test(item.file)) {
			media.push(await video(find(dir, item.file), slug, name, item.posterAt));
		} else {
			media.push(await still(find(dir, item.file), slug, name));
		}
	}

	manifest[slug] = media;
}

mkdirSync(join(ROOT, 'src/lib/generated'), { recursive: true });
writeFileSync(
	MANIFEST,
	`// Generated by scripts/build-media.ts — do not edit by hand.

export type Media =
	| { kind: 'image'; src: string; width: number; height: number; tone: string }
	| {
			kind: 'video';
			/** Path under the media origin (R2), not the site. */
			src: string;
			poster: string;
			width: number;
			height: number;
			tone: string;
			/** Seconds. */
			duration: number;
	  };

export const media: Record<string, Media[]> = ${JSON.stringify(manifest, null, '\t')};
`
);

console.log(`\nWrote ${MANIFEST}`);
