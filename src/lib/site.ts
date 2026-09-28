// Everything that makes this site "yours" lives here. Edit this file, not the components.

import { dev } from '$app/environment';
import { media as allMedia, type Media } from '$lib/generated/media';

export type { Media };

export const site = {
	name: 'Jane Park',
	title: 'Jane Park',
	tagline: 'Film, motion & graphic design',
	description:
		'Portfolio of Jane Park — editor, motion designer and graphic designer working across film, campaigns and brand identity.',
	url: 'https://plainjane.work',
	email: 'jparkk215@gmail.com'
};

/**
 * The sidebar's opening sentence. `muted` parts render grey, like the names in
 * it; an `href` makes a part a link to that site. TODO: check the
 * current/previous employers — inferred from project years — and add District
 * 5's site once known.
 */
export const intro: { text: string; muted?: boolean; href?: string }[] = [
	{ text: site.name, muted: true },
	{
		text: ' is an editor, motion designer and graphic designer working across film, campaigns and brand identity. Currently at '
	},
	{ text: 'TBK Holding', muted: true, href: 'https://www.tbkholding.com/' },
	{ text: '. Previously at ' },
	{ text: 'Reingold', muted: true, href: 'https://www.reingold.com/' },
	{ text: ' & ' },
	{ text: 'District 5', muted: true },
	{ text: '.' }
];

/**
 * Where videos are served from. They live in R2, not in the site — see the
 * README. In dev, vite.config.ts serves ../portfolio-media at /media instead,
 * so nothing has to be uploaded to preview locally.
 */
export const mediaOrigin = dev ? '/media' : 'https://media.plainjane.work';

/** Absolute URL for a video's `src`. */
export const videoUrl = (item: Extract<Media, { kind: 'video' }>) => mediaOrigin + item.src;

// Outbound links only — these render with rel="external".
export const links = [
	// TODO: add LinkedIn, Instagram, Vimeo, etc.
	{ href: `mailto:${site.email}`, label: 'Email' }
];

export const disciplines = ['Film', 'Motion Design', 'Graphic Design', 'Photography'] as const;
export type Discipline = (typeof disciplines)[number];

export type Project = {
	slug: string;
	title: string;
	/** Sidebar name — usually the client, short enough for one line. */
	label: string;
	/** Grey mono text after the label in the sidebar. */
	subtitle: string;
	discipline: Discipline[];
	/** Who the work was done through — an agency, employer, or "Freelance". */
	agency: string;
	client: string;
	year: string;
	role: string;
	description: string;
	tools: string[];
	/** Index into the project's media to use on cards. Defaults to the first. */
	cover?: number;
	/** Kept out of every listing and not prerendered. Flip off to publish. */
	hidden?: boolean;
};

