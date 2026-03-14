# ════════════════════════════════════════════════════════
# Stage 1 – Build the React / Vike frontend (SSR)
# ════════════════════════════════════════════════════════
FROM node:20-alpine AS web-builder

WORKDIR /app

# Copy manifests first so this layer is cached unless deps change
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/pocketbase/package.json ./apps/pocketbase/

RUN npm ci

# Copy source and build (Vike outputs to dist/client + dist/server)
COPY apps/web ./apps/web
RUN npm --prefix apps/web run build

# Prune dev dependencies for a smaller runtime image
RUN npm prune --omit=dev


# ════════════════════════════════════════════════════════
# Stage 2 – Runtime: nginx + Node SSR + PocketBase
# ════════════════════════════════════════════════════════
FROM node:20-alpine

ARG PB_VERSION=0.36.1

# Add supervisord, wget, unzip, jq, nginx (all small on Alpine)
RUN apk add --no-cache supervisor wget unzip ca-certificates jq nginx

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

# ── Copy built frontend (SSR: client + server bundles) ────────────────────────
COPY --from=web-builder /app/apps/web/dist      /app/web/dist
COPY --from=web-builder /app/apps/web/server    /app/web/server
COPY --from=web-builder /app/apps/web/package.json /app/web/package.json

# ── Copy production node_modules (express, vike, react, etc.) ─────────────────
COPY --from=web-builder /app/node_modules       /app/node_modules

# ── Copy runtime configs ─────────────────────────────────────────────────────
COPY deploy/nginx.conf            /etc/nginx/nginx.conf
COPY deploy/supervisord.conf      /etc/supervisord.conf
COPY deploy/generate-sitemap.sh   /usr/local/bin/generate-sitemap.sh
RUN  chmod +x /usr/local/bin/generate-sitemap.sh

# ── Persistent data volume (PocketBase stores db + uploads here) ─────────────
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 80

# Health check: hit nginx every 30s; give the container 10s to start up.
# wget is already available (installed via apk above).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

# supervisord manages both nginx and pocketbase
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisord.conf"]
