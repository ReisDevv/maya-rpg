# Manual de Instalação, Configuração e Testes — Entrega 2

**Projeto:** Sistema Mobile – Clínica Maya Yoshiko Yamamoto  
**Repositório:** MayaRPG-mobile  
**Versão:** Entrega 2 — Projeto Interdisciplinar ADS 2026

---

## 1. Requisitos de Ambiente

| Requisito | Versão mínima |
|-----------|---------------|
| Android Studio | Ladybug (2024.2+) ou superior |
| JDK | 11 |
| Android SDK | compileSdk 36, minSdk 26 |
| Gradle | 9.3.1 (wrapper incluso no repositório) |
| Dispositivo/Emulador | Android 8.0 (API 26) ou superior |

### Dependências externas (baixadas automaticamente pelo Gradle)
- Retrofit 2.9.0 + Gson Converter
- OkHttp Logging Interceptor 4.12.0
- Room 2.6.1 (runtime, compiler, testing)
- WorkManager 2.9.0
- Firebase BOM 32.8.0 + FCM
- MPAndroidChart v3.1.0 (AAR local em `app/libs/`)
- Glide 4.16.0
- Material Calendar View 1.9.2
- Espresso 3.5.1 + AndroidX Test JUnit 1.1.5

---

## 2. Configuração da API_BASE_URL

A URL da API é configurada em `app/build.gradle.kts`:

```kotlin
buildConfigField(
    "String",
    "API_BASE_URL",
    "\"https://maya-rpg-api-1t7v.onrender.com/api/\""
)
```

### Para testar com backend local

- **Emulador Android:** alterar para `"\"http://10.0.2.2:3000/api/\""`
- **Dispositivo físico:** alterar para `"\"http://<IP-DA-MAQUINA>:3000/api/\""`

Após alterar, sincronize o Gradle e rebuilde o projeto.

---

## 3. Como Compilar o App

```bash
# Build Debug (gera APK em app/build/outputs/apk/debug/)
./gradlew :app:assembleDebug

# Build Release (com ProGuard/R8)
./gradlew :app:assembleRelease
```

No Android Studio: `Build > Make Project` ou `Shift+F10` para rodar direto no dispositivo.

---

## 4. Como Rodar Testes Unitários

Os testes unitários ficam em `app/src/test/java/com/maya/rpg/` e não precisam de emulador:

```bash
./gradlew :app:testDebugUnitTest
```

### Testes unitários disponíveis

| Classe | Testes | O que cobre |
|--------|--------|-------------|
| `TokenManagerTest` | 4 | Parsing de LoginResponse, roles, prescrições, PaginatedResponse |
| `ModelContractTest` | 4 | Contrato JSON de modelos, LGPD, reset/refresh tokens |
| `SyncWorkerLogicTest` | 2 | Mapeamento ExerciseSession→CheckInRequest, filtro de batch |
| `ExerciseSessionDaoTest` | — | Testes de contrato do DAO |

---

## 5. Como Compilar Testes Instrumentados

Os testes instrumentados ficam em `app/src/androidTest/java/com/maya/rpg/` e precisam de emulador ou dispositivo:

```bash
# Apenas compilar (sem executar — não precisa de dispositivo)
./gradlew :app:compileDebugAndroidTestJavaWithJavac
```

### Testes instrumentados disponíveis

| Classe | Testes | Tipo | O que cobre |
|--------|--------|------|-------------|
| `ExerciseSessionDaoIntegrationTest` | 6 | Integração (Room) | Insert, query, getUnsyncedSessions, markAsSynced, countByPrescription, deleteByPatient, getByPatientSince |
| `CachedPrescriptionDaoIntegrationTest` | 5 | Integração (Room) | InsertAll, getByPatient, campos intactos, deleteByPatient, REPLACE por PK, lista vazia |
| `LoginFlowSystemTest` | 4 | Sistema/Aceitação (Espresso) | Elementos da tela de login, validação de campos vazios, tentativa com credenciais inválidas, link de recuperação de senha |

---

## 6. Como Executar Testes Instrumentados

### Pré-requisitos
1. Emulador Android rodando **ou** dispositivo físico conectado via USB/ADB
2. Verificar conexão: `adb devices` deve listar o dispositivo

### Executar todos os testes instrumentados
```bash
./gradlew :app:connectedDebugAndroidTest
```

### Executar uma classe específica
```bash
# Apenas testes de integração do Room
./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.maya.rpg.ExerciseSessionDaoIntegrationTest

# Apenas teste de sistema (Espresso)
./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.maya.rpg.LoginFlowSystemTest
```

### Relatório de resultados
Após execução, o relatório HTML fica em:
```
app/build/reports/androidTests/connected/debug/index.html
```

---

## 7. Fluxo Principal da Entrega 2

O fluxo completo do app segue esta sequência:

```
SplashActivity (3s) → [Token válido?]
    ├── NÃO → LoginActivity
    │         ├── [Primeiro acesso?] → ChangePasswordActivity → LgpdConsentActivity → HomeActivity
    │         └── [Acesso normal] → HomeActivity
    └── SIM → HomeActivity
```

### Passo a passo

1. **Login** (`LoginActivity`)
   - Paciente informa e-mail/CPF e senha
   - API: `POST /auth/login` → retorna `accessToken`, `refreshToken`, dados do usuário
   - Token salvo em `EncryptedSharedPreferences` (AES-256-GCM)

2. **Dashboard** (`HomeActivity`)
   - Exibe saudação, próxima consulta, calendário semanal, progresso
   - Acesso rápido a: Exercícios, Agendamento, Chat, Evolução

3. **Plano de Exercícios** (`ExercisePlanActivity`)
   - API: `GET /prescriptions/me/full` → lista de prescrições com exercícios
   - Cache automático via `OfflineManager` → tabela `cached_prescriptions`
   - Filtro por texto, indicador de exercícios concluídos

4. **Detalhe do Exercício** (`ExerciseDetailActivity`)
   - Exibe imagens (carrossel ViewPager2), séries, repetições, timer countdown
   - Botão "Registrar Plano" navega para registro

5. **Check-in / Registro** (`RegisterPlanActivity`)
   - Escala de sentimento (1-5) + Escala de dor (0-10, Slider Material)
   - Observações opcionais
   - Salva `ExerciseSession` no Room com `isSynced = false`
   - Dispara `OfflineManager.triggerSync()` → `SyncWorker` via WorkManager

6. **Sincronização** (`SyncWorker`)
   - Consulta sessões com `isSynced = 0`
   - Envia em lote: `POST /check-ins/sync`
   - Sucesso → marca `isSynced = 1`
   - Falha → `Result.retry()` (WorkManager reagenda automaticamente)

7. **Evolução** (`EvolutionActivity`)
   - API: `GET /check-ins/my-history`
   - 3 gráficos: Dor (LineChart mensal), Melhora (LineChart invertido), Frequência (BarChart semanal)
   - Dados reais do histórico de check-ins do paciente
