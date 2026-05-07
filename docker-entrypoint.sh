#!/bin/sh
set -eu

mkdir -p "${DATA_DIR:-/app/data}/uploads"
./node_modules/.bin/tsx scripts/init-db.ts

exec "$@"
