FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app
COPY --from=builder /app ./

RUN addgroup -g 1001 -S nodejs && adduser -S standup -u 1001
USER standup

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
