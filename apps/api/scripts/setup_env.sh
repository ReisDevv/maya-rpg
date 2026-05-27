#!/usr/bin/env bash
# setup_env.sh - Verifica dependencias necessarias para desenvolvimento da API Maya RPG
# Uso: ./scripts/setup_env.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

REQUIRED_NODE=20

# --- Docker ---
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker nao esta instalado. Instale antes de prosseguir."
else
  ok "Docker encontrado: $(docker --version)"
fi

# --- Docker Compose (v2 ou standalone) ---
if docker compose version >/dev/null 2>&1; then
  ok "Docker Compose (v2) encontrado: $(docker compose version --short)"
elif command -v docker-compose >/dev/null 2>&1; then
  ok "Docker Compose encontrado: $(docker-compose --version)"
else
  fail "Docker Compose nao esta instalado. Instale antes de prosseguir."
fi

# --- Node.js ---
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js nao esta instalado. Instale o Node.js $REQUIRED_NODE+ (https://nodejs.org)."
else
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -ge "$REQUIRED_NODE" ]; then
    ok "Node.js encontrado: $(node -v) (requerido >= $REQUIRED_NODE)"
  else
    fail "Node.js $(node -v) encontrado, mas versao $REQUIRED_NODE+ e requerida."
  fi
fi

# --- npm ---
if ! command -v npm >/dev/null 2>&1; then
  fail "npm nao esta instalado. Instale junto com o Node.js."
else
  ok "npm encontrado: $(npm -v)"
fi

# --- .env ---
ENV_FILE="$(dirname "$0")/../.env"
if [ ! -f "$ENV_FILE" ]; then
  warn "Arquivo .env nao encontrado. Copie .env.example para .env e ajuste os valores."
  echo "  cp .env.example .env"
else
  ok "Arquivo .env encontrado."
fi

# --- Dependencias do projeto ---
PROJECT_DIR="$(dirname "$0")/.."
if [ -f "$PROJECT_DIR/package.json" ] && [ ! -d "$PROJECT_DIR/node_modules" ]; then
  warn "node_modules nao encontrado. Execute: npm install"
else
  ok "Dependencias instaladas (node_modules/)."
fi

echo ""
echo "Ambiente configurado corretamente."
echo "Para iniciar: docker compose up -d && npm run start:dev"
