# portfolio

Janye Park's portfolio. SvelteKit + Tailwind, statically prerendered, running on Bun, hosted on
Cloudflare: the site on Workers static assets, the videos in R2.

## Develop

```sh
bun install
bun run dev --open
```

In dev, videos are served from `../portfolio-media` (see `localMedia` in `vite.config.ts`), so
nothing has to be uploaded to preview.

## Content

- **Project text** — title, client, role, description, tools — lives in `src/lib/site.ts`, in
  display order. The first six are "Selected work" on the homepage. Set `hidden: true` to keep a
  project off the site. Kokodak is hidden for now, and also marked `draft` in the media script so
  none of its files land in `static/` — everything there is public, linked or not.
- **Media** comes from the raw project folders via `scripts/build-media.ts`:

  ```sh
  bun run build:media                     # defaults to /Volumes/who dat/PORTFOLIO
  bun run build:media /path/to/PORTFOLIO
  ```

  It re-encodes video to ≤1080p H.264 in `../portfolio-media/work/<slug>/`, converts stills, PDF
  pages and video posters to WebP in `static/work/<slug>/`, and writes
  `src/lib/generated/media.ts`. Which files it takes from each folder, and in what order, is the
  `projects` table at the top of the script. Outputs that already exist are skipped. Needs
  `brew install ffmpeg poppler webp`.

- Name, email, links and the placeholder bio: `src/lib/site.ts`, `src/routes/+page.svelte`,
  `src/routes/about/+page.svelte` (search for `TODO`).

## Deploy

```sh
bun run build                                  # static site in ./build
bunx wrangler deploy                           # site → Workers static assets
./scripts/upload-media.sh                      # videos → R2 (only when they change)
```

Videos are too large for the repo or for Workers static assets (25 MiB per file), so they live in
an R2 bucket, `portfolio-media`, exposed on the custom domain `media.janyepark.com`. The site
points at it through `mediaOrigin` in `src/lib/site.ts`.
