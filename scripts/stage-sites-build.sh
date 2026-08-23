#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$project_dir/.open-next"
output_dir="$project_dir/dist"

test -f "$source_dir/worker.js"
mkdir -p "$output_dir/server" "$output_dir/client"
find "$output_dir" -mindepth 1 -delete
mkdir -p "$output_dir/server" "$output_dir/client"
cp -R "$source_dir"/. "$output_dir/server"/
cp "$output_dir/server/worker.js" "$output_dir/server/index.js"
cp -R "$source_dir/assets"/. "$output_dir/client"/

test -f "$output_dir/server/index.js"
