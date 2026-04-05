# ── builder ──────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace manifests and lock file first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/workspace-contract/package.json packages/workspace-contract/
COPY apps/api/package.json apps/api/
COPY tsconfig.base.json ./

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

# Type-check
RUN pnpm --filter @bolt-everything/api typecheck

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy only production deps
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/contracts/package.json packages/contracts/
COPY --from=builder /app/packages/workspace-contract/package.json packages/workspace-contract/
COPY --from=builder /app/apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod

# Copy compiled sources (tsx runs TypeScript directly via esbuild)
COPY --from=builder /app/packages/ packages/
COPY --from=builder /app/apps/api/ apps/api/
COPY --from=builder /app/tsconfig.base.json ./

# Non-root user
RUN addgroup -S bolt && adduser -S bolt -G bolt
USER bolt

EXPOSE 3000

# Startup: run pending migrations then start the server.
CMD ["node", "--import", "tsx/esm", "apps/api/src/index.ts"]
