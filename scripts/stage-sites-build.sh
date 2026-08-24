#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$project_dir/.open-next"
output_dir="$project_dir/dist"

test -f "$source_dir/worker.js"
mkdir -p "$output_dir/server" "$output_dir/client"
find "$output_dir" -mindepth 1 -delete
mkdir -p "$output_dir/server" "$output_dir/client"
# Static assets are uploaded from dist/client. Keeping a second copy under the
# Worker bundle pushes larger offline-first builds over Cloudflare's Worker
# size limit without adding any runtime value.
rsync -a --exclude='/assets/' "$source_dir"/ "$output_dir/server"/
cp "$project_dir/scripts/sites-worker-entry.mjs" "$output_dir/server/index.js"
cp -R "$source_dir/assets"/. "$output_dir/client"/

test -f "$output_dir/server/index.js"
