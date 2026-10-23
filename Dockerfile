# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/.output ./.output

# Create data directory for SQLite, owned by the unprivileged `node` user (uid 1000)
RUN mkdir -p /data && chown node:node /data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/db.sqlite

# Run as non-root (security audit 2026-10-23). The sqlite volume must be owned by uid 1000.
USER node

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
