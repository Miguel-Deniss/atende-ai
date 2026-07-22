# Arquitetura do Sistema

## Stack

```
Frontend: Next.js 15 (React 19) + Tailwind CSS 4 + Radix UI
Backend:  Next.js API Routes + Prisma ORM
Database: PostgreSQL (via Prisma)
Auth:     JWT + Session (cookies httpOnly)
Edge:     Cloudflare Workers (opcional)
Storage:  Local filesystem → Supabase Storage (opcional)
```

## Diagrama de Arquitetura

```
                    Cloudflare (CDN + WAF + DDoS)
                           │
                    ┌──────▼──────┐
                    │  Next.js 15 │
                    │  (Server)   │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
        API Routes    Pages/UI     Middleware
              │            │            │
              ▼            │            ▼
         ┌────────┐        │      Auth + Session
         │ Prisma │        │      + Headers
         │  ORM   │        │
         └──┬─────┘        │
            ▼              │
       ┌────────┐          │
       │Postgres│          │
       │  + RLS │          │
       └────────┘          │
                           │
            ┌──────────────┘
            ▼
      ┌──────────┐
      │ Supabase │ (optional)
      │ Storage  │
      │ Auth     │
      └──────────┘
```

## Camadas de Isolamento Multi-Tenant

```
Requisição → DNS (Cloudflare)
  → Middleware (valida token, headers)
    → Dashboard Layout (AuthGuard)
      → Page (fetch dados)
        → API Route (getCurrentUser)
          → resolveTenant (role + plano)
            → query Prisma (WHERE companyId = ?)
              → PostgreSQL (RLS opcional)
```

## Fluxo de Autenticação

```
1. Usuário faz login → POST /api/auth/login
2. Servidor valida credenciais + 2FA (se ativo)
3. Servidor cria Session no banco
4. Servidor seta cookies:
   - session_token (httpOnly, 7d)
   - access_token (httpOnly, 15min)
   - refresh_token (httpOnly, 7d, path=/api/auth)
5. Cliente redireciona para dashboard
6. Dashboard → AuthContext → GET /api/auth/me → valida sessão
7. Access token expirado → POST /api/auth/refresh → novo access token
```

## Estrutura de Diretórios

```
src/
├── app/
│   ├── api/         → API Routes (auth, clients, schedule, etc.)
│   ├── dashboard/   → Dashboard pages (protegidas)
│   ├── admin/       → Admin pages (protegidas, role=ADMIN)
│   ├── login/       → Login page
│   ├── register/    → Register page
│   └── ...          → Landing, privacy, terms
├── components/
│   ├── dashboard/   → AuthGuard, Sidebar
│   ├── landing/     → Landing page components
│   └── ui/          → Radix UI wrappers
├── contexts/        → AuthContext
├── hooks/           → useDebounce, useLocalStorage
└── lib/
    ├── api/         → API client (fetch wrapper com retry)
    ├── auth/        → JWT, Session, Password, API Response
    ├── db/          → Prisma client singleton
    ├── logger/      → Structured logger + Audit logger
    ├── monitoring/  → Sentry wrapper
    ├── rate-limit/  → In-memory rate limiter
    ├── resilience/  → Circuit breaker, retry, timeout
    ├── security/    → CSRF, Encryption, Sanitize, Nonce, Enumeration
    ├── storage/     → File access validation, signed URLs
    ├── supabase/    → Supabase client, auth sync, storage
    ├── tenant/      → Tenant guard, plan limits, company access
    ├── upload/      → File upload handling
    └── validators/  → Zod schemas
```

## Princípios de Design

1. **Defense in Depth**: Múltiplas camadas de segurança (app + banco + infra)
2. **Fail Closed**: Se algo falhar, negue acesso
3. **Least Privilege**: Cada usuário tem acesso mínimo necessário
4. **Separation of Concerns**: Código organizado por domínio em `lib/`
5. **Defensive Programming**: Nunca confie em input do cliente
6. **Observability**: Logs estruturados + health check + métricas
