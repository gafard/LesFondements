#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$project_dir/.open-next"
output_dir="$project_dir/dist"
hosting_file="$project_dir/.openai/hosting.json"

test -f "$source_dir/worker.js"
test -f "$hosting_file"
mkdir -p "$output_dir/server" "$output_dir/client"
find "$output_dir" -mindepth 1 -delete
mkdir -p "$output_dir/server" "$output_dir/client" "$output_dir/.openai"
# Static assets are uploaded from dist/client. Keeping a second copy under the
# Worker bundle pushes larger offline-first builds over Cloudflare's Worker
# size limit without adding any runtime value. Use only utilities available in
# the remote Sites builder.
find "$source_dir" -mindepth 1 -maxdepth 1 ! -name assets \
  -exec cp -R {} "$output_dir/server"/ \;
cp "$project_dir/scripts/sites-worker-entry.mjs" "$output_dir/server/index.js"

# Les fichiers audio restent servis par la publication Cloudflare principale.
# On garde leurs manifestes pour que l'interface sache quelles pistes existent,
# mais on ne les duplique pas dans chaque archive Sites privée.
while IFS= read -r -d '' asset; do
  relative="${asset#"$source_dir/assets/"}"
  destination="$output_dir/client/$relative"
  mkdir -p "$(dirname "$destination")"
  cp "$asset" "$destination"
done < <(find "$source_dir/assets" -type f ! -path "$source_dir/assets/voix/*.mp3" ! -path "$source_dir/assets/demo-audio/*" ! -name .DS_Store -print0)
cp "$hosting_file" "$output_dir/.openai/hosting.json"

test -f "$output_dir/server/index.js"
test -f "$output_dir/.openai/hosting.json"
