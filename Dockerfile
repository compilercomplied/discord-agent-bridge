FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ------------------------------------------------------------------------------
FROM builder AS tester
COPY tests ./tests
CMD ["npm", "run", "test:integration"]

# ------------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]
