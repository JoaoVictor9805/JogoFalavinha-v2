FROM node:20-alpine AS base

WORKDIR /app
ENV UV_THREADPOOL_SIZE=6

COPY package*.json ./

# Garante instalação das devDependencies (nodemon) mesmo se NODE_ENV=production chegar como build arg (ex.: Coolify).
RUN npm ci --include=dev

COPY . .

FROM base AS dev

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npm install --no-audit --no-fund && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run dev"]

FROM node:20-alpine AS prod

WORKDIR /app
ENV NODE_ENV=production
ENV UV_THREADPOOL_SIZE=6

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY src ./src

RUN ./node_modules/.bin/prisma generate && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node prisma/seed.js && exec node src/server.js"]