/** In display order, in the sidebar and on the homepage. */
const projectList: Project[] = [
	{
		slug: 'mjff-parkinsons-act',
		title: "Passing the National Plan to End Parkinson's Act",
		label: 'Michael J. Fox Foundation',
		subtitle: 'Case Study',
		discipline: ['Film', 'Motion Design'],
		agency: 'Reingold',
		client: 'Michael J. Fox Foundation',
		year: '2024',
		role: '1st Editor, Motion Designer',
		description:
			"A documentary case study on the passage of the National Plan to End Parkinson's Act, combining interview footage with legislative graphics and data overlays to tell the story of the advocacy campaign's impact.",
		tools: ['Adobe After Effects', 'Adobe Premiere Pro'],
		// The video opens on a logo card; the shoot photo reads better as a tile.
		cover: 1
	},
	{
		slug: 'curb-the-crisis',
		title: 'Curb The Crisis — Recovery Stories',
		label: 'Curb The Crisis',
		subtitle: 'Recovery Stories',
		discipline: ['Film', 'Motion Design'],
		agency: 'Reingold',
		client: 'Curb The Crisis',
		year: '2024',
		role: 'Editor, Motion Designer',
		description:
			"Editing and motion design across three deliverables for Curb The Crisis's recovery stories — a 2-minute interview-style documentary cut, a 30-second social cut, and a 6-second abstract animation created under full creative freedom.",
		tools: ['Adobe Premiere Pro', 'Adobe After Effects']
	},
	{
		slug: 'nc-safe',
		title: 'NC S.A.F.E. Ad Campaign',
		label: 'NC Public Safety',
		subtitle: 'S.A.F.E. Campaign',
		discipline: ['Motion Design'],
		agency: 'Reingold',
		client: 'North Carolina Department of Public Safety',
		year: '2025',
		role: 'Motion Designer',
		description:
			'Motion design for NC S.A.F.E., a statewide safe firearm storage campaign — spanning typographic explainers, photo-based motion graphics, and a simulated text-message narrative format across social media.',
		tools: ['Adobe After Effects']
	},
	{
		slug: 'ramenya',
		title: 'RamenYa (PORA) Marketing Materials',
		label: 'RamenYa',
		subtitle: 'Rebrand Marketing',
		discipline: ['Graphic Design', 'Film'],
		agency: 'TBK Holding',
		client: 'RamenYa',
		year: '2026',
		role: 'Designer, Director, Producer, Editor',
		description:
			"Print and video marketing for RamenYa's rebrand — curated posters and large-format signage, a kitchen BTS film for in-restaurant and web use, and a menu redesign for parent brand PORA.",
		tools: ['Adobe Premiere Pro', 'Adobe Illustrator', 'Adobe Photoshop']
	},
	{
		slug: 'sofar-sounds',
		title: 'Sofar Sounds Artist Series',
		label: 'Sofar Sounds',
		subtitle: 'Artist Series',
		discipline: ['Film'],
		agency: 'District 5',
		client: 'Sofar Sounds (Costa Coffee, Destination Toronto, Visit Seattle, SoFun Tour)',
		year: '2023',
		role: 'Editor',
		description:
			"Editor across Sofar Sounds' artist series — performance videos, interviews, and short-form social cuts — spanning 15+ artists and collaborations including SoFun Tour, Costa Coffee, and Destination Seattle/Toronto.",
		tools: ['Adobe Premiere Pro']
	},
	{
		slug: 'fci-catalog',
		title: 'FCI Frozen Food Catalog',
		label: 'Foodie Craft',
		subtitle: 'Product Catalog',
		discipline: ['Graphic Design'],
		agency: 'TBK Holding',
		client: 'Foodie Craft International',
		year: '2026',
		role: 'Designer',
		description:
			"A 52-page product catalog designed end-to-end for Foodie Craft International's presence at IDDBA and internal sales meetings — built out a full section system from company overview through categorized menu pages, developed the typographic and layout language, and art-directed page composition throughout.",
		tools: ['Adobe InDesign', 'Adobe Photoshop', 'Adobe Lightroom']
	},
	{
		slug: 'vim-open-enrollment',
		title: 'VIM Open Enrollment Ad Campaign',
		label: 'Virginia Insurance',
		subtitle: 'Open Enrollment',
		discipline: ['Motion Design'],
		agency: 'Reingold',
		client: 'Virginia Insurance Marketplace',
		year: '2024',
		role: 'Motion Designer',
		description:
			"Motion design for Virginia's Insurance Marketplace's open enrollment campaign — character animation, typography, and icon-driven graphics for social, plus footage organization and motion graphic support on broadcast spots.",
		tools: ['Adobe After Effects']
	},
	{
		slug: 'red-bull-gives-you-slides',
		title: 'Red Bull Gives You Slides (Spec Shoot)',
		label: 'Red Bull',
		subtitle: 'Spec Shoot',
		discipline: ['Film', 'Photography'],
		agency: 'District 5',
		client: 'Self-initiated spec shoot',
		year: '2023',
		role: '2nd AC, BTS Photographer',
		description:
			"A spec commercial for Red Bull at Shenandoah Speedway, built around a single practical stunt: keeping a can balanced on a moving car's roof through full-speed drifts. Coordinated with the driver and rigging team to capture the effect safely across multiple takes and camera angles.",
		tools: ['Adobe Lightroom']
	},
	{
		slug: 'sushi-and-sake',
		title: 'Sushi and Sake Pairing Event Graphics',
		label: 'Sushi Maru',
		subtitle: 'Sake Pairing Event',
		discipline: ['Graphic Design'],
		agency: 'TBK Holding',
		client: 'Sushi Maru Express',
		year: '2026',
		role: 'Designer',
		description:
			'A full graphics suite for a sushi and sake pairing event — promotional posters, an Instagram menu grid, a sake lineup with tasting notes, and individual ticket-tier cards, designed for Sushi Maru Express.',
		tools: ['Adobe Illustrator', 'Adobe Photoshop']
	},
	{
		slug: 'usda-cep',
		title: 'USDA CEP Awareness Campaign',
		label: 'USDA',
		subtitle: 'CEP Campaign',
		discipline: ['Film'],
		agency: 'Reingold',
		client: 'U.S. Department of Agriculture',
		year: '2024',
		role: 'Editor',
		description:
			"Editing across short- and long-form videos for the USDA's Community Eligibility Provision (CEP) — supporting a public awareness campaign around free school meal access.",
		tools: ['Adobe Premiere Pro']
	},
	{
		slug: 'maru-matcha',
		title: 'Maru Matcha Logo Concepts',
		label: 'Maru Matcha',
		subtitle: 'Logo Concepts',
		discipline: ['Graphic Design'],
		agency: 'TBK Holding',
		client: 'Internal brand in development',
		year: '2026',
		role: 'Designer',
		description:
			'Logo concept exploration for Maru Matcha, a matcha brand in development — two directions tied to two different store formats under consideration: a refined, tea-house-inspired identity for an appointment-based traditional tea ceremony experience, and a playful mascot system for a casual, American-style matcha cafe.',
		tools: ['Procreate', 'Adobe Illustrator']
	},
	{
		slug: 'kokodak',
		title: 'Kokodak Brand Identity',
		label: 'Kokodak',
		subtitle: 'Brand Identity',
		discipline: ['Graphic Design', 'Motion Design'],
		agency: 'TBK Holding',
		client: 'Kokodak',
		year: '2026',
		role: 'Designer, Motion Designer',
		description:
			"Full brand identity system for Kokodak, a Korean fried chicken kiosk brand — including logo design and construction, packaging, signage, and apparel, plus a looping motion piece for in-kiosk display. Launched at the brand's first supermarket location, with additional locations planned.",
		tools: ['Adobe After Effects', 'Adobe Illustrator', 'Adobe Photoshop', 'Adobe Lightroom'],
		// The source folder is marked incomplete.
		hidden: true
	},
	{
		slug: 'ksa',
		title: 'KSA Event Promos & Recaps',
		label: 'UMD KSA',
		subtitle: 'Event Films',
		discipline: ['Film'],
		agency: 'University of Maryland',
		client: 'Korean Student Association (KSA)',
		year: '2021–2023',
		role: 'Director, Producer, Videographer, Editor',
		description:
			"Promo and recap videos for KEXPO and NIK, UMD Korean Student Association's flagship semi-annual events, plus a board introduction video — all directed, produced, and edited during a term as KSA's board Historian.",
		tools: ['Adobe Premiere Pro']
	},
	{
		slug: 'freelance-film',
		title: 'Freelance Film Work',
		label: 'Freelance',
		subtitle: 'Film Work',
		discipline: ['Film'],
		agency: 'Freelance',
		client: 'Various',
		year: '2020–2026',
		role: 'Director, Producer, Videographer, Editor (varies by project)',
		description:
			'A selection of freelance video work across formats and clients — including wedding films, ad reels, product promos, and personal projects — showcasing range in tone, pacing, and purpose across full-length, short-form, and commercial cuts.',
		tools: ['Adobe Premiere Pro', 'Adobe After Effects']
	}
];

export const projects = projectList.filter((project) => !project.hidden);

/** A project's media, from the generated manifest. */
export function mediaFor(project: Project): Media[] {
	return allMedia[project.slug] ?? [];
}

/** The still that represents a project on cards: an image, or a video's poster. */
export function coverFor(project: Project) {
	const items = mediaFor(project);
	const item = items[project.cover ?? 0] ?? items[0];
	if (!item) return null;
	return {
		src: item.kind === 'video' ? item.poster : item.src,
		width: item.width,
		height: item.height,
		tone: item.tone,
		isVideo: item.kind === 'video'
	};
}

/** An image as the lightbox shows it. */
export type Still = { src: string; width: number; height: number; alt: string; caption?: string };

/** "2:07" */
export function runtime(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = String(seconds % 60).padStart(2, '0');
	return `${m}:${s}`;
}
