# Guia de Execução e Prints

Use este roteiro para testar a entrega e registrar evidências.

## 1. Instalar Dependências

```bash
npm install
```

Print: instalação concluída.

## 2. Criar `.env`

PowerShell:

```powershell
Copy-Item .env.example .env
```

Git Bash/Linux:

```bash
cp .env.example .env
```

Edite o `.env` para ambiente local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=maya_user
DB_PASSWORD=maya_pass
DB_NAME=maya_rpg
JWT_SECRET=test_jwt_secret_123456789
NODE_ENV=development
PORT=3000
```

Print: `.env.example` ou comando de cópia. Não exponha segredo real.

## 3. Validar Código

```bash
npm run lint
npm run build
npm test -- --runInBand
```

Prints:

- Lint sem erros.
- Build concluído.
- Testes com suites e testes passando.

## 4. Validar Docker Compose

```bash
docker compose config
```

Print: serviços `api` e `db`.

No PowerShell, para listar os arquivos Docker:

```powershell
dir Dockerfile, Dockerfile.db, docker-compose.yml
```

## 5. Subir Containers

```bash
docker compose build
docker compose up -d
docker compose ps
```

Print: `maya-rpg-api` e `maya-rpg-db` com status `Up` ou `healthy`.

## 6. Abrir Swagger

Navegador:

```text
http://localhost:3000/api/docs
```

Print: tela do Swagger.

## 7. Testar Scripts

Status:

```bash
./scripts/manage_services.sh status
```

Restart:

```bash
./scripts/manage_services.sh restart
```

Backup:

```bash
./scripts/backup_db.sh
```

Monitoramento:

```bash
./scripts/monitor_system.sh 5 15
```

Deploy:

```bash
./scripts/deploy.sh
```

Prints:

- Status dos containers.
- Restart com API respondendo em `/api/docs`.
- Arquivo em `backups/`.
- Arquivo em `logs/monitor/`.
- Deploy concluído.

## 8. Teste de Carga

Com a API rodando:

```bash
k6 run test/load/load-test.js
```

Print ideal:

- `http_req_duration` aprovado.
- `http_req_failed` aprovado.
- checks aprovados.
- Sem `thresholds ... have been crossed`.

Se o Windows disser que `k6` não existe, instale:

```powershell
winget install k6
```

Ou execute via Docker:

```powershell
docker run --rm -i -v "${PWD}:/scripts" grafana/k6 run -e API_URL=http://host.docker.internal:3000/api /scripts/test/load/load-test.js
```

## 9. Encerrar

Manter dados:

```bash
docker compose down
```

Remover também volume do banco:

```bash
docker compose down -v
```

Use `down -v` apenas depois dos prints, pois remove os dados locais do PostgreSQL.
