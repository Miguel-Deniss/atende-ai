# Arquitetura do AtendeAI

A documentação arquitetural canônica está em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Runbooks e decisões operacionais estão em [docs/OPERATIONS.md](docs/OPERATIONS.md).

Resumo: Next.js e Prisma acessam PostgreSQL/Supabase com uma role limitada de runtime; autenticação própria usa sessões persistidas e JWTs rotativos; webhooks usam uma fila durável no PostgreSQL; realtime usa `LISTEN/NOTIFY`; arquivos permanecem privados fora de `public`.
