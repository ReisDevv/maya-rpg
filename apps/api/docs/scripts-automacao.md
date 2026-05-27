# Scripts de Automação Linux/Bash

O PDF pede scripts Shell/Bash para automatizar tarefas de ambiente, monitoramento, backup e gerenciamento de processos. O projeto entrega cinco scripts em `scripts/`.

## Pré-requisito

No Git Bash, Linux ou WSL:

```bash
chmod +x scripts/*.sh
```

No Windows com Git Bash, normalmente é possível executar com:

```bash
bash scripts/nome_do_script.sh
```

## `setup_env.sh`

Verifica dependências básicas:

- Docker.
- Docker Compose.
- Node.js 20+.
- npm.
- Presença do `.env`.
- Presença de `node_modules`.

Uso:

```bash
./scripts/setup_env.sh
```

## `monitor_system.sh`

Coleta métricas de sistema e grava logs:

- CPU.
- Memória.
- Disco.
- Status dos containers Docker.

Uso:

```bash
./scripts/monitor_system.sh 5 30
```

Esse exemplo coleta a cada 5 segundos por 30 segundos.

Saída esperada:

```text
logs/monitor/metrics_YYYYMMDD_HHMMSS.log
```

## `backup_db.sh`

Executa backup do banco PostgreSQL rodando no Docker Compose.

Uso:

```bash
./scripts/backup_db.sh
```

Saída esperada:

```text
backups/backup_YYYYMMDD_HHMMSS.sql
```

Variáveis:

```bash
BACKUP_RETENTION_DAYS=7
POSTGRES_USER=maya_user
POSTGRES_DB=maya_rpg
```

## `manage_services.sh`

Gerencia os containers do backend.

Comandos:

```bash
./scripts/manage_services.sh up
./scripts/manage_services.sh down
./scripts/manage_services.sh status
./scripts/manage_services.sh logs
./scripts/manage_services.sh restart
./scripts/manage_services.sh watch
```

O healthcheck usa:

```text
http://localhost:3000/api/docs
```

O modo `watch` monitora a API e tenta reiniciar automaticamente se houver falhas consecutivas.

## `deploy.sh`

Automatiza o deploy local/containerizado:

- Verifica Docker e Compose.
- Salva referência de imagens para rollback.
- Executa build.
- Executa backup pré-deploy.
- Aplica migrações SQL, se existirem.
- Sobe containers.
- Executa healthcheck.

Uso:

```bash
./scripts/deploy.sh
```

Rollback:

```bash
./scripts/deploy.sh --rollback
```

## Conceitos Linux/Bash Demonstrados

| Conceito pedido | Onde aparece |
|---|---|
| Variáveis de ambiente | `DEPLOY_ENV`, `API_URL`, `BACKUP_RETENTION_DAYS`, `HEALTH_TIMEOUT` |
| Condicionais | `if`, `case` nos scripts |
| Funções | `check_health`, `restart_with_healthcheck`, `save_current_images` |
| Pipes | `docker compose logs ... | tee`, `awk`, `grep`, `tail` |
| Redirecionamento | `>`, `>>`, `2>&1` |
| Logs | `logs/deploy.log`, `logs/monitor/*.log` |
| Permissões | `chmod +x scripts/*.sh` |
| Cron jobs | Exemplos abaixo |

## Exemplos de Cron

Backup diário:

```cron
0 2 * * * cd /path/to/maya-rpg-api && ./scripts/backup_db.sh >> /var/log/maya-rpg/backup.log 2>&1
```

Monitoramento a cada 5 minutos:

```cron
*/5 * * * * cd /path/to/maya-rpg-api && ./scripts/monitor_system.sh 5 30 >> /var/log/maya-rpg/monitor.log 2>&1
```
