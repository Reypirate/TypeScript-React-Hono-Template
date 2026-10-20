FROM oven/bun:1.3.13-alpine AS bun

FROM node:22.23.3-alpine AS base

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

RUN npm install -g pnpm@10.33.3

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .
ENV NODE_ENV=production
RUN pnpm build

FROM oven/bun:1.3.13-alpine AS release

WORKDIR /app

COPY --from=build --chown=bun:bun /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=bun:bun /app/apps/web/dist ./apps/web/dist
COPY --chown=bun:bun package.json ./

USER bun
ENV NODE_ENV=production
ENV PORT=4001
ENV STATIC_ROOT=apps/web/dist

EXPOSE 4001/tcp

CMD ["bun", "apps/api/dist/index.js"]
