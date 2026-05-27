# Mapeamento dos Requisitos da Entrega 2

Este documento cruza os requisitos do PDF do Projeto Interdisciplinar com os arquivos existentes neste backend.

## Escopo deste Repositório

Este repositório cobre:

- Backend/API REST.
- Banco PostgreSQL.
- Containerização com Docker e Docker Compose.
- Scripts Shell/Bash de automação.
- Testes unitários, integração/e2e e carga.
- Documentação de execução e relatório técnico.

O app mobile, módulo web, UX/protótipo e banner não fazem parte deste repositório backend.

## Cloud Native: Infraestrutura e Automação Linux

| Requisito do PDF | Onde está no projeto | Status |
|---|---|---|
| Mínimo 3 scripts funcionais e documentados | `scripts/setup_env.sh`, `scripts/monitor_system.sh`, `scripts/backup_db.sh`, `scripts/manage_services.sh`, `scripts/deploy.sh` | Atendido |
| Script de setup do ambiente | `scripts/setup_env.sh` | Atendido |
| Script de monitoramento com CPU, memória, disco e logs | `scripts/monitor_system.sh` | Atendido |
| Script de backup de banco/código de desenvolvimento | `scripts/backup_db.sh` faz dump do PostgreSQL em container | Atendido para banco |
| Gerenciamento de processos: iniciar, parar, status, restart automático | `scripts/manage_services.sh` | Atendido |
| Demonstrar pipes, redirecionamento, variáveis, cron, permissões | `scripts/*.sh` e [scripts-automacao.md](scripts-automacao.md) | Atendido |
| README explicando uso dos scripts | [scripts-automacao.md](scripts-automacao.md) | Atendido |

## Containerização e Deploy Cloud Native

| Requisito do PDF | Onde está no projeto | Status |
|---|---|---|
| Dockerfile para backend da API | `Dockerfile` | Atendido |
| Dockerfile para banco PostgreSQL/MySQL | `Dockerfile.db` | Atendido |
| `docker-compose.yml` com API + BD + volume persistente | `docker-compose.yml` | Atendido |
| Variáveis de ambiente para URLs, credenciais e portas | `.env.example` e `docker-compose.yml` | Atendido |
| Script de deploy automatizado usando Docker | `scripts/deploy.sh` | Atendido |
| Documentação de build e execução | [guia-testes-e-prints.md](guia-testes-e-prints.md) e [cloud-native.md](cloud-native.md) | Atendido |
| Demonstração do sistema rodando em containers | `docker compose up --build -d`, `docker compose ps` | Atendido |
| Relatório de vantagens, tradicional vs containerizado, volumes/persistência | [cloud-native.md](cloud-native.md) | Atendido |

## Testes e Qualidade de Software

| Requisito do PDF | Onde está no projeto | Status |
|---|---|---|
| 4 testes unitários | `src/**/*.spec.ts` | Atendido |
| 2 testes de integração | `test/*.e2e-spec.ts` | Atendido |
| Relatório de teste de carga | [qualidade-testes.md](qualidade-testes.md) e `test/load/load-test.js` | Atendido |
| Teste de sistema/aceitação | `test/acceptance.e2e-spec.ts` | Atendido |
| Atributos de qualidade ISO/IEC 25010 | [qualidade-testes.md](qualidade-testes.md) | Atendido |

## Requisitos Funcionais Backend Relacionados ao PDF

| Necessidade do PDF | Implementação no backend |
|---|---|
| Autenticação, login e recuperação de senha | `src/auth` |
| Gestão de pacientes | `src/patients` |
| Prontuário eletrônico | `src/medical-records` |
| Banco de exercícios | `src/exercises` |
| Prescrição de exercícios por paciente | `src/prescriptions` |
| Check-in e histórico de execução | `src/check-ins` e `src/exercise-executions` |
| Indicadores simples de acompanhamento | `src/dashboard` |
| Usuários e permissões Admin/Profissional/Paciente | `src/users`, guards em `src/auth/guards` |
| LGPD: aceite, exportação e anonimização | `src/common/lgpd` |
| Upload de mídias | `src/upload` |
| Notificações | `src/notifications` |
