#!/usr/bin/env bash
# monitor_system.sh - Coleta métricas do sistema (CPU, memória, espaço em disco) e gera logs
# Uso: ./monitor_system.sh [intervalo_segundos] [duracao_segundos]
# Exemplo: ./monitor_system.sh 5 60 (coleta a cada 5s por 60s)
# Cron: */5 * * * * /path/to/scripts/monitor_system.sh 5 30 >> /var/log/maya-rpg/monitor.log 2>&1

set -e

LOG_DIR="${MONITOR_LOG_DIR:-$(pwd)/logs/monitor}"
INTERVAL="${1:-5}"
DURATION="${2:-60}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/metrics_${TIMESTAMP}.log"

mkdir -p "$LOG_DIR"

echo "========================================" | tee -a "$LOG_FILE"
echo "Monitoramento Maya RPG - $(date)" | tee -a "$LOG_FILE"
echo "Intervalo: ${INTERVAL}s | Duração: ${DURATION}s" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

END_TIME=$(($(date +%s) + DURATION))

while [ $(date +%s) -lt $END_TIME ]; do
  NOW=$(date "+%Y-%m-%d %H:%M:%S")

  # CPU: usage percent via /proc/stat (Linux)
  if [ -f /proc/stat ]; then
    CPU_LINE1=$(head -n1 /proc/stat)
    sleep 1
    CPU_LINE2=$(head -n1 /proc/stat)
    IDLE1=$(echo "$CPU_LINE1" | awk '{print $5}')
    IDLE2=$(echo "$CPU_LINE2" | awk '{print $5}')
    TOTAL1=$(echo "$CPU_LINE1" | awk '{s=0; for(i=2;i<=NF;i++) s+=$i; print s}')
    TOTAL2=$(echo "$CPU_LINE2" | awk '{s=0; for(i=2;i<=NF;i++) s+=$i; print s}')
    DIFF_IDLE=$((IDLE2 - IDLE1))
    DIFF_TOTAL=$((TOTAL2 - TOTAL1))
    if [ $DIFF_TOTAL -gt 0 ]; then
      CPU_USAGE=$((100 * (DIFF_TOTAL - DIFF_IDLE) / DIFF_TOTAL))
    else
      CPU_USAGE=0
    fi
  else
    # Fallback for non-Linux or container environments
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'.' -f1 2>/dev/null || echo "N/A")
  fi

  # Memória
  if [ -f /proc/meminfo ]; then
    MEM_TOTAL_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    MEM_AVAIL_KB=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    if [ -n "$MEM_TOTAL_KB" ] && [ -n "$MEM_AVAIL_KB" ]; then
      MEM_USED_KB=$((MEM_TOTAL_KB - MEM_AVAIL_KB))
      MEM_PCT=$((100 * MEM_USED_KB / MEM_TOTAL_KB))
      MEM_TOTAL_MB=$((MEM_TOTAL_KB / 1024))
      MEM_USED_MB=$((MEM_USED_KB / 1024))
    else
      MEM_PCT="N/A"
      MEM_TOTAL_MB="N/A"
      MEM_USED_MB="N/A"
    fi
  else
    MEM_PCT="N/A"
    MEM_TOTAL_MB="N/A"
    MEM_USED_MB="N/A"
  fi

  # Disco
  DISK_USAGE=$(df -h "$(pwd)" 2>/dev/null | tail -n1 | awk '{print $5}' | tr -d '%')
  DISK_AVAIL=$(df -h "$(pwd)" 2>/dev/null | tail -n1 | awk '{print $4}')

  # Docker containers status (pipes)
  DOCKER_STATUS=$(docker ps --filter "name=maya-rpg" --format "{{.Names}}: {{.Status}}" 2>/dev/null | paste -sd ';' - || echo "Docker indisponível")

  # Output with pipe to tee
  echo "[$NOW] CPU=${CPU_USAGE}% | MEM=${MEM_USED_MB}/${MEM_TOTAL_MB}MB (${MEM_PCT}%) | DISK=${DISK_USAGE}% (livre: ${DISK_AVAIL}) | Containers: ${DOCKER_STATUS}" | tee -a "$LOG_FILE"

  sleep "$INTERVAL"
done

echo "========================================" | tee -a "$LOG_FILE"
echo "Monitoramento concluído em $(date)" | tee -a "$LOG_FILE"
echo "Log salvo em: $LOG_FILE" | tee -a "$LOG_FILE"

# Auto-set permissions (demonstra chmod)
chmod 644 "$LOG_FILE" 2>/dev/null || true

echo ""
echo "Dica: Para executar via cron a cada 5 minutos, adicione a linha:"
echo "  */5 * * * * ${BASH_SOURCE[0]} 5 30 >> ${LOG_DIR}/cron_monitor.log 2>&1"
echo "Use 'crontab -e' para editar a crontab do usuário."
