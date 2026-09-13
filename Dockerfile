FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
ENV DATABASE_URL="postgresql://runtime:runtime@localhost:5432/atendeai?schema=public"
ENV DIRECT_URL="postgresql://migrator:migrator@localhost:5432/atendeai?schema=public"
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

FROM base AS migrator
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]
