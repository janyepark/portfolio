# portfolio

Jane Park's portfolio. SvelteKit + Tailwind, statically prerendered, running on Bun, hosted on
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
  project off the site, and mark it `draft` in the media script so none of its files land in
  `static/` — everything there is public, linked or not.
- **Media** comes from the raw project folders via `scripts/build-media.ts`:

  ```sh
  bun run build:media                     # searches /Volumes/MP Creative/JANE PORT, then /Volumes/who dat/PORTFOLIO
  bun run build:media /path/a /path/b     # or these folders, in this order
  ```

  It re-encodes video to ≤1080p H.264 in `../portfolio-media/work/<slug>/`, converts stills, PDF
  pages and video posters to WebP in `static/work/<slug>/`, and writes
  `src/lib/generated/media.ts`. Which files it takes from each folder, and in what order, is the
  `projects` table at the top of the script. Outputs that already exist are skipped (so a source
  can leave the drive once it's encoded); delete one to redo it. Outputs are numbered by
  position, so a file added between existing ones gets a `name` rather than renumbering them.
  Needs `brew install ffmpeg poppler webp`.

- Name, email, links and the placeholder bio: `src/lib/site.ts`, `src/routes/+page.svelte`,
  `src/routes/about/+page.svelte` (search for `TODO`).

## Deploy

Live at https://plainjane.work (and `www.`), an assets-only Cloudflare Worker on Jane's account.

**Site:** pushing to `main` deploys it. Cloudflare Workers Builds is connected to this repo and runs
`bun run build`, then `npx wrangler deploy`. To deploy by hand instead:

```sh
bun run build
bunx wrangler deploy
```

**Videos** are too large for the repo or for Workers static assets (25 MiB per file), so they live
in the R2 bucket `portfolio-media`, served from `media.plainjane.work`. The site points at it
through `mediaOrigin` in `src/lib/site.ts`. After `bun run build:media` produces new or changed
videos, upload them, then push the regenerated `src/lib/generated/media.ts`:

```sh
./scripts/upload-media.sh
```
