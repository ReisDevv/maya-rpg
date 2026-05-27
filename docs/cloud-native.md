# Relatório Cloud Native e Containerização

## Objetivo

Containerizar a API REST Maya RPG e seu banco PostgreSQL para que o ambiente seja reproduzível, fácil de executar em demonstração local e preparado para deployment em nuvem.

## Arquivos Entregues

| Arquivo | Função |
|---|---|
| `Dockerfile` | Build multi-stage da API NestJS. |
| `Dockerfile.db` | Imagem do banco baseada em `postgres:16-alpine`. |
| `docker-compose.yml` | Orquestra API, banco, rede e volumes. |
| `.env.example` | Modelo de variáveis de ambiente. |
| `scripts/deploy.sh` | Deploy automatizado com build, backup, subida dos containers e healthcheck. |

## Backend em Container

O `Dockerfile` usa duas etapas:

1. `builder`: instala dependências e executa `npm run build`.
2. `runtime`: instala somente dependências de produção, copia `dist`, cria pastas de runtime e inicia com `npm run start:prod`.

Pontos relevantes:

- Node.js 20 Alpine.
- Usuário não-root (`appuser`).
- Porta `3000`.
- `curl` instalado para healthcheck.
- Pastas `/app/uploads` e `/app/logs` preparadas.

## Banco em Container

O `Dockerfile.db` usa `postgres:16-alpine` e define valores padrão:

```dockerfile
FROM postgres:16-alpine
ENV POSTGRES_DB=maya_rpg
ENV POSTGRES_USER=maya_user
ENV POSTGRES_PASSWORD=maya_pass
EXPOSE 5432
```

No `docker-compose.yml`, esses valores podem ser sobrescritos por variáveis do `.env`.

## Orquestração com Docker Compose

Serviços definidos:

- `db`: PostgreSQL com volume persistente `pg_data`.
- `api`: backend NestJS conectado ao banco pelo host interno `db`.

Recursos usados:

- Rede bridge `maya-network`.
- `depends_on` com `condition: service_healthy`.
- Healthcheck do banco com `pg_isready`.
- Healthcheck da API com `curl http://localhost:3000/api/docs`.
- Bind mounts para `uploads` e `logs`.

## Variáveis de Ambiente

As principais variáveis estão em `.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=maya_user
DB_PASSWORD=
DB_NAME=maya_rpg
JWT_SECRET=your_jwt_secret_here
CORS_ORIGINS=http://localhost:4200,http://localhost:3000
PORT=3000
NODE_ENV=development
```

Em container, o Compose define `DB_HOST=db`, pois a API acessa o banco pelo nome do serviço.

## Volumes e Persistência

| Volume/Pasta | Uso |
|---|---|
| `pg_data:/var/lib/postgresql/data` | Mantém os dados do PostgreSQL mesmo após reiniciar containers. |
| `./uploads:/app/uploads` | Mantém arquivos enviados pela API. |
| `./logs:/app/logs` | Mantém logs gerados no runtime. |
| `./backups` | Recebe dumps gerados por `backup_db.sh`. |

Sem volumes, dados gravados dentro de containers seriam perdidos ao recriar o ambiente.

## Ambiente Tradicional vs Containerizado

| Critério | Tradicional | Containerizado |
|---|---|---|
| Instalação | Node, PostgreSQL e ferramentas instalados manualmente na máquina | Imagens Docker definem o ambiente |
| Reprodutibilidade | Pode variar entre computadores | Mesmo Compose sobe o mesmo conjunto de serviços |
| Configuração | Dependente do sistema operacional local | Centralizada em `.env` e `docker-compose.yml` |
| Isolamento | Serviços compartilham a máquina diretamente | Serviços isolados por containers e rede Docker |
| Persistência | Diretórios locais ou banco instalado manualmente | Volumes explícitos |
| Deploy | Passos manuais | Automatizado por `scripts/deploy.sh` |

## Vantagens da Containerização

- Menos diferença entre computadores de integrantes do grupo.
- API e banco sobem com um único comando.
- Facilita demonstração e prints da entrega.
- Isola dependências do backend.
- Simplifica backup, restart e logs via Docker Compose.
- Prepara o projeto para ambientes de staging/cloud.

## Comandos de Demonstração

```bash
cp .env.example .env
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs api --tail=80
```

Swagger:

```text
http://localhost:3000/api/docs
```

Encerrar:

```bash
docker compose down
```

Encerrar removendo volume do banco:

```bash
docker compose down -v
```
