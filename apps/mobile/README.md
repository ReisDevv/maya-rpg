# Sistema Mobile – Clínica Maya Yoshiko Yamamoto (Fisioterapia RPG)

Este repositório contém o aplicativo Android desenvolvido para a **Clínica Maya Yoshiko Yamamoto**, como parte do Projeto Interdisciplinar do 3º Semestre de Análise e Desenvolvimento de Sistemas (2026).

O sistema permite que pacientes visualizem seus planos de exercícios prescritos, realizem o registro de execução (check-in) com acompanhamento de nível de dor, e visualizem seu histórico de evolução.

## 🚀 Tecnologias Utilizadas

- **Linguagem**: Java (Android SDK)
- **Interface**: Layouts baseados 100% em `ConstraintLayout`.
- **Rede**: Retrofit 2 para consumo de API REST (JSON).
- **Persistência Local**: Room Persistence Library (SQLite) para cache offline.
- **Background**: WorkManager para sincronização de dados em segundo plano.
- **Notificações**: Firebase Cloud Messaging (FCM) e WorkManager (Lembretes Locais).
- **Gráficos**: MPAndroidChart para visualização de evolução da dor.

## 📂 Estrutura do Projeto

O projeto segue uma organização modular por pacotes dentro de `app/src/main/java/com/maya/rpg/`:

```text
├── api/            # Configurações do Retrofit, Interface da API e Gestão de Tokens (JWT).
├── db/             # Camada de persistência local (Room): Database, DAOs e Entidades.
├── fcm/            # Serviços e configurações do Firebase Cloud Messaging.
├── model/          # Modelos de dados (POJOs) para requisições e respostas da API.
├── ui/             # Camada de Interface do Usuário organizada por funcionalidades:
│   ├── auth/       # Login e recuperação de senha.
│   ├── home/       # Dashboard principal do paciente.
│   ├── exercises/  # Listagem e execução (check-in) de exercícios.
│   ├── evolution/  # Visualização de gráficos e histórico de progresso.
│   └── splash/     # Tela de abertura e carregamento inicial.
├── worker/         # Workers do WorkManager para sincronização offline em segundo plano.
├── notifications/  # Helpers para criação e exibição de notificações locais.
└── MayaApplication.java # Inicialização global do App e configurações de contexto.

Recursos em `app/src/main/res/`:
├── layout/         # Arquivos XML de definição de interface (ConstraintLayout).
├── drawable/       # Ícones, backgrounds e recursos visuais customizados.
├── values/         # Definições de cores (palette), strings e estilos (themes).
└── menu/           # Definições de menus da barra superior e navegação.
```


## ✅ Status da Entrega 2

- [x] **Consumo de API**: Integração completa com o backend NestJS.
- [x] **Autenticação**: Login via Email/CPF com persistência de Token JWT.
- [x] **Persistência Offline**: Cache de exercícios e sessões via SQLite.
- [x] **Check-in por Exercício**: Registro de execução com `exerciseId`, escala de dor (0-10) e notas.
- [x] **Evolução do Paciente**: Gráficos dinâmicos de progresso semanal.
- [x] **Notificações**: Lembretes diários e suporte a Push Notifications.
- [x] **Infraestrutura**: Configuração de Base URL flexível para testes.

---

## 🛠️ Instruções de Configuração e Uso

### 1. Preparação do Ambiente
O app está apontado para a API hospedada por `BuildConfig.API_BASE_URL`:

```kotlin
buildConfigField(
    "String",
    "API_BASE_URL",
    "\"https://maya-rpg-api-1t7v.onrender.com/api/\""
)
```

Para testar localmente, altere `API_BASE_URL` em `app/build.gradle.kts` para `http://10.0.2.2:3000/api/` no emulador Android ou para o IP da sua máquina em dispositivo físico.

### 2. Fluxo de Uso
1. **Login**: Utilize o e-mail cadastrado. No primeiro acesso, sua senha será o seu **CPF** (apenas números).
2. **Plano de Exercícios**: Na Home, clique em "Meus Exercícios". Caso esteja sem internet, o app carregará a última versão salva.
3. **Realizar Check-in**:
   - Escolha o exercício realizado no seletor da tela.
   - Arraste a barra para indicar seu **Nível de Dor** (0 a 10).
   - Adicione uma observação (opcional) e clique em **Registrar Treino**.
   - Se estiver offline, o app salvará localmente e sincronizará automaticamente quando a internet voltar.
4. **Histórico**: Acesse "Minha Evolução" para ver o gráfico de dor e a lista de sessões concluídas.

### 3. Contrato de Check-in

O app envia para `POST /api/check-ins` e `POST /api/check-ins/sync`:

```json
{
  "prescriptionId": "uuid-da-prescricao",
  "exerciseId": "uuid-do-exercicio",
  "painLevel": 4,
  "notes": "Executei sem dor aguda",
  "executedAt": "2026-05-02T12:00:00.000Z"
}
```

O Room guarda a sessão localmente em `exercise_sessions` e sincroniza quando houver internet.

### 4. Build

```bash
./gradlew :app:assembleDebug
```

---

## 📄 Documentação Adicional
- [Manual de Instalação e Testes](docs/manual_entrega2.md)
- [Arquitetura de Banco de Dados](docs/database_schema.md)
- [Evidências e Fluxos (Entrega 2)](docs/evidencias_entrega2.md)

---
**Equipe**: Maya RPG Dev Team  
**Instituição**: Centro Universitário (ADS 2026)
