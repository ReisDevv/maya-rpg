#!/usr/bin/env bash
# manage_services.sh - Gerenciamento dos servicos via Docker Compose
# Uso: ./scripts/manage_services.sh [comando]
# Comandos interativos (sem argumento): menu interativo
# Comandos diretos: up, down, status, logs, restart, watch

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-60}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"
API_URL="${API_URL:-http://localhost:3000/api/docs}"

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

check_health() {
  local elapsed=0
  info "Aguardando API ficar saudavel (timeout: ${HEALTH_TIMEOUT}s)..."
  while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
    if curl -sf "${API_URL}" >/dev/null 2>&1; then
      ok "API esta respondendo em ${API_URL}"
      return 0
    fi
    sleep $HEALTH_INTERVAL
    elapsed=$((elapsed + HEALTH_INTERVAL))
    info "Aguardando... (${elapsed}s/${HEALTH_TIMEOUT}s)"
  done
  err "API nao respondeu dentro do timeout."
  return 1
}

restart_with_healthcheck() {
  warn "Reiniciando servicos..."
  docker compose restart
  if check_health; then
    ok "Servicos reiniciados com sucesso."
  else
    err "API nao voltou apos restart. Tentando full restart..."
    docker compose down
    docker compose up -d
    if check_health; then
      ok "Full restart bem-sucedido."
    else
      err "Falha critica. Intervencao manual necessaria."
      docker compose logs --tail=50 api
      return 1
    fi
  fi
}

cmd_up() {
  info "Iniciando servicos..."
  docker compose up -d
  check_health
}

cmd_down() {
  info "Parando servicos..."
  docker compose down
  ok "Servicos parados."
}

cmd_status() {
  info "Status dos containers:"
  docker ps --filter "name=maya-rpg"
}

cmd_logs() {
  info "Exibindo logs (Ctrl+C para sair)..."
  docker compose logs -f
}

cmd_restart() {
  restart_with_healthcheck
}

cmd_watch() {
  info "Monitorando saude da API (Ctrl+C para sair)..."
  local failures=0
  local max_failures=3
  while true; do
    if curl -sf "${API_URL}" >/dev/null 2>&1; then
      failures=0
    else
      failures=$((failures + 1))
      warn "API nao respondeu (falha ${failures}/${max_failures})"
      if [ $failures -ge $max_failures ]; then
        err "API falhou ${max_failures} vezes seguidas. Executando restart automatico..."
        restart_with_healthcheck
        failures=0
      fi
    fi
    sleep "${WATCH_INTERVAL:-10}"
  done
}

show_menu() {
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE} Gerenciador de Servicos Maya RPG ${NC}"
  echo -e "${BLUE}======================================${NC}"
  echo "1. Iniciar servicos (up)"
  echo "2. Parar servicos (down)"
  echo "3. Verificar status"
  echo "4. Ver logs dos containers"
  echo "5. Reiniciar servicos (com health check)"
  echo "6. Monitorar e restart automatico (watchdog)"
  echo "7. Sair"
  echo -e "${BLUE}--------------------------------------${NC}"
}

case "${1:-}" in
  up)      cmd_up ;;
  down)    cmd_down ;;
  status)  cmd_status ;;
  logs)    cmd_logs ;;
  restart) cmd_restart ;;
  watch)   cmd_watch ;;
  "")
    while true; do
      show_menu
      read -p "Escolha uma opcao [1-7]: " choice
      case $choice in
        1) cmd_up ;;
        2) cmd_down ;;
        3) cmd_status ;;
        4) cmd_logs ;;
        5) cmd_restart ;;
        6) cmd_watch ;;
        7) echo "Saindo..."; exit 0 ;;
        *) echo -e "\033[0;31mOpcao invalida!\033[0m" ;;
      esac
      echo ""
    done
    ;;
  *)
    echo "Uso: $0 [up|down|status|logs|restart|watch]"
    echo "  (sem argumento) - menu interativo"
    exit 1
    ;;
esac
