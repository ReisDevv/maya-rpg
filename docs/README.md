# Documentação da Entrega 2

Documentação objetiva baseada no PDF do Projeto Interdisciplinar 3 ADS 2026, com foco na parte entregue por este repositório: Backend/API, Cloud Native, automação Linux/Bash e qualidade/testes.

## Arquivos

- [requisitos-entrega-2.md](requisitos-entrega-2.md): checklist que cruza o que o PDF pede com os arquivos do projeto.
- [cloud-native.md](cloud-native.md): relatório de containerização, Docker, Docker Compose, variáveis e persistência.
- [scripts-automacao.md](scripts-automacao.md): uso dos scripts Shell/Bash exigidos.
- [qualidade-testes.md](qualidade-testes.md): testes unitários, integração/e2e, carga e atributos ISO/IEC 25010.
- [guia-testes-e-prints.md](guia-testes-e-prints.md): passo a passo para rodar comandos e tirar prints.

## Comandos Principais

```bash
npm install
cp .env.example .env
npm run lint
npm run build
npm test -- --runInBand
docker compose up --build -d
```

No PowerShell, use:

```powershell
Copy-Item .env.example .env
```
