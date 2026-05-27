# Evidências da Entrega 2 e Roteiros de Teste

**Projeto:** Sistema Mobile – Clínica Maya Yoshiko Yamamoto  
**Repositório:** MayaRPG-mobile  
**Versão:** Entrega 2 — Projeto Interdisciplinar ADS 2026

Este documento comprova o atendimento aos requisitos da Entrega 2 da UC de Programação Mobile e detalha o funcionamento do modo offline.

---

## 1. Matriz de Requisitos — Programação Mobile (Entrega 2)

| Requisito | Status | Arquivos Comprobatórios |
|-----------|--------|-------------------------|
| 1. Consumo de API REST | ✅ Atendido | `ApiService.java`, `RetrofitClient.java` |
| 2. Tratamento de retornos em formato JSON | ✅ Atendido | Modelos POJO em `model/` (22 arquivos com `@SerializedName`) |
| 3. Autenticação (Persistência de dados logados) | ✅ Atendido | `TokenManager.java`, `BaseAuthActivity.java`, `LoginActivity.java` |
| 4. Armazenamento de dados local (SQLite/Room) | ✅ Atendido | `AppDatabase.java`, `db/entity/`, `db/dao/` |
| 5. Realização de Exercício (Check-in) | ✅ Atendido | `RegisterPlanActivity.java`, `ExerciseDetailActivity.java` |
| 6. Registro do nível de dor (0 a 10) | ✅ Atendido | `RegisterPlanActivity.java`, `ExerciseSession.java` |
| 7. Histórico de Evolução | ✅ Atendido | `EvolutionActivity.java` |
| 8. Sincronização com backend | ✅ Atendido | `SyncWorker.java`, `OfflineManager.java` |
| 9. Persistência offline | ✅ Atendido | `OfflineManager.java`, `CachedPrescription.java` |
| 10. Notificações de lembrete | ✅ Atendido | `ReminderWorker.java`, `MayaFirebaseMessagingService.java` |
| 11. Gráfico de acompanhamento | ✅ Atendido | `EvolutionActivity.java`, bibliotecas em `libs/` (MPAndroidChart) |

---

## 2. Consumo de API (Endpoints Utilizados)

A interface `ApiService.java` gerencia o contrato com o backend. Principais endpoints da Entrega 2:

- **Autenticação e Conta**
  - `POST /auth/login` (Login, emissão de JWT)
  - `POST /auth/change-password` (Alteração de senha do primeiro acesso)
  - `POST /auth/accept-lgpd` (Aceite do termo LGPD)
  - `PATCH /auth/fcm-token` (Sincroniza token de Push Notification)
- **Dados do Paciente**
  - `GET /patients/me` (Dados de perfil)
  - `GET /prescriptions/me/full` (Busca todas as prescrições e exercícios)
- **Check-in e Evolução**
  - `POST /check-ins` (Check-in síncrono único)
  - `POST /check-ins/sync` (Sincronização de lote offline)
  - `GET /check-ins/my-history` (Dados de evolução para os gráficos)

---

## 3. Fluxo de Sincronização e Modo Offline

A arquitetura *offline-first* garante que o paciente registre sua dor mesmo em áreas sem sinal. O fluxo ocorre em 8 passos:

1. A Home/ExercisePlan acessa a API (`GET /prescriptions/me/full`).
2. Os dados recebidos são salvos localmente (`CachedPrescriptionDao.insertAll`).
3. O paciente entra em uma área **sem internet** e abre o app.
4. O app detecta a falha de rede e busca as prescrições no Room (`CachedPrescriptionDao.getByPatient`), exibindo o alerta "Modo offline".
5. O paciente faz os exercícios e registra no `RegisterPlanActivity` com nota de dor (0-10).
6. O registro é salvo no banco SQLite (`ExerciseSessionDao.insert`) com a flag `isSynced = false`.
7. O app manda um comando pro WorkManager: `OfflineManager.triggerSync()`. Como não há internet, o WorkManager deixa o job pausado.
8. Assim que a **internet retorna**, o OS acorda o `SyncWorker`, que varre as sessões não enviadas (`getUnsyncedSessions`), envia um POST para `/check-ins/sync` e atualiza para `isSynced = true`.

---

## 4. Roteiro de Teste Manual Offline

Para testar e validar o requisito no emulador ou celular físico:

1. **Logue no app e abra a aba "Meus Exercícios"** (Precisa de internet para o 1º cache).
2. **Desative o Wi-Fi e Dados Móveis** (Modo avião).
3. **Feche e abra o app novamente.** Você deve ver os exercícios e a tag avisando sobre o modo offline.
4. **Entre em um exercício e conclua (Registre Treino).** Avalie a dor (ex: nível 7). A tela de sucesso aparecerá normalmente.
5. (Opcional) Verifique via App Inspection do Android Studio que na tabela `exercise_sessions`, o registro tem `isSynced = 0`.
6. **Desligue o modo avião (Reconecte a internet).**
7. Aguarde alguns segundos. O WorkManager disparará o `SyncWorker` em background.
8. **Valide a sincronização:** Abra o backend/banco em nuvem e verifique que o registro com dor nível 7 chegou. Se olhar a tabela local, o `isSynced` mudou para `1`.

---

## 5. Qualidade de Software — Automação de Testes

De acordo com os requisitos de "Testes e Qualidade", foram implementados testes cobrindo unidades, integração de banco de dados e fluxos de sistema.

### Testes Unitários (`src/test/java/com/maya/rpg/`)
- `TokenManagerTest`: Valida parsing de JSON, decodificação de roles (PATIENT) e paginação.
- `ModelContractTest`: Garante que modelos (ex: LGPD, Auth) refletem os atributos esperados pela API.
- `SyncWorkerLogicTest`: Testa regras de negócio e mapeamento do Batch Sync de exercícios.

### Testes Instrumentados (`src/androidTest/java/com/maya/rpg/`)
*Obrigatórios na Entrega 2, valendo nota direta na UC.*

1. **`ExerciseSessionDaoIntegrationTest.java` (Integração)**
   - Testa Inserção, Query, Filtragem de não sincronizados (`getUnsyncedSessions`) e Atualização de flag de sincronia usando banco de dados Room *in-memory* real.
2. **`CachedPrescriptionDaoIntegrationTest.java` (Integração)**
   - Testa Inserção de lote de cache, Busca isolada por ID de paciente e Remoção de cache, validando persistência SQLite correta.
3. **`LoginFlowSystemTest.java` (Sistema/Aceitação com Espresso)**
   - Valida fluxo end-to-end do usuário real: garante exibição de tela, validação de campos vazios, feedback contra credenciais inválidas e presença de link de recuperação.

### Comandos de Validação (Via Terminal)

Compilar e rodar testes unitários (Rápido, sem emulador):
```bash
./gradlew :app:testDebugUnitTest
```

Compilar e rodar testes instrumentados (Requer Emulador/Dispositivo conectado):
```bash
./gradlew :app:connectedDebugAndroidTest
```
