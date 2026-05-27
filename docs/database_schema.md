# Arquitetura de Banco de Dados Local (Room/SQLite)

**Projeto:** Sistema Mobile – Clínica Maya Yoshiko Yamamoto  
**Tecnologia:** Room Persistence Library 2.6.1 sobre SQLite  
**Finalidade:** Garantir o funcionamento offline-first do aplicativo, permitindo que o paciente acesse seu plano de exercícios e registre treinos mesmo sem conexão com a internet.

---

## 1. Visão Geral

O banco de dados local (`maya_db`) é gerenciado pela classe `AppDatabase`. Ele atua como um cache da API REST para leitura (prescrições) e como um repositório temporário para gravação (sessões/check-ins) até que a sincronização com o backend seja possível.

O acesso ao banco é sempre assíncrono, gerenciado por executores na camada de repositório/UI ou através do `WorkManager` (para background sync).

---

## 2. Entidades Locais

O banco de dados é composto atualmente por 2 tabelas principais:

### Tabela: `cached_prescriptions`
Armazena a última versão do plano de exercícios baixada do servidor.

| Campo | Tipo SQLite | Descrição |
|-------|-------------|-----------|
| `id` | TEXT (PK) | UUID da prescrição gerado no backend. |
| `patientId` | TEXT | UUID do paciente a quem a prescrição pertence. |
| `title` | TEXT | Título do plano de exercícios. |
| `description` | TEXT | Descrição ou objetivo do plano. |
| `exercisesJson` | TEXT | Lista de exercícios serializada via Gson para evitar tabelas relacionais complexas no SQLite. |
| `startDate` | TEXT | Data de início da prescrição (ISO 8601). |
| `endDate` | TEXT | Data de término da prescrição (ISO 8601). |
| `isActive` | INTEGER | Booleano (0 ou 1) indicando se o plano está ativo. |
| `cachedAt` | INTEGER | Timestamp local (millis) de quando o cache foi salvo. |

### Tabela: `exercise_sessions`
Armazena os check-ins realizados pelo paciente localmente.

| Campo | Tipo SQLite | Descrição |
|-------|-------------|-----------|
| `id` | INTEGER (PK) | Auto-incrementado, chave primária puramente local. |
| `patientId` | TEXT | UUID do paciente que executou. |
| `prescriptionId` | TEXT | UUID da prescrição vinculada. |
| `exerciseId` | TEXT | UUID do exercício executado. |
| `completedAt` | INTEGER | Timestamp local (millis) da execução. |
| `completed` | INTEGER | Booleano (0 ou 1) indicando se o exercício foi concluído. |
| `painLevel` | INTEGER | Nível de dor (0 a 10) relatado pelo paciente. |
| `feelingLevel` | INTEGER | Nível de sentimento/dificuldade (1 a 5). |
| `notes` | TEXT | Observações opcionais preenchidas pelo paciente. |
| `isSynced` | INTEGER | **Crucial:** Flag (0 ou 1) indicando se já foi enviado à API. |

---

## 3. Data Access Objects (DAOs)

### `CachedPrescriptionDao`
Gerencia a tabela `cached_prescriptions`.

- `insertAll(List<CachedPrescription>)`: Atualiza o cache. Usa `OnConflictStrategy.REPLACE` para sobrescrever dados antigos.
- `getByPatient(String patientId)`: Retorna a lista de prescrições em cache do paciente, ordenada por `cachedAt DESC`.
- `deleteByPatient(String patientId)`: Limpa o cache de um paciente específico (ex: no logout).

### `ExerciseSessionDao`
Gerencia a tabela `exercise_sessions`.

- `insert(ExerciseSession)`: Grava um novo check-in local.
- `getByPatient(String patientId)`: Histórico bruto local.
- `getByPatientSince(String patientId, long since)`: Histórico filtrado para gráficos semanais.
- `getUnsyncedSessions()`: **Retorna apenas as sessões onde `isSynced = 0`. Usado pelo SyncWorker.**
- `markAsSynced(List<Integer> ids)`: **Atualiza as sessões para `isSynced = 1` após envio bem-sucedido à API.**
- `deleteByPatient(String patientId)`: Limpa histórico sincronizado. Sessões com `isSynced = 0` são preservadas para evitar perda de dados (Dirty read prevention).

---

## 4. Migrations (AppDatabase)

Para garantir que o app do paciente não quebre (crash) nem perca dados de check-ins não sincronizados durante uma atualização, o Room utiliza migrações explícitas.

- **MIGRATION_3_4**: Formalização da transição estrutural.
- **MIGRATION_4_5**: Adição da coluna `exerciseId TEXT` na tabela `exercise_sessions` (necessária para vincular a execução ao exercício específico).
- **MIGRATION_5_6**: Adição da coluna `feelingLevel INTEGER NOT NULL DEFAULT 0` na tabela `exercise_sessions` (novo requisito de feedback emocional da Entrega 2).

O banco usa `.fallbackToDestructiveMigrationOnDowngrade()`, ou seja, o esquema só é destruído caso um downgrade de APK seja forçado. Em upgrades normais, os dados são preservados.

---

## 5. Sincronização e Modo Offline

1. **Leitura (Cache):** Toda vez que a `ExercisePlanActivity` abre online, ela salva a resposta da API no `CachedPrescriptionDao`. Se o app estiver offline, ele lê dessa mesma fonte.
2. **Gravação (Check-in):** Toda sessão é salva **primeiro** no Room via `ExerciseSessionDao.insert()` com `isSynced = false`.
3. **Background Sync:** Imediatamente após o insert, o `OfflineManager.triggerSync()` delega para o WorkManager (`SyncWorker`), que tenta ler `getUnsyncedSessions()` e enviá-las para `POST /api/check-ins/sync`.
4. **Resiliência:** Se não houver internet no momento do check-in, o WorkManager mantém o job na fila e executa assim que o Android detectar conexão (Constraints.NetworkType.CONNECTED).
