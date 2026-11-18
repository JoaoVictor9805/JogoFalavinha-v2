FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "npm install --no-audit --no-fund && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed && npm run dev"]
