# Qualidade de Software e Testes

O PDF pede aplicação de conceitos de qualidade, testes unitários, testes de integração, teste de carga e teste de sistema/aceitação.

## Comandos

```bash
npm run lint
npm run build
npm test -- --runInBand
npm run test:e2e
k6 run test/load/load-test.js
```

## Testes Unitários

O projeto possui testes unitários no padrão `*.spec.ts`.

Exemplos:

| Arquivo | Finalidade |
|---|---|
| `src/auth/auth.service.spec.ts` | Valida regras de autenticação. |
| `src/patients/patients.service.spec.ts` | Valida regras de pacientes. |
| `src/check-ins/check-ins.service.spec.ts` | Valida check-ins de exercícios. |
| `src/dashboard/dashboard.service.spec.ts` | Valida indicadores do dashboard. |
| `src/common/lgpd/lgpd.service.spec.ts` | Valida funções de LGPD. |

Comando:

```bash
npm test -- --runInBand
```

Resultado validado anteriormente no projeto:

```text
Test Suites: 6 passed, 6 total
Tests: 23 passed, 23 total
```

## Testes de Integração/E2E

Arquivos:

| Arquivo | Finalidade |
|---|---|
| `test/app.e2e-spec.ts` | Verifica inicialização e endpoint base. |
| `test/dashboard.e2e-spec.ts` | Verifica endpoints de dashboard. |
| `test/acceptance.e2e-spec.ts` | Simula fluxo de aceitação do sistema. |

Comando:

```bash
npm run test:e2e
```

## Teste de Carga

Arquivo principal:

```text
test/load/load-test.js
```

Execução:

```bash
k6 run test/load/load-test.js
```

O teste simula até 20 usuários virtuais durante 2 minutos, acessando rotas de autenticação e check-in. Como algumas rotas são protegidas, respostas `401`, `403` e `429` são tratadas como respostas esperadas no cenário de resiliência.

Critérios configurados:

```js
http_req_duration: ['p(95)<500']
http_req_failed: ['rate<0.01']
```

O print ideal para a entrega deve mostrar:

- `http_req_duration` com check aprovado.
- `http_req_failed` com check aprovado.
- Checks funcionais aprovados.
- Sem mensagem final de threshold quebrado.

## Teste de Sistema/Aceitação

Arquivo:

```text
test/acceptance.e2e-spec.ts
```

Objetivo:

- Validar fluxo integrado da API.
- Conferir se funcionalidades principais atendem ao cenário esperado pelo usuário/profissional.
- Servir como evidência de comportamento do sistema como um todo.

## Atributos ISO/IEC 25010 Aplicados

| Atributo | Aplicação no projeto |
|---|---|
| Adequação funcional | Endpoints cobrem autenticação, pacientes, prescrições, check-ins, prontuários e dashboard. |
| Eficiência de desempenho | Paginação, thresholds do k6 e healthchecks. |
| Compatibilidade | API REST consumível por app mobile e web. |
| Usabilidade | Swagger em `/api/docs` documenta a API para consumo. |
| Confiabilidade | Healthchecks, restart automático e testes automatizados. |
| Segurança | JWT, bcrypt, roles/guards, LGPD e `.env` fora do Git. |
| Manutenibilidade | Organização por módulos NestJS, DTOs, services, controllers e entities. |
| Portabilidade | Dockerfile e Docker Compose permitem executar em diferentes máquinas. |

## Processo de Qualidade

Fluxo recomendado:

```text
Código -> lint -> build -> testes unitários -> testes e2e -> Docker Compose -> teste de carga -> evidências/prints
```

Esse processo reduz risco de regressão antes da demonstração e cria evidências objetivas para a entrega.
