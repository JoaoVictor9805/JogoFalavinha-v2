FROM node:20-alpine AS base

WORKDIR /app

FROM base AS dev
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npm install --no-audit --no-fund && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run dev"]

FROM base AS prod
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY prisma ./prisma
COPY src ./src
RUN ./node_modules/.bin/prisma generate && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node prisma/seed.js && exec node src/server.js"]
