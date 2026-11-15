#!/usr/bin/env bash
# NFR-SUS-03, C-09: Start the stack, check the public URLs, and open an HTTPS tunnel.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p .dev

docker compose up --build -d

ready=0
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/health || true)"
  if [[ "$code" == "200" ]]; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "API health did not return 200 within 60s" >&2
  docker compose logs --tail=50 api
  docker compose logs --tail=50 web
  exit 1
fi

fail=0
failed_web=0
failed_api=0
check() {
  local path="$1"
  local headers code ctype
  headers="$(curl -sS -D - -o /dev/null "http://localhost:8080${path}" || true)"
  code="$(printf '%s\n' "$headers" | awk 'BEGIN{c=""} /^HTTP/{c=$2} END{print c}')"
  ctype="$(printf '%s\n' "$headers" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2; exit}')"
  if [[ "$code" == "200" ]]; then
    echo "OK ${code} ${ctype:-none} ${path}"
  else
    echo "FAIL ${code:-none} ${ctype:-none} ${path}"
    fail=1
    if [[ "$path" == /api/* ]]; then
      failed_api=1
    else
      failed_web=1
    fi
  fi
}

check /demo/index.html
check /demo/lesson-video.html
check /demo/lesson-text.html
check /demo/jobs.html
check /demo/sign-try.html
check /demo/blank.html
check /demo/tools/caption-timer.html
check /pages/concept-with-navigation.html
check /api/v1/health

if [[ "$fail" -ne 0 ]]; then
  if [[ "$failed_web" -eq 1 ]]; then
    docker compose logs --tail=50 web
  fi
  if [[ "$failed_api" -eq 1 ]]; then
    docker compose logs --tail=50 api
  fi
  exit 1
fi

url=""
if [[ -f .dev/tunnel.pid ]]; then
  pid="$(cat .dev/tunnel.pid)"
  if kill -0 "$pid" 2>/dev/null && [[ -s .dev/tunnel.url ]]; then
    url="$(cat .dev/tunnel.url)"
  fi
fi

if [[ -z "$url" ]]; then
  : > .dev/tunnel.log
  nohup cloudflared tunnel --url http://localhost:8080 >> .dev/tunnel.log 2>&1 &
  echo $! > .dev/tunnel.pid
  for _ in $(seq 1 30); do
    url="$(grep -oE 'https://[-a-zA-Z0-9]+\.trycloudflare\.com' .dev/tunnel.log | head -1 || true)"
    if [[ -n "$url" ]]; then
      break
    fi
    sleep 1
  done
  if [[ -z "$url" ]]; then
    echo "cloudflared did not print a tunnel URL within 30s" >&2
    cat .dev/tunnel.log >&2 || true
    exit 1
  fi
  printf '%s\n' "$url" > .dev/tunnel.url
fi

cat <<EOF
LE HULUM is running
Phone (HTTPS): ${url}/demo/index.html
               ${url}/demo/lesson-video.html
               ${url}/demo/lesson-text.html
               ${url}/demo/jobs.html
               ${url}/demo/sign-try.html
               ${url}/demo/blank.html
               ${url}/demo/tools/caption-timer.html
               ${url}/pages/concept-with-navigation.html
Laptop:        http://localhost:8080/demo/index.html
               http://localhost:8080/demo/lesson-video.html
               http://localhost:8080/demo/lesson-text.html
               http://localhost:8080/demo/jobs.html
               http://localhost:8080/demo/sign-try.html
               http://localhost:8080/demo/blank.html
               http://localhost:8080/demo/tools/caption-timer.html
               http://localhost:8080/pages/concept-with-navigation.html
API docs:      ${url}/api/docs  (and http://localhost:8080/api/docs)
EOF
