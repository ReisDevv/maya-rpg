#!/usr/bin/env bash
# deploy.sh - Deploy automatizado da API Maya RPG usando Docker
# Uso: ./deploy.sh [--rollback]
# Variáveis de ambiente:
#   DEPLOY_ENV    - Ambiente (staging|production), default: staging
#   DOCKER_BUILDKIT - Habilita BuildKit, default: 1
#   DEPLOY_TIMEOUT  - Timeout em segundos para health check, default: 60

set -euo pipefail

DEPLOY_ENV="${DEPLOY_ENV:-staging}"
DEPLOY_TIMEOUT="${DEPLOY_TIMEOUT:-60}"
ROLLBACK=false

if [[ "${1:-}" == "--rollback" ]]; then
  ROLLBACK=true
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

BACKUP_TAG="pre-deploy-$(date +%Y%m%d_%H%M%S)"

save_current_images() {
  info "Salvando imagens atuais para rollback..."
  docker compose images --format json 2>/dev/null | while read -r line; do
    local name=$(echo "$line" | awk -F'"' '{for(i=1;i<=NF;i++) if($(i-1)=="name") print $i}')
    local tag=$(echo "$line" | awk -F'"' '{for(i=1;i<=NF;i++) if($(i-1)=="tag") print $i}')
    if [ -n "$name" ] && [ -n "$tag" ]; then
      docker tag "${name}:${tag}" "${name}:${BACKUP_TAG}" 2>/dev/null || true
    fi
  done
  log "Imagens de rollback salvas com tag: ${BACKUP_TAG}"
}

rollback() {
  err "Iniciando rollback para versão anterior..."
  docker compose down 2>/dev/null || true
  docker compose up -d 2>/dev/null || {
    err "Falha no rollback. Intervenção manual necessária."
    exit 1
  }
  err "Rollback executado. Verifique o estado dos containers."
  exit 1
}

if [ "$ROLLBACK" = true ]; then
  log "Modo rollback solicitado."
  rollback
fi

log "Iniciando deploy Maya RPG API [${DEPLOY_ENV}]..."

# 1. Verificar dependências
command -v docker >/dev/null 2>&1 || { err "Docker não encontrado."; exit 1; }
docker compose version >/dev/null 2>&1 || { err "Docker Compose não encontrado."; exit 1; }

# 2. Salvar estado atual para rollback
save_current_images

# 3. Build das imagens
log "Construindo imagens Docker (BuildKit=${DOCKER_BUILDKIT:-1})..."
DOCKER_BUILDKIT=${DOCKER_BUILDKIT:-1} docker compose build --no-cache 2>&1 | tee "${PROJECT_DIR}/logs/build_$(date +%Y%m%d_%H%M%S).log"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  err "Falha no build das imagens."
  rollback
fi

# 4. Backup do banco antes do deploy
log "Executando backup pré-deploy..."
bash "${SCRIPT_DIR}/backup_db.sh" 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log" || warn "Backup falhou (continuando deploy)..."

# 5. Parar containers existentes
log "Parando containers atuais..."
docker compose down --timeout 30 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log"

# 6. Aplicar migrações pendentes
log "Verificando migrações pendentes..."
MIGRATION_DIR="${SCRIPT_DIR}/migrations"
if [ -d "$MIGRATION_DIR" ] && [ -n "$(ls -A "$MIGRATION_DIR"/*.sql 2>/dev/null)" ]; then
  DB_CONTAINER=$(docker compose ps -q db 2>/dev/null || true)
  if [ -z "$DB_CONTAINER" ]; then
    info "Iniciando apenas o banco para aplicar migrações..."
    docker compose up -d db
    sleep 5
  fi
  for migration in "$MIGRATION_DIR"/*.sql; do
    info "Aplicando migração: $(basename "$migration")"
    docker compose exec -T db psql -U "${DB_USER:-maya_user}" -d "${DB_NAME:-maya_rpg}" -f /dev/stdin < "$migration" 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log" || warn "Migração $(basename "$migration") pode já ter sido aplicada."
  done
fi

# 7. Iniciar containers
log "Iniciando containers..."
docker compose up -d 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log"

# 8. Health check
log "Aguardando API ficar disponível (timeout: ${DEPLOY_TIMEOUT}s)..."
ELAPSED=0
API_URL="${API_URL:-http://localhost:3000/api/docs}"

while [ $ELAPSED -lt $DEPLOY_TIMEOUT ]; do
  if curl -sf "${API_URL}" >/dev/null 2>&1; then
    log "API está respondendo em ${API_URL}!"
    break
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  info "Aguardando... (${ELAPSED}s/${DEPLOY_TIMEOUT}s)"
done

if [ $ELAPSED -ge $DEPLOY_TIMEOUT ]; then
  err "API não respondeu dentro do timeout. Executando rollback..."
  docker compose logs --tail=50 api 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log"
  rollback
fi

# 9. Verificação final
log "Verificando status dos containers..."
docker compose ps 2>&1 | tee -a "${PROJECT_DIR}/logs/deploy.log"

log "Deploy concluído com sucesso! [${DEPLOY_ENV}]"
log "Swagger: ${API_URL}"
echo ""
echo "Para rollback: ./scripts/deploy.sh --rollback"
echo "Para logs: docker compose logs -f api"
echo "Para monitorar: ./scripts/monitor_system.sh 5 30"
