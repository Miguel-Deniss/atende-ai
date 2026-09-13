# AtendeAI

Aplicação SaaS multi-tenant para centralizar conversas do WhatsApp, automatizar respostas com IA, transferir o atendimento para pessoas e organizar agendamentos.

## Estado do projeto

O repositório está preparado para validação em staging. Ele não deve ser tratado como produção até que as credenciais externas, a role limitada do banco, os webhooks e os runbooks sejam exercitados no ambiente de staging. O Supabase é usado apenas como PostgreSQL gerenciado; Supabase Auth, Data API, Storage e Edge Functions não fazem parte da arquitetura atual.

## Stack

- Next.js 15.5, React 19 e TypeScript 5.8.
- Prisma 6.19 e PostgreSQL 17.
- Autenticação própria com access JWT, refresh rotativo, sessão persistida, cookies HttpOnly e TOTP opcional.
- Meta Cloud API, Stripe, Resend, Ollama e fallback OpenAI.
- Vitest, ESLint, Prettier, Docker e GitHub Actions.

## Pré-requisitos

- Node.js 22 a 24 e npm 10 ou superior.
- PostgreSQL 17 ou Docker Desktop.
- Um arquivo `.env` criado a partir de `.env.example`; nunca versione esse arquivo.

## Desenvolvimento local

```powershell
Copy-Item .env.example .env
npm ci
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

O seed cria ou atualiza os planos. Um administrador inicial só é criado quando `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` e os demais dados de seed são definidos explicitamente; não há senha padrão no repositório.

Com Docker, defina `POSTGRES_PASSWORD`, `RUNTIME_DB_PASSWORD` e os segredos obrigatórios antes de executar:

```powershell
docker compose up --build
```

O Compose cria duas identidades: `atendeai_migrator`, dona do schema e usada apenas pelo serviço `migrate`, e `atendeai_runtime`, limitada a DML e usada pela aplicação.

## Validação

```powershell
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
npm audit --audit-level=high
npx prisma validate
docker compose config --quiet
docker compose build
```

O CI também recria um PostgreSQL vazio com `prisma migrate deploy` antes dos testes e constrói a imagem Docker.

## Arquitetura e segurança

- O tenant vem da sessão validada; `companyId` recebido do cliente não concede acesso.
- Toda sessão persiste no banco e pode ser revogada. Logout, troca de senha, desativação e alterações críticas revogam sessões.
- A confirmação de e-mail é obrigatória. O cadastro não cria sessão; o link expira em 24 horas.
- Uploads ficam fora de `public/`, usam nomes aleatórios, validação por assinatura do arquivo e download autenticado por URL curta assinada.
- Webhooks Meta falham de forma fechada, são idempotentes e entram em uma fila durável no PostgreSQL com retry e dead-letter.
- Realtime usa `LISTEN/NOTIFY` do PostgreSQL para funcionar entre instâncias.
- A Data API do Supabase deve permanecer sem grants para `anon`, `authenticated` e `service_role`. O isolamento da aplicação não depende de RLS.

## Operação

- Liveness pública: `GET /api/health`.
- Readiness protegida: `GET /api/health/ready` com `Authorization: Bearer $HEALTHCHECK_SECRET`.
- Processamento da fila: `POST /api/cron/webhooks` com `CRON_SECRET`.
- Retenção: `POST /api/cron/retention` com `CRON_SECRET`.
- Backup: `npm run db:backup` usa `pg_dump` e `DIRECT_URL`.

Leia antes de preparar staging:

- [Arquitetura](docs/ARCHITECTURE.md)
- [Operações, migrações, deploy e rollback](docs/OPERATIONS.md)
- [Segurança e multi-tenancy](docs/SECURITY.md)
- [Privacidade e retenção](docs/PRIVACY_AND_RETENTION.md)
- [Integrações externas](docs/INTEGRATIONS.md)
- [Supabase e estratégia de baseline](docs/SUPABASE_INTEGRATION.md)

## Limites conhecidos

- O armazenamento privado atual é um volume persistente local, adequado a uma única VPS. Para várias máquinas, migrar a abstração para object storage privado.
- A fila durável e o realtime usam PostgreSQL; Redis/BullMQ pode ser adotado se o volume exigir workers independentes.
- TOTP está disponível, mas ainda não é obrigatório para administradores.
- Conteúdo jurídico precisa de revisão profissional antes do lançamento.
- Nenhum deploy, mudança de DNS ou migração foi aplicado pelo processo de hardening local.
