#!/usr/bin/env bash
# Uploads the encoded videos in ../portfolio-media to the R2 bucket, keyed by
# their path (work/<slug>/<n>.mp4) — the same path the site requests. Uploads
# every video, or just the ones named:
#
#   ./scripts/upload-media.sh work/ksa/06.mp4 work/kokodak/01.mp4
set -euo pipefail

BUCKET="${BUCKET:-portfolio-media}"
cd "$(dirname "$0")/../../portfolio-media"

if [ $# -gt 0 ]; then
	printf '%s\n' "$@"
else
	find work -name '*.mp4' ! -name '*.part.mp4' | sort
fi | while read -r file; do
	echo "→ $file"
	bunx wrangler r2 object put "$BUCKET/$file" --file "$file" \
		--content-type video/mp4 --cache-control 'public, max-age=604800' --remote
done
