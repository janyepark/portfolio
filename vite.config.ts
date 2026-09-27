import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, resolve } from 'node:path';

/**
 * In dev, serves the encoded videos in ../portfolio-media at /media, so the site
 * plays them without anything uploaded to R2. Honours Range requests, which
 * browsers need to seek in (and Safari to play at all).
 */
function localMedia(): Plugin {
	const root = resolve(import.meta.dirname, '../portfolio-media');
	return {
		name: 'local-media',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/media', (req, res, next) => {
				const path = normalize(join(root, decodeURIComponent((req.url ?? '/').split('?')[0])));
				if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) return next();

				const size = statSync(path).size;
				res.setHeader('Content-Type', 'video/mp4');
				res.setHeader('Accept-Ranges', 'bytes');

				const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
				if (!range) {
					res.setHeader('Content-Length', size);
					return createReadStream(path).pipe(res);
				}

				const start = range[1] ? Number(range[1]) : size - Number(range[2]);
				const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
				res.statusCode = 206;
				res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
				res.setHeader('Content-Length', end - start + 1);
				createReadStream(path, { start, end }).pipe(res);
			});
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		localMedia(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
