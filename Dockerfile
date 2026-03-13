# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install backend deps (including devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Install frontend deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source
COPY . .

# Build frontend then compile TypeScript backend
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Production backend deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Compiled backend
COPY --from=builder /app/dist ./dist

# Built React frontend
COPY --from=builder /app/frontend/build ./frontend/build

RUN addgroup -g 1001 -S nodejs && adduser -S standup -u 1001
USER standup

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
