#!/usr/bin/env bash
# Uploads every encoded video in ../portfolio-media to the R2 bucket, keyed by
# its path (work/<slug>/<n>.mp4) — the same path the site requests.
set -euo pipefail

BUCKET="${BUCKET:-portfolio-media}"
cd "$(dirname "$0")/../../portfolio-media"

find work -name '*.mp4' ! -name '*.part.mp4' | sort | while read -r file; do
	echo "→ $file"
	bunx wrangler r2 object put "$BUCKET/$file" --file "$file" \
		--content-type video/mp4 --cache-control 'public, max-age=604800' --remote
done
