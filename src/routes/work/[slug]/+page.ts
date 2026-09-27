import { error } from '@sveltejs/kit';
import { projects } from '$lib/site';
import type { EntryGenerator, PageLoad } from './$types';

// Hidden projects aren't in `projects`, so they're never prerendered.
export const entries: EntryGenerator = () => projects.map(({ slug }) => ({ slug }));

export const load: PageLoad = ({ params }) => {
	const index = projects.findIndex((project) => project.slug === params.slug);
	if (index === -1) error(404, 'Not found');
	return {
		project: projects[index],
		next: projects[(index + 1) % projects.length]
	};
};
