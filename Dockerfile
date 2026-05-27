# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads /app/logs && chown -R appuser:appgroup /app/uploads /app/logs

# instalar curl para healthchecks e utilitarios basicos
RUN apk add --no-cache curl

USER appuser

# Porta exposta pela aplicacao
EXPOSE 3000

# Comando padrao para iniciar a aplicacao em producao
CMD ["npm", "run", "start:prod"]
