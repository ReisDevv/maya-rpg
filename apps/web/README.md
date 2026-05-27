# Maya RPG Web — Painel do Profissional

Sistema web para acompanhamento de pacientes de Reeducação Postural Global (RPG) da Clínica Maya Yoshiko Yamamoto.

## Projeto Interdisciplinar — FECAP 3º Semestre ADS 2026

### Stack

- **Frontend:** Angular 21 + TypeScript + Tailwind CSS 4
- **Arquitetura:** Angular feature-first (`features` + `shared` + services concretos)
- **Estilos:** SCSS + Tailwind, alinhado à identidade visual da clínica
- **Backend:** API REST NestJS (`maya-rpg-api`)
- **Banco de Dados:** PostgreSQL

### Pré-requisitos

- Node.js 22+
- npm 10+
- Angular CLI (`npm install -g @angular/cli`)

### Setup

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd maya-rpg-web

# 2. Instale as dependências
npm install

# 3. Rode o backend local em http://localhost:3000/api
# Consulte o README do repositório maya-rpg-api

# 4. Rode o servidor de desenvolvimento
ng serve

# 5. Acesse no navegador
# http://localhost:4200
```

Por padrão, `src/environments/environment.ts` usa `http://localhost:3000/api`.
O build de produção usa `src/environments/environment.prod.ts`, apontando para a API hospedada no Render.

### Extensões VS Code recomendadas

Ao abrir o projeto no VS Code, ele vai sugerir automaticamente as extensões. Aceite a instalação de todas:

- Angular Language Service
- Prettier
- ESLint
- GitLens
- EditorConfig
- Code Spell Checker (PT-BR)

### Estrutura de pastas

```
src/app/
├── core/                  # Tipos compartilhados e enums do domínio
│   ├── entities/          # Interfaces das entidades
│   ├── enums/             # Enumerações do domínio
│   └── interfaces/        # Tipos de request/response compartilhados
├── data/                  # Integração com API e sessão
│   ├── interceptors/      # HTTP interceptors (auth, error)
│   └── services/          # ApiService, AuthService e services por recurso
├── features/              # Módulos de funcionalidade (lazy-loaded)
│   ├── auth/              # Login, recuperação de senha
│   ├── dashboard/         # Painel de indicadores
│   ├── patients/          # CRUD de pacientes
│   ├── exercises/         # Banco de exercícios
│   ├── prescriptions/     # Prescrições por paciente
│   ├── medical-records/   # Prontuário eletrônico
│   ├── birthdays/         # Calendário de aniversariantes
│   └── users/             # Gestão de usuários (apenas ADMIN)
└── shared/                # Componentes e estilos reutilizáveis
    ├── components/        # UI components genéricos
    ├── layout/            # Sidebar, Header, MainLayout
    ├── styles/            # Design tokens, mixins SCSS
```

### Padrões do projeto

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **Branches:** `main` (produção), `develop` (integração), `feature/*` (funcionalidades)
- **Código:** componentes standalone, lazy routes e services concretos injetados diretamente

### Fluxo de Dados

O fluxo principal agora é simples:

```text
Componentes de feature -> services em data/services -> ApiService -> API REST
```

Não há mais `InjectionToken` ou interfaces de repository para recursos com uma única implementação. Isso reduz indireção sem remover a separação entre telas, tipos compartilhados e acesso HTTP.

### Dados Reais e Fallbacks

- Dados clínicos e operacionais principais vêm da API REST: pacientes, prontuários, exercícios, prescrições, execuções/check-ins, dashboard e usuários.
- Preferências de interface, como tema e informações locais de configuração, continuam em `localStorage`.
- Agenda/consultas não usam mais fallback silencioso em `localStorage`; se a API falhar, a tela mostra erro para evitar confundir dado local com dado persistido.
- Fontes externas do Google não são baixadas no build. O app usa uma pilha segura de fontes do sistema para manter `npm run build` funcionando offline/CI.

### Git Flow

```bash
# Criar branch develop
git checkout -b develop

# Criar feature branch
git checkout -b feature/nome-da-feature develop

# Ao finalizar, merge na develop
git checkout develop
git merge feature/nome-da-feature
```

### Cronograma (alinhado ao PI)

