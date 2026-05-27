# Maya RPG API

Backend REST da solução Clínica Maya RPG, desenvolvido em NestJS, TypeScript e PostgreSQL.

Esta pasta contém a entrega de Backend, Cloud Native, automação Linux/Bash e qualidade/testes referente ao Projeto Interdisciplinar.

## Documentação da Entrega

- [Índice da documentação](docs/README.md)
- [Mapeamento dos requisitos do PDF](docs/requisitos-entrega-2.md)
- [Relatório Cloud Native e containerização](docs/cloud-native.md)
- [Scripts de automação Linux/Bash](docs/scripts-automacao.md)
- [Qualidade de software e testes](docs/qualidade-testes.md)
- [Guia de execução e prints](docs/guia-testes-e-prints.md)

## Execução Rápida

```bash
cp .env.example .env
docker compose up --build -d
```

Swagger:

```text
http://localhost:3000/api/docs
```
