# INT-10: Add the WebVTT, Opus and module-script types Alpine's mime.types omits.
FROM nginx:alpine

RUN set -eu; \
    f=/etc/nginx/mime.types; \
    tmp=$(mktemp); \
    has() { grep -Eq "(^|[[:space:]])$1(;|[[:space:]])" "$f"; }; \
    lines=""; \
    has vtt || lines="${lines}    text/vtt                                        vtt;\n"; \
    has opus || lines="${lines}    audio/ogg                                       opus;\n"; \
    has mjs || lines="${lines}    application/javascript                          mjs;\n"; \
    if [ -n "$lines" ]; then \
      printf '%b' "$lines" > /tmp/mime-extra; \
      awk 'FNR==NR { extra = extra $0 ORS; next } /^}/ && !done { printf "%s", extra; done=1 } { print }' \
        /tmp/mime-extra "$f" > "$tmp"; \
      mv "$tmp" "$f"; \
    fi
