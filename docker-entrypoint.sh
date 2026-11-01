#!/bin/sh
set -eu

mkdir -p "${DATA_DIR:-/app/data}/uploads"
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "${DATA_DIR:-/app/data}" /app/.next/cache
  exec su-exec node "$0" "$@"
fi
node scripts/init-db.mjs

exec "$@"
