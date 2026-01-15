FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/worker/package.json apps/worker/package.json

RUN npm ci

COPY apps/worker apps/worker

WORKDIR /app/apps/worker
RUN npm run build


FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json

CMD ["node", "dist/main.js"]