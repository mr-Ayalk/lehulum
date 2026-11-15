#!/usr/bin/env bash
# NFR-SUS-03, C-09: Stop the HTTPS tunnel and the Docker Compose stack.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .dev/tunnel.pid ]]; then
  pid="$(cat .dev/tunnel.pid)"
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
  fi
  rm -f .dev/tunnel.pid
fi

docker compose down
