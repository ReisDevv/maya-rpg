# Maya RPG — Monorepo

Monorepo contendo os três projetos da plataforma Maya RPG.

## Estrutura

```
apps/
  api/     — Backend NestJS (REST API + PostgreSQL)
  web/     — Frontend React + Vite (painel web)
  mobile/  — App Android Kotlin (app mobile)
```

## Projetos

| Projeto | Tecnologia | Como rodar |
|---------|-----------|------------|
| `apps/api` | NestJS + TypeORM + PostgreSQL | `cd apps/api && npm install && npm run start:dev` |
| `apps/web` | React 19 + Vite + TailwindCSS | `cd apps/web && npm install && npm run dev` |
| `apps/mobile` | Android Kotlin + Gradle | Abrir `apps/mobile` no Android Studio |
