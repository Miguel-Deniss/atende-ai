# Arquitetura do AtendeAI

> **Documentação Técnica Oficial**
>
> Versão: 0.1.0 | Última atualização: Julho 2026

---

## Sumário

- [1. Visão Geral do Projeto](#1-visão-geral-do-projeto)
- [2. Stack Tecnológica](#2-stack-tecnológica)
- [3. Estrutura do Projeto](#3-estrutura-do-projeto)
- [4. Arquitetura Backend](#4-arquitetura-backend)
- [5. Banco de Dados](#5-banco-de-dados)
- [6. Sistema de Conversas](#6-sistema-de-conversas)
- [7. Arquitetura de Inteligência Artificial](#7-arquitetura-de-inteligência-artificial)
- [8. Frontend](#8-frontend)
- [9. Segurança](#9-segurança)
- [10. Dependências Importantes](#10-dependências-importantes)
- [11. Estado Atual do Projeto](#11-estado-atual-do-projeto)
- [12. Recomendações Técnicas](#12-recomendações-técnicas)

---

## 1. Visão Geral do Projeto

### Nome

**AtendeAI** — Plataforma de Atendimento com IA para WhatsApp.

### Objetivo do Sistema

Automatizar o atendimento ao cliente de pequenas e médias empresas via WhatsApp usando inteligência artificial conversacional. A plataforma permite que empresas ofereçam suporte 24/7, agendem serviços, capturem clientes e reduzam a carga de trabalho da equipe humana.

### Problema que Resolve

Pequenas e médias empresas (barbearias, salões de beleza, clínicas) recebem dezenas de mensagens diárias no WhatsApp — agendamentos, dúvidas sobre serviços, preços, horários. Atender manualmente consome tempo e recursos. O AtendeAI automatiza esse processo com um assistente virtual inteligente que entende o contexto do negócio e responde clientes de forma natural.

### Público-alvo

- Barbearias e salões de beleza
- Clínicas de estética e saúde
- Pequenos comércios e prestadores de serviços
- Empresas que usam WhatsApp como canal de atendimento

---

## 2. Stack Tecnológica

### Frontend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Next.js | 15.3 | Framework React com App Router (SSR/SSG/API Routes) |
| TypeScript | 5.9 | Tipagem estática em toda a aplicação |
| Tailwind CSS | 4.1 | Estilização utilitária com design system customizado |
| Framer Motion | 12.6 | Animações de componentes e transições de página |
| Radix UI | — | Primitivos acessíveis e headless (accordion, avatar, dialog, dropdown, select, tabs, toast, tooltip) |
| Lucide React | — | Biblioteca de ícones |
| Zod | 4.4 | Validação de schemas em runtime (compartilhado entre front e back) |
| class-variance-authority | 0.7 | Variantes de componentes (estilo com CVA) |
| tailwind-merge | 3.2 | Combinação inteligente de classes Tailwind |
| next-themes | 0.4 | Tema dark/light |

### Backend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Next.js API Routes | 15.3 | Rotas de API serverless dentro do próprio Next.js |
| Prisma | 6.19 / 7.9 (adapter) | ORM type-safe com migrations e queries |
| PostgreSQL | 16 | Banco de dados relacional |
| bcryptjs | 3.0 | Hash de senhas (12 rounds de salt) |
| jsonwebtoken | 9.0 | Criação e verificação de JWT (access e refresh tokens) |
| jose | 6.2 | Verificação de JWT no Edge Runtime (middleware) |
| Speakeasy | 2.0 | Geração e verificação de códigos TOTP para 2FA |
| Stripe | 22.3 | Processamento de pagamentos e assinaturas |
| Zod | 4.4 | Validação de payloads nas API routes |
| Helmet | 8.3 | Middleware de segurança HTTP (instalado como dependência) |
| Multer | 2.2 | Upload de arquivos |
| Sharp | 0.35 | Processamento de imagens |

### Banco de Dados

| Tecnologia | Finalidade |
|---|---|
| PostgreSQL 16 | Banco principal |
| Prisma ORM | Camada de acesso a dados com type-safety |
| Prisma Adapter Pg | Adaptador nativo PostgreSQL |
| Row-Level Security (RLS) | Isolamento adicional via políticas no banco |

### Inteligência Artificial

| Provider | Status | Modelo |
|---|---|---|
| Ollama | Implementado | qwen3:8b (local) |
| OpenAI | Configurado via env vars | gpt-4 (configurado como padrão no schema) |

### Infraestrutura

| Tecnologia | Finalidade |
|---|---|
| Docker | Containerização da aplicação e banco |
| Docker Compose | Orquestração local |
| GitHub Actions | CI/CD automatizado |
| Cloudflare Workers | Edge worker para segurança e cache |
| Sentry | Monitoramento de erros em produção |
| Supabase | Storage e Auth (opcional, configurado via env) |

---

## 3. Estrutura do Projeto

```
atende-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint → TypeCheck → Build → Test → Docker
│       ├── deploy.yml           # Deploy para staging/production via SSH
│       └── security.yml         # Auditoria semanal de segurança
├── cloudflare/
│   ├── worker.ts               # Edge worker para headers de segurança e cache
│   └── wrangler.toml           # Configuração do Cloudflare Workers
├── docker/
├── docs/
├── prisma/
│   ├── schema.prisma           # Definição completa do banco de dados
│   └── migrations/
│       └── rls/
│           ├── 001_enable_rls.sql     # Row-Level Security policies
│           └── 002_composite_indexes.sql # Índices otimizados
├── public/                     # Assets estáticos
├── scripts/
│   ├── seed.ts                 # Seed inicial (admin padrão)
│   └── backup.sh               # Script de backup do banco
├── src/
│   ├── app/
│   │   ├── api/                # API Routes (30+ endpoints)
│   │   │   ├── auth/           # Login, register, logout, 2FA, reset-password
│   │   │   ├── admin/          # Stats, companies, logs, audit
│   │   │   ├── clients/        # CRUD de clientes
│   │   │   ├── conversations/  # Listagem, detalhes, mensagens
│   │   │   ├── webhooks/       # Stripe e WhatsApp
│   │   │   ├── health/         # Health check completo
│   │   │   ├── settings/       # Configurações da empresa + IA
│   │   │   ├── profile/        # Perfil do usuário
│   │   │   ├── subscription/   # Assinatura e planos
│   │   │   ├── schedule/       # Agenda
│   │   │   └── upload/         # Upload de arquivos
│   │   ├── admin/              # Páginas do painel admin
│   │   ├── dashboard/          # Páginas do dashboard principal
│   │   ├── login/              # Página de login
│   │   ├── register/           # Página de cadastro
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Layout raiz
│   │   └── globals.css         # Estilos globais Tailwind
│   ├── components/
│   │   ├── conversations/      # Componentes do sistema de conversas
│   │   ├── dashboard/          # AuthGuard, Sidebar
│   │   ├── landing/            # Seções da landing page
│   │   └── ui/                 # Componentes reutilizáveis (button, card, input, etc.)
│   ├── contexts/
│   │   └── AuthContext.tsx     # Contexto de autenticação do frontend
│   ├── hooks/
│   │   ├── useDebounce.ts      # Debounce para inputs de busca
│   │   └── useLocalStorage.ts  # Persistência local no navegador
│   ├── lib/
│   │   ├── ai/                 # Módulo de inteligência artificial (conversation manager)
│   │   │   ├── assistant.ts    # Fachada pública: generateAIResponse(input)
│   │   │   ├── conversation-manager.ts  # Orquestrador (state machine + slot filling)
│   │   │   ├── intention-detector.ts    # Detecção de intenção (determinística + fallback LLM)
│   │   │   ├── slot-extractor.ts        # Extração de slots (serviço, data, hora, nome)
│   │   │   ├── prompt-builder.ts        # Construção dinâmica do prompt (estado + contexto)
│   │   │   ├── conversation-state.ts    # Persistência do estado (coluna `state` Json)
│   │   │   ├── context-loader.ts        # Carrega conversa + empresa + knownName
│   │   │   ├── guardrails.ts            # isGarbageResponse + containsInventedInfo
│   │   │   ├── appointment-date.ts      # Resolução de datas livres em Date
│   │   │   ├── provider.ts              # Chamada ao modelo (Ollama / qwen3:8b)
│   │   │   └── flows/
│   │   │       └── appointment.ts       # Máquina de estados do agendamento
│   │   ├── api/
│   │   │   └── client.ts       # Cliente HTTP genérico com retry e timeout
│   │   ├── auth/
│   │   │   ├── jwt.ts          # Criação e verificação de tokens JWT
│   │   │   ├── jwt-edge.ts     # Verificação JWT para Edge Runtime
│   │   │   ├── session.ts      # Gerenciamento de sessões + cookies
│   │   │   ├── password.ts     # Hash e verificação de senhas
│   │   │   └── api-response.ts # Respostas HTTP padronizadas
│   │   ├── db/
│   │   │   └── prisma.ts       # Singleton do Prisma Client
│   │   ├── logger/
│   │   │   ├── index.ts        # Logs de auditoria no banco
│   │   │   └── structured.ts   # Logger estruturado em JSON
│   │   ├── monitoring/
│   │   │   └── sentry.ts       # Integração com Sentry
│   │   ├── rate-limit/
│   │   │   └── index.ts        # Rate limiting in-memory
│   │   ├── resilience/
│   │   │   ├── circuit-breaker.ts  # Circuit breaker pattern
│   │   │   └── retry.ts        # Retry com backoff exponencial
│   │   ├── security/
│   │   │   ├── encryption.ts   # AES-256-GCM + hash de tokens
│   │   │   ├── sanitize.ts     # Sanitização de dados e HTML
│   │   │   ├── csrf.ts         # Proteção CSRF via token
│   │   │   ├── nonce.ts        # Proteção contra replay attack
│   │   │   └── enumeration.ts  # Prevenção de enumeração de usuários
│   │   ├── storage/
│   │   │   └── access.ts       # Controle de acesso a arquivos + signed URLs
│   │   ├── supabase/
│   │   │   ├── client.ts       # Cliente Supabase (admin e anon)
│   │   │   ├── auth.ts         # Sincronização de usuários com Supabase Auth
│   │   │   └── storage.ts      # Upload/download no Supabase Storage
│   │   ├── tenant/
│   │   │   ├── index.ts        # Validação de acesso multi-tenant
│   │   │   ├── guard.ts        # Guard pattern para rotas protegidas
│   │   │   └── plan-limits.ts  # Limites por plano de assinatura
│   │   ├── validators/
│   │   │   └── auth.ts         # Schemas Zod para validação
│   │   └── utils.ts            # Utilitários (cn para classes Tailwind)
│   ├── middleware.ts            # Middleware Next.js (Edge Runtime)
│   └── types/
│       └── css.d.ts            # Declarações de tipos CSS
├── docker-compose.yml           # Orquestração Docker
├── Dockerfile                   # Docker multi-stage build
├── next.config.ts               # Configuração Next.js (CSP, headers, imagens)
├── vitest.config.ts             # Configuração de testes
├── tsconfig.json                # Configuração TypeScript
└── package.json                 # Dependências e scripts
```

### Função das Principais Pastas

| Pasta | Papel |
|---|---|
| `src/app/` | App Router do Next.js — contém tanto as páginas (frontend) quanto as API Routes (backend) no modelo de arquivos |
| `src/app/api/` | Todas as rotas de API do sistema (~30 endpoints) organizadas por domínio (auth, clients, conversations, admin, webhooks, etc.) |
| `src/components/` | Componentes React reutilizáveis, divididos em UI primitives, dashboard, landing page e sistema de conversas |
| `src/contexts/` | Contextos React — atualmente apenas o AuthContext que gerencia estado de autenticação no cliente |
| `src/lib/` | Core da aplicação: toda a lógica de negócio, serviços, segurança, integrações e utilitários |
| `src/lib/ai/` | Módulo de IA em camadas: fachada, conversation manager (state machine), detecção de intenção, extração de slots, prompt builder e provider |
| `src/lib/auth/` | Autenticação completa: JWT, sessões, senhas, respostas padronizadas |
| `src/lib/tenant/` | Isolamento multi-tenant: validação de acesso, guard, limites por plano |
| `src/lib/security/` | Camada de segurança: criptografia, sanitização, CSRF, nonce, anti-enumeration |
| `src/lib/resilience/` | Padrões de resiliência: circuit breaker, retry com backoff, timeout |
| `prisma/` | Schema do banco de dados e migrations SQL (incluindo RLS e índices) |
| `cloudflare/` | Edge worker do Cloudflare para segurança e cache em produção |
| `.github/workflows/` | Pipelines de CI/CD: lint, typecheck, build, test, docker, deploy, security audit |

---

## 4. Arquitetura Backend

### Modelo Geral

O AtendeAI usa o modelo **API Routes** do Next.js 15, que executa código serverless dentro do próprio framework. Não há um servidor backend separado — as rotas de API convivem com as páginas no mesmo processo Next.js.

```
Browser/Cliente
      │
      ▼
┌─────────────────────────────┐
│     Next.js 15 (App Router) │
│  ┌───────────────────────┐  │
│  │   Middleware (Edge)   │  │
│  │  - Verificação JWT    │  │
│  │  - Headers segurança  │  │
│  │  - Rate limiting      │  │
│  └───────────┬───────────┘  │
│              │              │
│  ┌───────────┴───────────┐  │
│  │     API Routes        │  │
│  │   /api/auth/*         │  │
│  │   /api/clients/*      │  │
│  │   /api/conversations  │  │
│  │   /api/admin/*        │  │
│  │   /api/webhooks/*     │  │
│  │   ...                 │  │
│  └───────────┬───────────┘  │
└──────────────┼───────────────┘
               │
               ▼
     ┌─────────────────┐
     │   Prisma ORM    │
     │  (PostgreSQL)   │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │  PostgreSQL 16  │
     │ Multi-tenant DB │
     └─────────────────┘
```

### Funcionamento das API Routes

Cada arquivo em `src/app/api/**/route.ts` exporta handlers HTTP (GET, POST, PUT, PATCH, DELETE). O Next.js mapeia automaticamente a estrutura de pastas para rotas.

**Padrão de implementação de uma rota:**

```typescript
// 1. Extrai o usuário atual da sessão
const user = await getCurrentUser();
if (!user) return unauthorizedResponse();

// 2. (Opcional) Verifica permissões com guard pattern
const result = await resolveTenant({ requireRole: ["ADMIN"] });
if (result.response) return result.response;

// 3. Valida o payload com Zod
const parsed = schema.safeParse(body);
if (!parsed.success) return errorResponse("Dados inválidos", 400);

// 4. Executa a lógica de negócio via Prisma
const data = await prisma.resource.findMany({ where: { companyId: user.companyId } });

// 5. Registra auditoria (quando aplicável)
await createLog({ action: "ACTION", entity: "...", ... });

// 6. Retorna resposta padronizada
return successResponse(data);
```

**Formato de resposta padronizado:**

```json
// Sucesso
{ "success": true, "data": { ... } }

// Erro
{ "success": false, "error": "Mensagem de erro" }

// Desenvolvimento (detalhes adicionais)
{ "success": false, "error": "...", "details": { ... } }
```

### Autenticação

O fluxo de autenticação funciona em duas camadas:

**1. Autenticação via JWT + Sessões**

```
1. POST /api/auth/login
   ├── Valida email/senha com Zod
   ├── Verifica rate limit (5 tentativas / 15 min por IP)
   ├── Busca usuário no banco
   ├── Verifica senha com bcrypt (12 rounds)
   ├── Se 2FA ativado: valida código TOTP
   ├── Cria sessão no banco (UUID)
   ├── Gera access_token JWT (15min) com { userId, companyId, role }
   ├── Gera refresh_token JWT (7 dias) com { userId, companyId, type: "refresh" }
   ├── Seta 3 cookies HttpOnly:
   │   ├── session_token (sessão no banco, 7 dias)
   │   ├── access_token (JWT, 15 minutos)
   │   └── refresh_token (JWT, 7 dias)
   └── Retorna dados do usuário
```

**2. Middleware (Edge Runtime)**

O middleware em `src/middleware.ts`:
- Usa `jose` para verificar JWT (compatível com Edge Runtime)
- Permite rotas públicas sem autenticação
- Redireciona para `/login` se não autenticado em rotas protegidas
- Adiciona headers de segurança em todas as respostas

**3. Renovação de Token (Silent Refresh)**

```
1. GET /api/auth/me (tenta com access_token)
2. Se access_token expirado → tenta refresh_token
3. refreshAccessToken():
   ├── Lê refresh_token do cookie
   ├── Verifica assinatura e tipo "refresh"
   ├── Busca usuário no banco
   ├── Gera NOVO access_token
   └── Atualiza cookie access_token
4. Se refresh_token inválido → redireciona para /login
```

### Autorização (RBAC)

Três papéis de usuário:

| Papel | Acesso |
|---|---|
| `ADMIN` | Acesso total ao sistema + painel administrativo global |
| `EMPLOYEE` | Agenda, conversas, clientes |
| `FINANCIAL` | Planos, pagamentos, relatórios |

A verificação é feita de duas formas:

**Guard Pattern** — middleware para rotas de API:

```typescript
const result = await resolveTenant({ requireRole: ["ADMIN"] });
const result = await resolveTenant({ requirePlan: ["PRO", "BUSINESS"] });
```

**Verificação inline** — nas rotas que precisam de controle mais granular:

```typescript
if (user.role !== "ADMIN") return forbiddenResponse();
```

### Identificação do Usuário

A função `getCurrentUser()` em `src/lib/auth/session.ts`:
1. Lê o cookie `access_token`
2. Decodifica e verifica o JWT (assinatura + expiração)
3. Se inválido/expirado, tenta renovar com o refresh_token
4. Busca o usuário completo no banco (incluindo dados da empresa)
5. Verifica se o usuário está ativo e a empresa não está suspensa
6. Retorna `null` se qualquer validação falhar

### Multi-tenancy

O isolamento entre empresas (multi-tenant) é implementado em 5 camadas:

1. **Schema-level**: Todas as tabelas possuem `companyId` como chave estrangeira.
2. **Query-level**: Toda query de lista inclui `WHERE companyId = ?` nos filtros.
3. **Auth-level**: `validateCompanyAccess()` no tenant guard verifica se o usuário pertence à empresa.
4. **Admin-level**: Usuários com papel ADMIN podem acessar qualquer empresa.
5. **Database-level**: RLS (Row-Level Security) no PostgreSQL com políticas por `company_id`.

**Proteção contra IDOR (Insecure Direct Object Reference):**

```typescript
// Em src/lib/tenant/guard.ts
export async function validateResourceAccess<T extends { companyId: string }>(
  resource: T | null,
  context: TenantContext,
  resourceName: string
): Promise<...>
```

Essa função garante que um usuário só acesse recursos da sua própria empresa, retornando 404 genérico (não 403) em caso de violação — prevenindo enumeração.

### Busca de Dados

Todas as queries são filtradas por `companyId` (exceto rotas admin). O padrão é:

```typescript
const where = {
  companyId: user.companyId,  // ← isolamento multi-tenant
  deletedAt: null,            // ← soft delete
};
```

Para listagens paginadas, usa-se o schema `paginationSchema` do Zod:

```typescript
const parsed = paginationSchema.safeParse({
  page: searchParams.get("page"),
  limit: searchParams.get("limit"),
  search: searchParams.get("search"),
  status: searchParams.get("status"),
});
```

---

## 5. Banco de Dados

### Schema Prisma

O banco de dados roda PostgreSQL 16 com Prisma ORM como camada de acesso. O schema completo está em `prisma/schema.prisma`.

### Modelos Principais

#### Company (Empresa)

Entidade central do multi-tenant. Todas as outras entidades pertencem a uma empresa.

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Identificador único |
| name | String | Nome da empresa |
| slug | String (unique) | Slug para URL |
| document | String? | CNPJ/CPF |
| phone | String? | Telefone |
| status | CompanyStatus | ACTIVE, SUSPENDED, CANCELLED |
| planType | PlanType | STARTER, PRO, BUSINESS |
| subscriptionStatus | SubscriptionStatus? | ACTIVE, PAST_DUE, CANCELED, TRIALING, INCOMPLETE |
| stripeCustomerId | String? (unique) | ID no Stripe |
| stripeSubscriptionId | String? (unique) | ID da assinatura Stripe |
| trialEndsAt | DateTime? | Fim do trial (14 dias) |
| aiContext | String? | Contexto adicional para IA |
| deletedAt | DateTime? | Soft delete |

#### User (Usuário)

| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Identificador único |
| email | String (unique) | Email de login |
| passwordHash | String? | Hash bcrypt da senha |
| role | UserRole | ADMIN, EMPLOYEE, FINANCIAL |
| twoFactorSecret | String? | Secret TOTP para 2FA |
| twoFactorEnabled | Boolean | Se 2FA está ativo |
| googleId | String? (unique) | ID do Google OAuth |
| microsoftId | String? (unique) | ID do Microsoft OAuth |
| companyId | String | FK para Company |

#### Session (Sessão)

| Campo | Tipo | Descrição |
|---|---|---|
| sessionToken | String (unique) | UUID da sessão |
| userId | String | FK para User |
| expiresAt | DateTime | Data de expiração (7 dias) |
| isRevoked | Boolean | Se foi revogada manualmente |
| ipAddress | String? | IP de criação |
| userAgent | String? | User-Agent do navegador |

#### Client (Cliente)

| Campo | Tipo | Descrição |
|---|---|---|
| name | String | Nome do cliente |
| phone | String | Telefone (usado como identificador para conversas) |
| email | String? | Email |
| lastService | String? | Último serviço realizado |
| companyId | String | FK para Company |
| deletedAt | DateTime? | Soft delete |

#### Conversation (Conversa)

| Campo | Tipo | Descrição |
|---|---|---|
| phone | String | Telefone do cliente |
| name | String? | Nome do cliente |
| status | String | OPEN (padrão) ou outros status |
| unread | Boolean | Se há mensagens não lidas |
| lastMessage | String? | Texto da última mensagem |
| lastMessageAt | DateTime? | Data da última mensagem |
| companyId | String | FK para Company |
| clientId | String? | FK para Client |

#### Message (Mensagem)

| Campo | Tipo | Descrição |
|---|---|---|
| role | String | "user" (cliente) ou "assistant" (IA/atendente) |
| content | String | Conteúdo da mensagem |
| type | String | "text" (padrão) |
| conversationId | String | FK para Conversation |

#### AIConfig (Configuração de IA)

| Campo | Tipo | Descrição |
|---|---|---|
| model | String | Modelo de IA (default: "gpt-4") |
| temperature | Float | Temperatura do modelo (default: 0.7) |
| maxTokens | Int | Máximo de tokens (default: 1024) |
| systemPrompt | String? | Prompt do sistema personalizado |
| personality | String? | Personalidade do assistente |
| instructions | String? | Instruções adicionais |
| companyId | String (unique) | FK para Company |

Relacionamentos: AIConfig → Service (N), AIConfig → FAQ (N)

#### CompanySettings (Configurações da Empresa)

| Campo | Tipo | Descrição |
|---|---|---|
| autoTransfer | Boolean | Transferência automática para humano (default: true) |
| autoReminders | Boolean | Lembretes automáticos (default: true) |
| requireConfirmation | Boolean | Confirmação de agendamento (default: true) |

#### Outros Modelos

- **LoginAttempt**: Registro de tentativas de login (para auditoria e rate limiting)
- **Appointment**: Agendamentos (date, time, service, status)
- **Upload**: Arquivos enviados (com validação de tipo MIME e extensão)
- **AuditLog**: Log de auditoria completo (action, entity, oldValues, newValues, ipAddress)
- **ApiKey**: Chaves de API para integração externa
- **WebhookEvent**: Eventos recebidos de webhooks (Stripe, WhatsApp)

### Relacionamentos Principais

```
Company 1──N User
Company 1──N Client
Company 1──N Appointment
Company 1──N Conversation
Company 1──1 AIConfig
Company 1──1 CompanySettings
Company 1──N Upload
Company 1──N AuditLog
Company 1──N ApiKey

User 1──N Session
User 1──N LoginAttempt
User 1──N AuditLog

Conversation 1──N Message
Conversation N──1 Client

AIConfig 1──N Service
AIConfig 1──N FAQ

Appointment N──1 Client
```

### Regras de Negócio Percebidas

- **Soft delete**: Todos os modelos principais usam `deletedAt` — dados nunca são removidos fisicamente (exceto por admin).
- **Isolamento**: Todas as queries são filtradas por `companyId` — um usuário nunca vê dados de outra empresa.
- **Trial**: Novas empresas recebem 14 dias de trial gratuito.
- **Planos**: STARTER (3 usuários, 100 clientes), PRO (10 usuários, 1000 clientes), BUSINESS (ilimitado).
- **2FA**: Opcional, via TOTP (Google Authenticator, Authy).
- **RBAC**: Hierarquia simples — ADMIN tem acesso global, EMPLOYEE e FINANCIAL têm acesso limitado ao domínio.
- **Índices otimizados**: Migrations SQL incluem índices compostos para os padrões de query mais comuns (ex: `idx_clients_company_search`, `idx_conversations_company_unread`).
- **RLS**: Políticas de segurança no banco via PostgreSQL Row-Level Security para segurança em profundidade.

---

## 6. Sistema de Conversas

### Visão Geral

O sistema de conversas é o núcleo do produto. Ele permite que clientes (via WhatsApp) e atendentes humanos troquem mensagens, com a IA atuando como primeiro ponto de contato.

### Criação de uma Conversa

Uma conversa é criada de duas formas:

1. **Via Webhook WhatsApp**: Quando uma mensagem chega via webhook, o sistema busca uma conversa existente pelo telefone. Se não existir, uma nova é criada automaticamente com status `OPEN`.
2. **Via Atendente**: O atendente pode iniciar uma conversa manualmente pelo dashboard.

### Armazenamento de Mensagens

As mensagens são armazenadas na tabela `Message` com os campos:

| Campo | Valor | Descrição |
|---|---|---|
| role | `"user"` | Mensagem do cliente |
| role | `"assistant"` | Resposta da IA ou do atendente |
| type | `"text"` | Tipo de conteúdo (apenas texto implementado) |
| content | string | Corpo da mensagem |

Cada mensagem pertence a uma `Conversation`, que por sua vez pertence a uma `Company`.

### Diferença entre Cliente e Atendente

- **Cliente**: Envia mensagens com role `"user"` (vindo do WhatsApp)
- **IA/Atendente**: Envia mensagens com role `"assistant"`

A IA atua como atendente virtual. Não há distinção visual entre resposta da IA e resposta humana no banco — ambas usam `role: "assistant"`.

### Fluxo de Envio de Mensagem

```
1. POST /api/conversations/[id]/messages
   ├── Verifica autenticação do usuário (getCurrentUser)
   ├── Carrega contexto (context-loader): conversa + empresa + aiConfig + knownName + handledById + phone
   ├── Valida o corpo da mensagem
   │
   ├── Conversa assumida por humano (handledById preenchido)?
   │   └── SIM: salva a mensagem (role: "assistant") e reply = conteúdo digitado (sem IA)
   │   └── NÃO: chama IA:
   │       └── generateAIResponse({ conversationId, message, company, knownName })
   │           └── conversation-manager.processMessage()
   │               ├── Salva mensagem do usuário (role: "user")
   │               ├── Carrega o estado atual da conversa (coluna `state`)
   │               ├── Detecta intenção (detectIntent + fallback LLM)
   │               ├── Extrai slots (serviço, data, hora, nome)
   │               ├── Computa o próximo passo (flows/appointment)
   │               ├── Monta prompt dinâmico (prompt-builder: estado + contexto + últimas 3 msg)
   │               ├── Chama provider.chat() → Ollama (qwen3:8b)
   │               ├── Valida resposta (guardrails: lixo + informação inventada)
   │               ├── Se confirmado: persiste Appointment (appointment-date resolve a data)
   │               ├── Salva resposta da IA (role: "assistant")
   │               └── Salva o novo estado
   │
   ├── Atualiza lastMessage/lastMessageAt/unread:false
   ├── Se a conversa tem phone: deliverWhatsAppMessage(companyId, phone, reply)
   │     → busca WhatsAppConfig CONNECTED da empresa, descriptografa o token e
   │       POST graph.facebook.com/v20.0/{phone_number_id}/messages
   ├── Publica eventos "message" + "conversation" (src/lib/realtime → SSE)
   └── Retorna a resposta (com flag `handled`) ao frontend
```

### Tempo real (SSE) e Assunção manual (Takeover)

A UI do dashboard sincroniza conversas e mensagens em tempo real:

- **`GET /api/conversations/events`** abre um stream Server-Sent Events autenticado. Usa um `EventEmitter` em memória (`src/lib/realtime/index.ts`) com `publish(companyId, type, data)` / `subscribe(companyId, listener)`. Eventos nomeados: `ready`, `heartbeat` (15s), `message` (`{ conversationId, role, content }`), `conversation` (`{ id }`).
- Qualquer escrita relevante (webhook, envio de mensagem, takeover, release, marcação de lida) publica eventos **filtrados por empresa** — cliente de A não recebe evento de B.
- A página (`src/app/dashboard/conversations/page.tsx`) assina o SSE e, como fallback (última linha de defesa para deploy multi-instância), faz polling a cada 20s.

**Assunção manual (takeover)** — campo `Conversation.handledById` (relação com `User`) + `handledAt`:

- **`POST /api/conversations/[id]/takeover`** — um atendente assume a conversa (`handledById = user.id`).
- **`POST /api/conversations/[id]/release`** — devolve a conversa ao fluxo automático (`handledById = null`).
- Enquanto assumida:
  - O **webhook** salva a mensagem recebida do cliente (role `user`), atualiza `lastMessage`/`unread` e **não chama a IA nem envia resposta** (`processWhatsAppWebhook` retorna `handled`).
  - O **POST /messages** do painel responde **direto ao WhatsApp** sem passar pela IA.
- A lista (`GET /api/conversations`) expõe `handledBy: { id, name } | null` e `handledAt`; a UI mostra badge "Atendida por X" e os botões **Assumir**/**Liberar**.

### Fluxo do Webhook WhatsApp (entrada real de clientes)

Cada empresa conecta o **próprio WhatsApp Business** (Multi-tenant). Os clientes interagem pelo WhatsApp — o AtendeAI recebe a mensagem via webhook, descobre a empresa pelo `phone_number_id`, processa com o mesmo ConversationManager e responde de volta pela Meta Cloud API usando o token da própria empresa:

```
1. Meta envia POST /api/webhooks/whatsapp (payload com entry[].changes[].value)
   ├── Valida assinatura HMAC (verifyMetaSignature com META_APP_SECRET; exige prefixo sha256=)
   ├── Loga WEBHOOK_RECEIVED e salva WebhookEvent (status: received)
   │
   └── processWhatsAppWebhook (src/lib/whatsapp/webhook.ts)
       ├── Extrai mensagens de texto (ignora statuses/delivery receipts e mídia)
       ├── Descobre a empresa por WhatsAppConfig.phoneNumberId (metadata.phone_number_id, status CONNECTED)
       ├── Get-or-create Client por (companyId, phone) via findOrCreateWhatsAppClient (client.ts)
       │     profile.name → Client.whatsappName; knownName = profile.name válido ou null (needsName)
       ├── Busca Conversation aberta por (companyId, clientId) — fallback por phone; cria se não existir
       ├── Conversa assumida por humano (handledById)? SIM → salva a mensagem (role user),
       │     atualiza lastMessage/unread, publica eventos e pula (não aciona IA)
       ├── loadConversationContext + conversation-manager.processMessage()
       ├── Descriptografa accessToken da config (encryption.ts) e
       │     sendWhatsAppMessage → POST graph.facebook.com/v20.0/{phone_number_id}/messages
       └── Atualiza lastMessage/lastMessageAt/unread e publica eventos (message + conversation)
    └── WebhookEvent vira "processed" (ou "failed") e retorna 200 sempre
```

O `WhatsAppConfig` (1:1 por empresa) guarda `phoneNumberId`, `businessAccountId`, `phoneNumber`, `status` e o `accessToken` **criptografado** (`aes-256-gcm`). Conexão/desconexão via `POST /api/settings/whatsapp/connect` e `/disconnect`; status via `GET /api/settings/whatsapp/status` (nunca expõe o token). O `.env` só contém credenciais da aplicação Meta (`META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`).

Agendamentos confirmados no WhatsApp persistem via `persistAppointment`, agora vinculados ao `Client` real (nome + telefone) porque a conversa já possui `clientId`.

### Integração com IA

O fluxo de IA dentro de uma conversa:

1. O usuário envia uma mensagem via API.
2. O `context-loader` busca a conversa, a empresa (com `aiConfig`, `services`, `faq`) e o nome do cliente (`knownName`).
3. O `conversation-manager` assume o controle do diálogo: o código decide o fluxo (state machine + slot filling) e a IA apenas gera texto.
4. O `provider.ts` faz a chamada HTTP ao Ollama (`qwen3:8b`).
5. A resposta passa pelos guardrails (lixo / informação inventada).
6. Ao confirmar um agendamento, o `Appointment` é persistido no banco.
7. A resposta da IA é salva automaticamente como mensagem do assistente, junto com o novo estado da conversa.

---

## 7. Arquitetura de Inteligência Artificial

### Como a IA é Chamada

A chamada à IA segue uma arquitetura em camadas onde o **código controla o fluxo** da conversa e a IA apenas gera texto:

```
┌─────────────────────────────────────┐
│     Componente / API Route          │
│  (quem chama)                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  lib/ai/assistant.ts (fachada)      │
│  - generateAIResponse(input)        │
│  - Delega para conversation-manager │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  lib/ai/conversation-manager.ts     │
│  - processMessage()                 │
│  - Detecta intenção + slots         │
│  - Computa próximo passo (state)    │
│  - Monta prompt + chama provider    │
│  - Guardrails + persiste estado     │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌──────────────────┐ ┌──────────────────┐
│ módulos puros    │ │ provider.ts      │
│ intention-       │ │ - payload Ollama │
│ detector, slot-  │ │ - fetch HTTP     │
│ extractor,       │ │ qwen3:8b         │
│ prompt-builder,  │ └────────┬─────────┘
│ flows/appointment│          ▼
│ appointment-date │   ┌──────────────┐
│ (testáveis)      │   │ Ollama local │
└──────────────────┘   └──────────────┘
```

### Providers Existentes

| Provider | Status | Arquivo | Modelo Padrão |
|---|---|---|---|
| Ollama | Implementado | `lib/ai/provider.ts` (fetch HTTP direto) | qwen3:8b |

A chamada ao modelo é feita diretamente via `fetch` para `http://localhost:11434/api/chat` no `provider.ts`. O `assistant.ts` é a fachada pública; `conversation-manager.ts` orquestra o diálogo.

### Separação entre Provider e Lógica de Negócio

A separação é limpa: módulos puros (`intention-detector`, `slot-extractor`, `prompt-builder`, `flows/appointment`, `appointment-date`) cuidam da *lógica de negócio e do diálogo*; `provider.ts` cuida da *comunicação com o modelo*. Isso permite que:

- O fluxo da conversa (state machine + slot filling) seja determinístico e testado em `src/__tests__/ai/`
- A IA não controle a conversa: ela só responde ao objetivo derivado do estado atual
- O modelo seja trocado sem alterar a lógica de negócio (basta alterar `provider.ts`)
- Dependências sejam injetáveis (`ConversationManagerDeps`), facilitando testes com LLM fake

### Contexto Enviado para IA

O prompt é montado dinamicamente pelo `prompt-builder.ts` com base no **estado da conversa** e nos dados da empresa:

```
Você é o atendente virtual da empresa "{company.name}".

ESTADO DA CONVERSA:
  Intenção atual: {appointment | service | faq | human | none | other}
  Passo atual: {waiting_service | waiting_date | waiting_time | waiting_name | confirming | finished}
  Slots já coletados: serviço, data, hora, nome
  Objetivo atual: {perguntar serviço | perguntar data | perguntar hora | perguntar nome | confirmar | finalizar}

DADOS DA EMPRESA:
  Nome: {company.name}
  Telefone/Endereço/Horário (quando cadastrados)
  Serviços: lista com nome e preço (services)
  FAQ: perguntas e respostas cadastradas
  Instruções e personalidade (aiConfig)

ÚLTIMAS 3 MENSAGENS (histórico curto)
```

Todos os campos do `AIConfig` (`personality`, `instructions`, `services`, `faq`) são utilizados. O objetivo do prompt muda conforme o passo do estado — a IA nunca decide o próximo passo sozinha.

### Histórico Enviado

Apenas as **últimas 3 mensagens** da conversa são enviadas, em ordem cronológica. Quando o histórico conflita com o estado, o **estado prevalece** — o estado salvo na coluna `state` (Json) da `Conversation` é a memória primária do diálogo.

### Como Adicionar Novos Modelos Futuramente

1. Alterar `lib/ai/provider.ts` (função `chat(messages)`) para o novo endpoint/modelo.
2. Os módulos de negócio e a fachada não precisam de mudanças, pois dependem apenas da interface `LLMMessage`.

---

## 8. Frontend

### Estrutura de Páginas

O frontend usa o **App Router** do Next.js 15, com `page.tsx` em cada diretório representando uma rota.

#### Páginas Públicas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page com todas as seções (Hero, Features, Plans, FAQ, etc.) |
| `/login` | `src/app/login/page.tsx` | Formulário de login |
| `/register` | `src/app/register/page.tsx` | Formulário de cadastro com empresa |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Solicitação de redefinição de senha |
| `/terms` | `src/app/terms/page.tsx` | Termos de uso |
| `/privacy` | `src/app/privacy/page.tsx` | Política de privacidade |

#### Páginas Protegidas (Dashboard)

| Rota | Arquivo | Descrição |
|---|---|---|
| `/dashboard` | `src/app/dashboard/page.tsx` | Dashboard com KPIs, conversas recentes, agenda do dia |
| `/dashboard/conversations` | `src/app/dashboard/conversations/page.tsx` | Sistema de conversas completo (chat com IA) |
| `/dashboard/schedule` | `src/app/dashboard/schedule/page.tsx` | Agenda com calendário mensal |
| `/dashboard/clients` | `src/app/dashboard/clients/page.tsx` | CRUD de clientes |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | Configurações da empresa + IA |
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | Perfil do usuário |
| `/dashboard/subscription` | `src/app/dashboard/subscription/page.tsx` | Gerenciamento de assinatura |

#### Páginas Administrativas

| Rota | Arquivo | Descrição |
|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | Dashboard admin com estatísticas do sistema |
| `/admin/companies` | `src/app/admin/companies/page.tsx` | Gerenciamento de empresas |
| `/admin/logs` | `src/app/admin/logs/page.tsx` | Logs do sistema |
| `/admin/audit` | `src/app/admin/audit/page.tsx` | Auditoria detalhada |

### Componentes Importantes

#### Providers

`src/components/Providers.tsx` — Provider raiz que envolve toda a aplicação:

```
AuthProvider
  └── ToastProvider
```

#### AuthGuard

`src/components/dashboard/AuthGuard.tsx` — Protege as rotas do dashboard:

- Monitora o estado de autenticação via `useAuth()`
- Redireciona para `/login` se não autenticado
- Mostra loading spinner enquanto verifica

#### Sidebar

`src/components/dashboard/Sidebar.tsx` — Navegação principal:

- Itens: Dashboard, Conversas, Agenda, Clientes, Configurações, Assinatura, Perfil
- Link para Admin (visível apenas para ADMIN)
- Botão de logout
- Responsivo (sidebar collapsable em desktop, drawer em mobile)

#### ConversationLayout

`src/components/conversations/ConversationLayout.tsx` — Layout de 3 colunas:

- Sidebar (lista de conversas)
- Chat (mensagens + input)
- Details (detalhes do cliente)

#### Landing Page Components

Componentes em `src/components/landing/`:

| Componente | Descrição |
|---|---|
| Navbar | Navegação superior |
| Hero | Seção principal com CTA |
| HowItWorks | Explicação do funcionamento |
| Features | Funcionalidades |
| DashboardPreview | Preview do dashboard |
| Benefits | Benefícios |
| Niches | Nichos de mercado |
| Plans | Planos e preços |
| Testimonials | Depoimentos |
| FAQ | Perguntas frequentes |
| CTA | Call to action final |
| Footer | Rodapé |

#### UI Primitives

Componentes em `src/components/ui/` construídos com Radix UI + Tailwind:

Button, Input, Card, Badge, Modal (Dialog), Select, Switch, Tabs, Accordion, Avatar, Label, Separator, ScrollArea, Toast

### Fluxo de Navegação

```
Landing Page (/)
      │
      ├── /login ──────────> /dashboard (após login)
      │
      ├── /register ───────> /dashboard (após cadastro)
      │
      └── /forgot-password ──> /login (após reset)

Dashboard (/dashboard)
      │
      ├── /dashboard/conversations
      ├── /dashboard/schedule
      ├── /dashboard/clients
      ├── /dashboard/settings
      ├── /dashboard/profile
      ├── /dashboard/subscription
      └── /admin (se role === ADMIN)
```

### Comunicação com APIs

Todo o frontend se comunica com as APIs via `fetch` nativo do navegador com `credentials: "include"` para enviar os cookies de autenticação automaticamente.

O `AuthContext` usa um helper `apiFetch()` que:

1. Faz a requisição com `credentials: "include"`
2. Parseia a resposta JSON
3. Verifica `success: true`
4. Lança erro se a API retornar erro

Não há biblioteca de cliente HTTP (como axios) — o projeto usa fetch nativo.

---

## 9. Segurança

### Medidas Implementadas

#### Autenticação

- **JWT Access Token**: 15 minutos de validade, armazenado em cookie HttpOnly.
- **JWT Refresh Token**: 7 dias de validade, armazenado em cookie HttpOnly.
- **Sessão no banco**: UUID armazenado em cookie `session_token`, com suporte a revogação individual e em lote.
- **bcrypt**: Senhas com hash de 12 rounds de salt.
- **2FA (TOTP)**: Código de 6 dígitos via Google Authenticator/Authy, com `window: 1` para tolerância a pequenas variações de tempo.
- **Rate Limit de Login**: 5 tentativas a cada 15 minutos por IP.

#### Headers HTTP

Definidos no middleware (Edge Runtime) e no `next.config.ts`:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
```

#### Rate Limiting

Sistema in-memory implementado em `src/lib/rate-limit/index.ts`:

| Tipo | Janela | Máximo | Chave |
|---|---|---|---|
| Login | 15 min | 5 | IP |
| API padrão | 1 min | 30 | companyId + IP |
| API paginada | 1 min | 60 | companyId + IP |

#### Proteções

| Ameaça | Mitigação |
|---|---|
| SQL Injection | Prisma ORM (queries parametrizadas) |
| XSS | CSP + sanitização de HTML (`sanitizeHtml`) |
| CSRF | Cookies SameSite=Lax + token CSRF opcional |
| Brute Force | Rate limiting de login |
| Enumeração de usuários | Mensagens genéricas "Email ou senha inválidos" + `checkEnumerationRate` |
| IDOR | `validateResourceAccess()` verifica companyId, retorna 404 genérico |
| Replay Attack | Nonce com timestamp + expiração de 60s |
| Upload malicioso | Validação MIME + extensão + bloqueio de executáveis + renomeação UUID |
| Dados sensíveis | AES-256-GCM para dados sensíveis em repouso + sanitização em logs e IA |

#### Criptografia

- **Senhas**: bcrypt com 12 rounds de salt.
- **Dados sensíveis**: AES-256-GCM via `crypto.createCipheriv`.
- **Tokens**: SHA-256 para hash de tokens de API.
- **Signed URLs**: HMAC-SHA256 para URLs de arquivos com expiração.

#### Auditoria

Todas as ações importantes são registradas na tabela `AuditLog` com:
- Action (ex: LOGIN_SUCCESS, LOGIN_FAILURE, AI_CONFIG_CHANGE)
- Entity e EntityId
- OldValues e NewValues (JSON)
- IP Address e User Agent
- CompanyId e UserId

### Isolamento entre Empresas

1. **Schema Prisma**: `companyId` em todas as tabelas de dados.
2. **Queries**: Toda query de lista inclui `WHERE companyId = ?`.
3. **Guards**: `resolveTenant()` verifica papel ativo, empresa ativa, plano pode acessar funcionalidade.
4. **RLS**: PostgreSQL Row-Level Security com políticas por `company_id` extraído do JWT.
5. **Soft Delete**: `deletedAt` impede acesso a dados "removidos" sem afetar integridade.

### Possíveis Vulnerabilidades Identificadas

- **Rate limiting in-memory**: Não escala horizontalmente — se houver múltiplas instâncias, cada uma tem seu próprio contador. Idealmente deveria usar Redis.
- **Fallback JWT**: `process.env.JWT_SECRET || "fallback-secret"` — em desenvolvimento pode usar um secret padrão, mas em produção sempre deve ser configurado.
- **Fallback Encryption**: `process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"` — mesmo risco.
- **Helmet não utilizado**: A dependência `helmet` está no `package.json` mas não é usada — os headers de segurança são definidos manualmente no middleware e next.config.
- **console.log em produção**: Vários `console.log` espalhados no código (session.ts, AuthContext.tsx) que vazam informações em produção.
- **Importação dinâmica do Stripe/Sentry**: `require("stripe")` sem tipagem e `Function('return import("@sentry/nextjs")')()` — gambiarras que mascaram problemas de dependência.

---

## 10. Dependências Importantes

### Produção

| Pacote | Motivo |
|---|---|
| `next` | Framework principal — App Router, SSR, API Routes, otimizações |
| `react` / `react-dom` | Biblioteca de UI |
| `@prisma/client` + `@prisma/adapter-pg` | ORM type-safe para PostgreSQL |
| `prisma` | CLI para migrations e schema management |
| `pg` | Driver nativo PostgreSQL |
| `bcryptjs` | Hash de senhas (sem dependências nativas) |
| `jsonwebtoken` | Criação e verificação de JWT |
| `jose` | Verificação JWT no Edge Runtime (middleware) |
| `speakeasy` | Geração/verificação TOTP para 2FA |
| `stripe` | SDK de pagamentos Stripe |
| `openai` | SDK da API OpenAI |
| `ollama` | SDK para chamadas ao Ollama |
| `zod` | Validação de schemas em runtime (compartilhado) |
| `framer-motion` | Animações React declarativas |
| `tailwindcss` | Framework CSS utilitário |
| `@radix-ui/*` | Primitivos UI acessíveis e headless |
| `lucide-react` | Biblioteca de ícones |
| `clsx` + `tailwind-merge` | Combinação de classes CSS |
| `class-variance-authority` | Variantes de componentes |
| `next-themes` | Suporte a tema dark/light |
| `sharp` | Processamento de imagens (Next.js otimização) |
| `multer` | Upload de arquivos |
| `helmet` | Middleware de segurança HTTP (instalado mas não integrado) |
| `cookie` | Manipulação de cookies |
| `cors` | Middleware CORS |
| `qrcode` | Geração de QR Code (para 2FA setup) |
| `uuid` | Geração de UUIDs |

### Desenvolvimento

| Pacote | Motivo |
|---|---|
| `typescript` | Type safety em todo o projeto |
| `vitest` | Framework de testes unitários |
| `@vitest/coverage-v8` | Cobertura de testes |
| `tsx` | Execução de TypeScript diretamente (scripts) |
| `prettier` | Formatação de código |
| `eslint-plugin-prettier` | Integração ESLint + Prettier |
| `@tailwindcss/postcss` | Plugin PostCSS do Tailwind |
| `@types/*` | Tipos para bibliotecas sem tipos nativos |

---

## 11. Estado Atual do Projeto

### Implementado (Funcionalidades Prontas)

- **Landing Page**: Completa com todas as seções (Hero, Features, Plans, FAQ, etc.)
- **Autenticação**: Login, registro, 2FA (setup/verify/disable), logout, refresh token, sessões com revogação
- **Recuperação de Senha**: Fluxo forgot-password e reset-password (endpoints implementados, integração com email pendente)
- **Dashboard**: Página principal com KPIs, conversas recentes, agenda do dia, gráfico de atendimentos
- **Conversas**: Sistema de chat completo com sidebar de conversas, envio de mensagens, resposta da IA, detalhes do cliente
- **IA com Ollama**: Integração funcional com Ollama (modelo qwen3:8b) — Conversation Manager com state machine, detecção de intenção, extração de slots, guardrails e persistência de agendamentos
- **Agenda**: Calendário mensal, criação de agendamentos, status (confirmado/pendente), persistência local
- **Clientes**: CRUD completo com busca, filtro por status, persistência local
- **Configurações**: Edição de dados da empresa, serviços, mensagens, FAQ, configs da IA
- **Admin**: Dashboard com estatísticas (empresas, usuários, MRR), gestão de empresas, logs, auditoria
- **Upload de Arquivos**: Validação MIME + extensão, bloqueio de executáveis, renomeação UUID
- **Webhooks**: Stripe (checkout, subscription, invoice) e WhatsApp (validação de assinatura)
- **Health Check**: Endpoint completo verificando banco, OpenAI, Stripe, SMTP, Storage
- **Estrutura de Segurança**: CSP, HSTS, rate limiting, circuit breaker, retry, nonce, sanitização, criptografia
- **CI/CD**: GitHub Actions com lint, typecheck, build, test, docker, deploy
- **Docker**: Dockerfile multi-stage + docker-compose com PostgreSQL
- **Cloudflare**: Edge worker para segurança e cache
- **Seed**: Script de seed com admin padrão

### Em Desenvolvimento (Funcionalidades Parciais)

- **Integração OpenAI**: Provider configurado via env vars e testado no health check, mas sem implementação no switch do provider.ts
- **Stripe/Assinaturas**: Webhook funcional, subscription route implementada, mas frontend de assinatura é página estática
- **Email/SMTP**: Configurado via env vars e verificado no health check, mas sem implementação de envio (notificações, reset de senha)
- **OAuth Google/Microsoft**: Configurado via env vars, schema Prisma com googleId/microsoftId, mas sem rotas de autenticação OAuth
- **Supabase**: Client e funções de storage/auth implementados, mas integração é opcional (desativada se não configurado)
- **Sentry**: Código de integração presente, mas usa importação dinâmica (`Function('return import...')`)
- **Persistência de dados**: Clientes e agendamentos usam `localStorage` no navegador (dados mockados) — as APIs estão prontas mas o frontend não consome as rotas reais

### Pendências (Melhorias Necessárias)

- **Testes**: Cobertura atual baixa (~30% threshold). Poucos testes unitários e nenhum teste de integração ou E2E.
- **Logs de console**: `console.log` espalhado pelo código em produção (AuthContext, session.ts, login route).
- **Helmet**: Dependência instalada mas não utilizada — headers de segurança são manuais.
- **Rate Limiting In-Memory**: Não escala horizontalmente — necessidade de Redis.
- **Fallback Secrets**: `|| "fallback-secret"` em JWT e ENCRYPTION_KEY — risco de segurança.
- **Email Service**: Funcionalidade de envio de email não implementada (reset de senha, notificações).
- **Streaming de IA**: Respostas da IA não são streamadas — UX aguarda resposta completa.
- **Cache**: Nenhum sistema de cache implementado (Redis ou similar).
- **Internacionalização**: Apenas português do Brasil.
- **Acessibilidade**: Componentes Radix UI são acessíveis, mas sem auditoria formal.

---

## 12. Recomendações Técnicas

### Melhorias Arquiteturais

1. **Separar backend do frontend**: Embora o monólito Next.js funcione bem para MVPs, em escala o backend deve ser separado em uma API dedicada (Fastify, Express, ou Hono) para permitir escalabilidade independente.

2. **Camada de Serviço**: Criar uma camada de serviço (`src/services/`) entre as API Routes e o Prisma. Atualmente a lógica de negócio está misturada nos handlers das rotas.

3. **Repository Pattern**: Abstrair o acesso a dados com repositórios para facilitar testes e manutenção.

4. **Event-Driven**: Implementar filas (Redis/Bull ou RabbitMQ) para processamento assíncrono de mensagens WhatsApp, envio de emails e notificações.

### Escalabilidade

1. **Redis**: Substituir rate limiting in-memory por Redis. Usar Redis também para cache de sessões, queries frequentes e fila de mensagens.

2. **Cache de Queries**: Implementar cache para dados de configuração da empresa (que mudam raramente) — reduziria consultas ao banco em cada mensagem.

3. **Paginação Real**: Clientes e agendamentos no frontend precisam consumir as APIs reais com paginação — atualmente usam localStorage.

4. **Streaming de IA**: Implementar resposta em streaming (Server-Sent Events ou WebSockets) para melhor UX.

### Segurança

1. **Remover fallbacks de segurança**: Garantir que `JWT_SECRET` e `ENCRYPTION_KEY` sejam obrigatórios em produção, sem fallback.

2. **Rate Limiting Persistente**: Migrar para Redis para suportar múltiplas instâncias.

3. **Helmet**: Integrar helmet como middleware de segurança em vez de headers manuais.

4. **Sanitização de Logs**: Remover `console.log` do código de produção ou substituir pelo logger estruturado.

5. **Auditoria de Pacotes**: Revisar dependências não utilizadas (helmet, cors, multer — que pode ser substituído pelo File API nativo).

### Performance

1. **React Server Components**: Migrar componentes de dashboard para RSC onde possível para reduzir JavaScript do cliente.

2. **Otimização de Imagens**: Usar Next.js Image Optimization para uploads.

3. **Lazy Loading**: Carregar componentes de conversas e admin sob demanda.

4. **Indexação**: As migrations RLS já criam índices compostos — verificar se todas as queries são cobertas.

### Organização do Código

1. **Resolver ambiguidades no schema**: `AIConfig` tem campos duplicados com `Company` (welcomeMessage, absenceMessage existem em ambas as tabelas).

2. **Padronizar tratamento de erros**: Algumas rotas usam try/catch genérico, outras têm tratamento específico.

3. **Tipos compartilhados**: Mover tipos usados por várias partes (User, Client, etc.) para `src/types/`.

4. **Remover código não utilizado**: `ApiClient`, `csrf.ts`, `nonce.ts` — verificar se estão sendo usados.

5. **Resolver importações dinâmicas**: Substituir `require("stripe")` e `Function('return import("@sentry/nextjs")')()` por imports estáticos ou ESM dinâmico adequado.

---

> Este documento foi gerado com base na análise do código-fonte do projeto em Julho de 2026.
> Para contribuir, mantenha este arquivo atualizado conforme a arquitetura evoluir.
