#!/usr/bin/env bash
# backup_db.sh - Realiza backup do banco PostgreSQL rodando em Docker
# Uso: ./scripts/backup_db.sh
# Variaveis de ambiente:
#   BACKUP_RETENTION_DAYS - Dias de retencao (default: 7)
#   POSTGRES_USER - Usuario do banco (default: maya_user)
#   POSTGRES_DB - Nome do banco (default: maya_rpg)

set -e

# Diretorio de backup (cria se nao existir)
BACKUP_DIR="$(pwd)/backups"
mkdir -p "$BACKUP_DIR"

# Retencao: remover backups mais antigos que N dias
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Nome do arquivo de dump com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"

# Variaveis de ambiente usadas no docker-compose (ajuste se necessario)
POSTGRES_USER=${POSTGRES_USER:-maya_user}
POSTGRES_DB=${POSTGRES_DB:-maya_rpg}

# Executa pg_dump usando docker compose (mais robusto)
# Usa -T para desabilitar alocacao de tty e redireciona a saida para arquivo local
if docker compose ps db >/dev/null 2>&1; then
  docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$DUMP_FILE"
else
  echo "[ERROR] Serviço 'db' não encontrado via 'docker compose'. Certifique-se de estar no diretório do projeto e que os serviços estão em execução."
  exit 1
fi

if [ $? -eq 0 ]; then
  echo "[OK] Backup concluido: $DUMP_FILE"

  # Remover backups antigos (mais de RETENTION_DAYS dias)
  DELETED=$(find "$BACKUP_DIR" -name "backup_*.sql" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
  if [ "$DELETED" -gt 0 ]; then
    echo "[INFO] Removidos $DELETED backup(s) mais antigos que $RETENTION_DAYS dia(s)."
  fi
else
  echo "[ERROR] Falha ao realizar o backup."
  rm -f "$DUMP_FILE"
  exit 1
fi
