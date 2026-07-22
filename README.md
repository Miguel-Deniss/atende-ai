# AtendeAI — Plataforma de Atendimento com IA para WhatsApp

> **Status:** MVP — Pronto para produção  
> **Stack:** Next.js 15 • TypeScript • Prisma 7 • PostgreSQL • Tailwind CSS 4  
> **Infra:** Docker • GitHub Actions • Multi-tenant SaaS

---

## Sumário

- [Arquitetura](#arquitetura)
- [Stack Tecnológico](#stack-tecnológico)
- [Começando](#começando)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [API](#api)
- [Segurança](#segurança)
- [Multi-Tenant](#multi-tenant)
- [RBAC](#rbac)
- [Deploy](#deploy)
- [CI/CD](#cicd)
- [Monitoramento](#monitoramento)
- [Backup](#backup)
- [Contribuição](#contribuição)

---

## Arquitetura

```
┌─────────────────────────────────────┐
│            Next.js 15 App            │
│  ┌─────────┐  ┌──────────────────┐  │
│  │  Pages  │  │   API Routes     │  │
│  │ - Admin │  │ - /api/auth/*    │  │
│  │ - Dash  │  │ - /api/clients/* │  │
│  │ - Login │  │ - /api/schedule  │  │
│  └────┬────┘  │ - /api/admin/*   │  │
│       │       │ - /api/webhooks  │  │
│       │       └────────┬─────────┘  │
│       │                │            │
│  ┌────┴────────────────┴────────┐   │
│  │       Middleware             │   │
│  │  (Auth + Headers + Rate)    │   │
│  └─────────────┬───────────────┘   │
└────────────────┼───────────────────┘
                 │
    ┌────────────┴────────────┐
    │     Prisma ORM          │
    │  (PostgreSQL Adapter)   │
    └────────────┬────────────┘
                 │
    ┌────────────┴────────────┐
    │      PostgreSQL 16      │
    │    Multi-tenant Data    │
    └─────────────────────────┘
```

### Princípios

- **Clean Architecture** — Separação clara entre camadas (API → Service → DB)
- **Multi-tenant** — Isolamento por `companyId` em todas as queries
- **Stateless API** — Autenticação via JWT + HttpOnly cookies
- **Segurança por Design** — OWASP Top 10 mitigado
- **Observabilidade** — Logs estruturados + Health checks + Sentry

---

## Stack Tecnológico

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15.3 | Framework React (App Router) |
| TypeScript | 5.9 | Tipagem estática |
| Tailwind CSS | 4.1 | Estilização utilitária |
| Framer Motion | 12.6 | Animações |
| Radix UI | — | Primitivos acessíveis |
| Lucide React | — | Ícones |
| Zod | 4.4 | Validação runtime |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Prisma | 7.9 | ORM + Migrations |
| PostgreSQL | 16 | Banco de dados |
| bcryptjs | 3.0 | Hash de senhas (12 rounds) |
| jsonwebtoken | 9.0 | JWT access/refresh tokens |
| Speakeasy | 2.0 | TOTP 2FA |
| Stripe | 22.3 | Pagamentos |

### Infraestrutura
| Tecnologia | Uso |
|---|---|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| GitHub Actions | CI/CD |
| Sentry | Monitoramento de erros |

---

## Começando

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- Docker (opcional)

### 1. Clone e instale

```bash
git clone https://github.com/your-org/atende-ai.git
cd atende-ai
npm install
```

### 2. Configure o banco

```bash
cp .env.example .env
# Edite .env com suas credenciais
npm run db:push
npm run db:seed
```

### 3. Inicie

```bash
npm run dev
# Acesse http://localhost:3000
```

### Credenciais de desenvolvimento

```
Admin: admin@atendeai.com / Admin123!
```

---

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Conexão PostgreSQL |
| `JWT_SECRET` | ✅ | Chave para assinatura JWT (64+ chars) |
| `ENCRYPTION_KEY` | ✅ | Chave AES-256 (32 hex chars) |
| `NEXTAUTH_SECRET` | ⚠️ | Necessário para OAuth |
| `NEXTAUTH_URL` | ⚠️ | URL base da aplicação |
| `OPENAI_API_KEY` | ⚠️ | Chave da API OpenAI |
| `STRIPE_SECRET_KEY` | ⚠️ | Chave secreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Segredo do webhook Stripe |
| `WHATSAPP_API_KEY` | ⚠️ | Chave da API WhatsApp |
| `WHATSAPP_WEBHOOK_SECRET` | ⚠️ | Segredo do webhook WhatsApp |
| `SMTP_HOST` | ⚠️ | Servidor SMTP |
| `SMTP_PORT` | ⚠️ | Porta SMTP (587) |
| `SMTP_USER` | ⚠️ | Usuário SMTP |
| `SMTP_PASS` | ⚠️ | Senha SMTP |
| `SMTP_FROM` | ⚠️ | Email remetente |
| `SENTRY_DSN` | ❌ | DSN do Sentry |
| `BETTER_STACK_TOKEN` | ❌ | Token Better Stack |
| `APP_URL` | ⚠️ | URL pública da aplicação |

---

## Comandos

### Desenvolvimento
```bash
npm run dev          # Iniciar dev server
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run format       # Prettier
```

### Banco de Dados
```bash
npm run db:generate     # Gerar Prisma Client
npm run db:migrate:dev  # Criar migration
npm run db:push         # Push schema (dev)
npm run db:studio       # Prisma Studio
npm run db:seed         # Seed inicial
npm run db:backup       # Backup manual
```

### Testes
```bash
npm test               # Rodar testes
npm run test:watch     # Watch mode
npm run test:coverage  # Com cobertura
```

### Docker
```bash
npm run docker:build   # Build images
npm run docker:up      # Start services
npm run docker:down    # Stop services
```

---

## API

### Autenticação
| Rota | Método | Descrição |
|---|---|---|
| `/api/auth/login` | POST | Login com email/senha + 2FA |
| `/api/auth/register` | POST | Registro com criação de empresa |
| `/api/auth/logout` | POST | Logout + revogar sessão |
| `/api/auth/me` | GET | Dados do usuário atual |
| `/api/auth/refresh` | POST | Renovar access token |
| `/api/auth/forgot-password` | POST | Solicitar redefinição de senha |
| `/api/auth/reset-password` | POST | Redefinir senha |
| `/api/auth/verify-email` | POST | Verificar email |
| `/api/auth/2fa/setup` | POST | Configurar 2FA |
| `/api/auth/2fa/verify` | POST | Verificar e ativar 2FA |
| `/api/auth/2fa/disable` | POST | Desativar 2FA |

### Dados
| Rota | Método | Descrição |
|---|---|---|
| `/api/clients` | GET/POST | Listar/criar clientes |
| `/api/clients/[id]` | GET/PUT/DELETE | CRUD cliente |
| `/api/conversations` | GET | Listar conversas |
| `/api/schedule` | GET/POST | Agenda |
| `/api/settings` | GET/PUT | Configurações da empresa |
| `/api/profile` | GET/PUT/PATCH | Perfil do usuário |
| `/api/subscription` | GET/POST | Assinatura |
| `/api/upload` | POST | Upload de arquivo |

### Admin
| Rota | Método | Descrição |
|---|---|---|
| `/api/admin/stats` | GET | Estatísticas do sistema |
| `/api/admin/companies` | GET | Listar empresas |
| `/api/admin/companies/[id]` | GET/PATCH/DELETE | CRUD empresa |
| `/api/admin/logs` | GET | Logs do sistema |
| `/api/admin/audit` | GET | Auditoria detalhada |

### Webhooks
| Rota | Método | Descrição |
|---|---|---|
| `/api/webhooks/stripe` | POST | Webhook Stripe |
| `/api/webhooks/whatsapp` | GET/POST | Webhook WhatsApp |

### Sistema
| Rota | Método | Descrição |
|---|---|---|
| `/api/health` | GET | Health check completo |

### Formato de Resposta

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## Segurança

### Medidas Implementadas

| Categoria | Medida |
|---|---|
| **Autenticação** | JWT access + refresh tokens, HttpOnly cookies, bcrypt (12 rounds), 2FA (TOTP) |
| **Headers** | HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, COOP, COEP, CORP |
| **Rate Limiting** | 5 tentativas/15min (login), 30 req/min (API), 60 req/min (paginated) |
| **Proteção** | SQL Injection (Prisma), XSS (CSP + sanitize), CSRF (SameSite), Brute Force (rate limit) |
| **Upload** | Validação MIME + extensão, bloqueio de executáveis, renomeação com UUID |
| **Criptografia** | AES-256-GCM para dados sensíveis, senhas com bcrypt |
| **Sessão** | Revogação individual e em lote, expiração automática |
| **Auditoria** | Todas as alterações registradas com IP, agente, valores antigos/novos |

### Headers HTTP

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: default-src 'self'; script-src 'self' ...; ...
```

---

## Multi-Tenant

O isolamento entre empresas é garantido por:

1. **Schema-level**: Todas as tabelas possuem `companyId`
2. **Query-level**: Toda query de lista inclui `WHERE companyId = ?`
3. **Auth-level**: `validateCompanyAccess()` verifica pertencimento
4. **Admin-level**: Admin pode acessar todas as empresas
5. **Soft Delete**: Dados nunca são removidos fisicamente (exceto por admin)

---

## RBAC

| Papel | Acesso |
|---|---|
| **ADMIN** | Tudo (incluindo painel admin) |
| **EMPLOYEE** | Agenda, Conversas, Clientes |
| **FINANCIAL** | Planos, Pagamentos, Relatórios |

A verificação é feita no servidor em toda requisição:

```typescript
const user = await getCurrentUser();
if (!user) return unauthorizedResponse();
if (user.role === "FINANCIAL" && !allowedRoutes.includes(path)) {
  return forbiddenResponse();
}
```

---

## Deploy

### Docker (recomendado)

```bash
# Construir e iniciar
docker compose up -d

# Verificar saúde
curl http://localhost:3000/api/health
```

### Produção

1. Configure as variáveis de ambiente no servidor
2. Execute as migrations: `npm run db:migrate`
3. Faça o seed: `npm run db:seed`
4. Inicie com Docker: `docker compose up -d`

### Nginx (reverso)

```nginx
server {
    listen 443 ssl;
    server_name app.atendeai.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## CI/CD

### Workflows

| Workflow | Evento | Ações |
|---|---|---|
| **CI** | push/PR para main | Lint → TypeCheck → Build → Test → Docker |
| **Deploy** | push para main | Deploy para Staging |
| **Security** | Weekly + PR | npm audit + Trivy + Dependency Review |

### Estrutura

```
.github/
├── workflows/
│   ├── ci.yml           # Lint, build, test, docker
│   ├── deploy.yml       # Staging/Production deploy
│   └── security.yml     # Weekly security scan
└── dependabot.yml       # Auto-dependency updates
```

---

## Monitoramento

### Health Check
`GET /api/health` retorna:
- Status geral (healthy/degraded/unhealthy)
- Status do banco de dados
- Status OpenAI/Stripe/SMTP/Storage
- Memória (heap, RSS)
- CPU (user, system)
- Uptime, versão, ambiente
- Response time

### Sentry (configuração necessária)
```env
SENTRY_DSN="https://key@o.ingest.sentry.io/project"
```

### Logs Estruturados
```json
{"t":"2024-01-01T00:00:00Z","lvl":"INFO","msg":"Login bem-sucedido","uid":"user123","cid":"comp456","act":"LOGIN_SUCCESS"}
```

---

## Backup

Ver [scripts/backup.md](scripts/backup.md) para documentação completa.

### Comandos Rápidos

```bash
# Backup manual
bash scripts/backup.sh

# Restore do último backup
LATEST=$(ls -t backups/*.sql.gz | head -1)
pg_restore -U atendeai -d atendeai --clean "$LATEST"
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/           # API routes (30+ endpoints)
│   ├── admin/         # Admin dashboard pages
│   ├── dashboard/     # Main app pages
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   └── ...            # Landing, legal, error
├── components/
│   ├── dashboard/     # Sidebar, AuthGuard
│   ├── landing/       # Landing page sections
│   └── ui/            # Reusable UI primitives
├── contexts/          # AuthContext
├── hooks/             # Custom React hooks
└── lib/
    ├── api/           # API client wrapper
    ├── auth/          # JWT, session, password
    ├── db/            # Prisma client
    ├── logger/        # Structured logging
    ├── monitoring/    # Sentry integration
    ├── rate-limit/    # Rate limiting
    ├── resilience/    # Retry, timeout, circuit breaker
    ├── security/      # Sanitization, encryption
    ├── tenant/        # Multi-tenant validation
    └── validators/    # Zod schemas
```

---

## Licença

Este projeto é privado e de uso exclusivo.

---

## Suporte

- **Email:** suporte@atendeai.com
- **Documentação:** https://docs.atendeai.com
- **Status:** https://status.atendeai.com