| Semanas | Entrega |
|---------|---------|
| 1-2     | Scaffold + Core + Design system |
| 3-4     | Auth + CRUD Pacientes |
| 5-6     | Banco de Exercícios + Prescrições |
| 7-8     | Prontuário + Dashboard |
| 9-10    | Integração com API + testes |
| 11-12   | Ajustes de UX + documentação |
| 13      | Entrega final + apresentação |

## Alinhamento com o Projeto Interdisciplinar

Este repositório representa o **Módulo Web — Profissional/Admin** da solução Clínica Maya RPG. O aplicativo Android/mobile do paciente e o backend/API são projetos separados.

### Cobertura do módulo web

| Requisito do PDF | Implementação no web | Status |
|---|---|---|
| Gestão de pacientes com CRUD, busca, filtros e status | `features/patients` + `PatientService` | Completo |
| Prontuário eletrônico com observações e histórico por paciente | `features/medical-records` + aba de prontuário em paciente | Completo |
| Banco de exercícios com título, descrição, tags e mídia | `features/exercises` + `MediaService` | Completo |
| Prescrição de exercícios por paciente com frequência e orientações | `features/prescriptions` + `PrescriptionService` | Completo |
| Painel de acompanhamento com indicadores simples | `features/dashboard` + `DashboardService` | Completo, depende da API |
| Gestão de usuários e permissões Admin/Profissional | `features/users`, `authGuard`, `roleGuard` | Completo, depende da API |
| LGPD/consentimento antes de prescrição | Bloqueio em detalhe do paciente e formulário de prescrição | Completo |
| Rotinas/planos organizados | Prescrição agrupa exercícios e parâmetros do plano | Parcial, sem entidade própria de rotina |
| Avaliação funcional | Campos clínicos no prontuário: dor, mobilidade, postura e plano terapêutico | Parcial, sem tela dedicada |
| Agenda/lembretes | `features/appointments` e lembrete via WhatsApp no paciente | Opcional/Extensão |

### Contratos REST integrados

Além dos endpoints já consumidos por autenticação, pacientes, exercícios, prescrições, prontuários e dashboard, o web usa estes contratos alinhados com a API:

| Recurso | Endpoint | Uso no web |
|---------|----------|------------|
| Execuções/check-ins | `GET /exercise-executions/patient/:patientId?page=1&pageSize=20` | Histórico de exercícios executados, dor e observações na aba Evolução do paciente. |
| Desativar prescrição | `PATCH /prescriptions/:id/deactivate` | Encerrar plano ativo para que o paciente não veja mais no app. |
| Listar usuários | `GET /users?page=1&pageSize=50` | Gestão administrativa de profissionais e admins. |
| Status de usuário | `PATCH /users/:id/status` | Ativar/inativar usuário staff. |
| Consultas/agenda (opcional) | `GET /appointments?startDate=&endDate=` | Exibição complementar no dashboard e calendário quando a API disponibiliza agenda. |
| Criar consulta (opcional) | `POST /appointments` | Agenda semanal do painel profissional. |
| Satisfação (opcional) | `GET /appointments/satisfaction` | Indicador simples complementar quando houver avaliações de atendimento. |

### Integração ponta a ponta

- **Mobile Android:** consome prescrições reais, salva check-ins por exercício no Room e sincroniza com `/check-ins/sync`.
- **Backend/API:** protege rotas por JWT/perfil, persiste dados clínicos, aplica LGPD e expõe `/exercise-executions/patient/:patientId`.
- **Web:** mostra prescrições, bloqueia plano sem LGPD e exibe evolução/check-ins reais na aba do paciente.

Para dados demo, rode a API com `SEED_DEMO_DATA=true` e siga o roteiro em `maya-rpg-api/docs/final-demo-roteiro.md`.

### Validação local

```bash
npm run build
npm test -- --watch=false
```

Cobertura de testes atualmente protegida:

- Guard de permissões ADMIN/PROFESSIONAL.
- Login e armazenamento de tokens.
- Filtros/paginação de pacientes via HTTP.
- Bloqueio de prescrição sem aceite LGPD.
- Navegação para novo prontuário a partir do paciente.
- Upload de mídia rejeitando arquivos não-imagem.
- Agenda usando API sem persistência local silenciosa.
