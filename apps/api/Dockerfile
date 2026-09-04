# Multi-stage Dockerfile for the Node.js + GraphQL API.
# Image is built by Render via the runtime: docker config in render.yaml.

# -------- Stage 1: install dependencies --------
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Copy only files needed for dependency resolution first to maximize caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared-data/package.json ./packages/shared-data/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter api... --filter @hvac-portfolio/shared-data...

# -------- Stage 2: build --------
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/shared-data ./packages/shared-data
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

RUN pnpm --filter api build

# -------- Stage 3: runtime --------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=10000

# Copy built JS + package.json + node_modules from build stage.
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
# shared-data is source-only (no build); copy directly.
COPY --from=build /app/packages/shared-data ./packages/shared-data
COPY --from=build /app/node_modules/@hvac-portfolio ./node_modules/@hvac-portfolio
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json

EXPOSE 10000

CMD ["node", "dist/server.js"]