# ════════════════════════════════════════════════════════
# Stage 1 – Build the React / Vite frontend
# ════════════════════════════════════════════════════════
FROM node:20-alpine AS web-builder

WORKDIR /app

# Copy manifests first so this layer is cached unless deps change
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/pocketbase/package.json ./apps/pocketbase/

RUN npm ci

# Copy source and build
COPY apps/web ./apps/web
RUN npm --prefix apps/web run build


# ════════════════════════════════════════════════════════
# Stage 2 – Runtime: nginx + PocketBase under supervisord
# ════════════════════════════════════════════════════════
FROM nginx:1-alpine

ARG PB_VERSION=0.36.1

# Add supervisord, wget, unzip (all small on Alpine)
RUN apk add --no-cache supervisor wget unzip ca-certificates

# ── Download the correct PocketBase binary for this machine's arch ──────────
# Coolify builds natively on the VPS (ARM64), so uname -m returns aarch64.
# Change PB_VERSION above to upgrade PocketBase.
RUN set -eux; \
    ARCH="$(uname -m)"; \
    case "$ARCH" in \
      x86_64)  PB_ARCH="amd64"  ;; \
      aarch64) PB_ARCH="arm64"  ;; \
      armv7l)  PB_ARCH="armv7"  ;; \
      *) echo "Unsupported CPU arch: $ARCH" >&2 && exit 1 ;; \
    esac; \
    wget -qO /tmp/pb.zip \
      "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" && \
    unzip -q /tmp/pb.zip -d /tmp/pb && \
    mkdir -p /app/pocketbase && \
    mv /tmp/pb/pocketbase /app/pocketbase/pocketbase && \
    chmod +x /app/pocketbase/pocketbase && \
    rm -rf /tmp/pb /tmp/pb.zip

# ── Copy PocketBase migrations and hooks ────────────────────────────────────
RUN mkdir -p /app/pocketbase/pb_migrations /app/pocketbase/pb_hooks
COPY apps/pocketbase/pb_migrations/ /app/pocketbase/pb_migrations/
COPY apps/pocketbase/pb_hooks/      /app/pocketbase/pb_hooks/

# ── Copy built frontend ──────────────────────────────────────────────────────
COPY --from=web-builder /app/dist/apps/web /usr/share/nginx/html

# ── Copy runtime configs ─────────────────────────────────────────────────────
COPY deploy/nginx.conf       /etc/nginx/nginx.conf
COPY deploy/supervisord.conf /etc/supervisord.conf

# ── Persistent data volume (PocketBase stores db + uploads here) ─────────────
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 80

# supervisord manages both nginx and pocketbase
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord.conf"]
