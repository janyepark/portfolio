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
const SOURCE = resolve(process.argv[2] ?? '/Volumes/who dat/PORTFOLIO');
const VIDEO_OUT = resolve(ROOT, '../portfolio-media');
const STATIC_OUT = join(ROOT, 'static');
const MANIFEST = join(ROOT, 'src/lib/generated/media.ts');

/** Long edge, in px, for stills and PDF pages. */
const STILL_EDGE = 2400;
/** Long edge for video and its poster. */
const VIDEO_EDGE = 1920;

type Source =
	/** `posterAt` picks the poster frame, in seconds, when the default lands on a title card or black. */
	| { file: string; caption?: string; posterAt?: number }
	/** Every page of a PDF becomes its own still. */
	| { pdf: string; caption?: string };

/**
 * What to take from each project folder, in display order. The `-compressed`
 * duplicates are left out on purpose: re-encoding from the original looks
 * better than re-encoding an already-compressed copy.
 */
/**
 * `draft` projects are skipped entirely: anything written to static/ ships with
 * the site and is public at its URL, even if no page links to it. Remove the
 * flag (and `hidden` in site.ts) when the project is ready.
 */
const projects: Record<string, { dir: string; items: Source[]; draft?: boolean }> = {
	'curb-the-crisis': {
		dir: 'Curb The Crisis',
		items: [
			{ file: '2 min.mp4', caption: '2-minute documentary cut' },
			{ file: '30 sec.mp4', caption: '30-second social cut' },
			{ file: '6 sec.mp4', caption: '6-second animation' }
		]
	},
	'mjff-parkinsons-act': {
		dir: 'MJFF Pro Bono Video',
		items: [{ file: 'MJFF Case Study.mp4' }, { file: 'MJF-Shoot_Ted-2_110624.jpg' }]
	},
	'nc-safe': {
		dir: 'NC SAFE',
		items: ['1', '2', '3', '4', '5'].map((n) => ({ file: `${n}.mp4` }))
	},
	'vim-open-enrollment': {
		dir: 'VIM Ad Campaign',
		items: ['1', '2', '3', '4', '5'].map((n) => ({ file: `${n}.mp4` }))
	},
	'usda-cep': {
		dir: 'USDA',
		items: ['1', '2', '3'].map((n) => ({ file: `${n}.mp4` }))
	},
	'sofar-sounds': {
		dir: 'Sofar Sounds',
		items: [
			{ file: 'Parisalexa Performance.mp4', caption: 'Parisalexa — performance' },
			{ file: 'TeZA Talks Interview.mp4', caption: 'TeZA — interview' },
			{ file: 'toronto_performance_jordan_v02.mov', caption: 'Toronto — performance' },
			{ file: 'nashville_short_10s_v01.mov', caption: 'Nashville — 10-second social cut' }
		]
	},
	'red-bull-gives-you-slides': {
		dir: 'Red Bull Spec Shoot',
		items: [
			{ file: 'Red Bull Gives You Slides.mp4', posterAt: 18 },
			...['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => ({ file: `${n}.png` }))
		]
	},
	ramenya: {
		dir: 'Ramenya',
		items: [
			{ file: 'ramenya promo.mp4', caption: 'Kitchen BTS film' },
			...['1', '2', '3', '4', '5'].map((n) => ({ pdf: `${n}.pdf` }))
		]
	},
	'fci-catalog': {
		dir: 'FCI Catalog',
		items: ['1', '2', '3', '4', '5', '6'].map((n) => ({ file: `${n}.png` }))
	},
	'sushi-and-sake': {
		dir: 'Sushi & Sake',
		items: ['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => ({ pdf: `${n}.pdf` }))
	},
	'maru-matcha': {
		dir: 'Maru Matcha',
		items: [{ pdf: 'Logo Drafting.pdf' }]
	},
	kokodak: {
		dir: 'Kokodak INCOMPLETE DO LAST',
		draft: true,
		items: [{ file: '2.mp4', caption: 'In-kiosk motion loop' }, { pdf: 'test.pdf' }]
	},
	ksa: {
		dir: 'KSA',
		items: ['1', '2', '3', '4', '5'].map((n) => ({ file: `${n}.mp4` }))
	},
	'freelance-film': {
		dir: 'Freelance Film',
		items: [
			{ file: '1.mp4', posterAt: 20 },
			...['2', '3', '4', '5', '6', '7'].map((n) => ({ file: `${n}.mp4` }))
		]
	}
};

type Media =
	| {
			kind: 'image';
			src: string;
			width: number;
			height: number;
			tone: string;
			caption?: string;
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
			caption?: string;
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
	const [num, den] = String(video?.avg_frame_rate ?? '0/1').split('/').map(Number);
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
	const buf = await $`ffmpeg -v error -i ${path} -vf scale=1:1 -frames:v 1 -f rawvideo -pix_fmt rgb24 -`
		.quiet()
		.arrayBuffer();
	const [r, g, b] = new Uint8Array(buf);
	return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Caps the long edge without upscaling; -2 keeps the other edge even for H.264. */
const fit = (edge: number) =>
	`scale='if(gte(iw,ih),min(${edge},iw),-2)':'if(gte(iw,ih),-2,min(${edge},ih))'`;

async function toWebp(input: string, output: string) {
	if (existsSync(output)) return;
	const tmp = mkdtempSync(join(tmpdir(), 'still-'));
	const png = join(tmp, 'still.png');
	await $`ffmpeg -v error -y -i ${input} -vf ${fit(STILL_EDGE)} -frames:v 1 ${png}`;
	await $`cwebp -quiet -q 82 -m 6 ${png} -o ${output}`;
	rmSync(tmp, { recursive: true });
}

async function still(input: string, slug: string, name: string, caption?: string): Promise<Media> {
	const output = join(STATIC_OUT, 'work', slug, `${name}.webp`);
	await toWebp(input, output);
	const { width, height } = await probe(output);
	return {
		kind: 'image',
		src: `/work/${slug}/${name}.webp`,
		width,
		height,
		tone: await tone(output),
		...(caption && { caption })
	};
}

async function video(
	input: string,
	slug: string,
	name: string,
	caption?: string,
	posterAt?: number
): Promise<Media> {
	const output = join(VIDEO_OUT, 'work', slug, `${name}.mp4`);
	mkdirSync(join(VIDEO_OUT, 'work', slug), { recursive: true });

	if (!existsSync(output)) {
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
		duration: Math.round(duration),
		...(caption && { caption })
	};
}

async function pdfPages(input: string, slug: string, prefix: string, caption?: string) {
	const tmp = mkdtempSync(join(tmpdir(), 'pdf-'));
	await $`pdftoppm -png -scale-to ${STILL_EDGE} ${input} ${join(tmp, 'page')}`;
	const pages = readdirSync(tmp)
		.filter((f) => f.endsWith('.png'))
		.sort();

	const out: Media[] = [];
	for (const [i, page] of pages.entries()) {
		const name = pages.length === 1 ? prefix : `${prefix}-${i + 1}`;
		out.push(await still(join(tmp, page), slug, name, caption));
	}
	rmSync(tmp, { recursive: true });
	return out;
}

if (!existsSync(SOURCE)) {
	console.error(`Source folder not found: ${SOURCE}`);
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

	for (const [i, item] of items.entries()) {
		const name = String(i + 1).padStart(2, '0');
		if ('pdf' in item) {
			media.push(...(await pdfPages(join(SOURCE, dir, item.pdf), slug, name, item.caption)));
		} else if (VIDEO.test(item.file)) {
			media.push(await video(join(SOURCE, dir, item.file), slug, name, item.caption, item.posterAt));
		} else {
			media.push(await still(join(SOURCE, dir, item.file), slug, name, item.caption));
		}
	}

	manifest[slug] = media;
}

mkdirSync(join(ROOT, 'src/lib/generated'), { recursive: true });
writeFileSync(
	MANIFEST,
	`// Generated by scripts/build-media.ts — do not edit by hand.

export type Media =
	| { kind: 'image'; src: string; width: number; height: number; tone: string; caption?: string }
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
			caption?: string;
	  };

export const media: Record<string, Media[]> = ${JSON.stringify(manifest, null, '\t')};
`
);

console.log(`\nWrote ${MANIFEST}`);
