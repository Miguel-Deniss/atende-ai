# Supabase

O Supabase fornece apenas PostgreSQL gerenciado. A aplicação não usa Supabase Auth, Data API, Storage ou Edge Functions. Prisma é a camada relacional oficial e a autenticação própria é a única fonte de identidade.

Configure uma URL pooled em `DATABASE_URL` com a role limitada de runtime e uma conexão direta em `DIRECT_URL` com a identidade de migração. Mantenha a Data API sem grants e não exponha chaves `anon` ou `service_role` à aplicação.

O projeto remoto verificado em 12/09/2026 estava saudável, PostgreSQL 17.6, banco vazio, 22 tabelas preexistentes, sem histórico `_prisma_migrations`, RLS desativado, nenhum usuário Supabase Auth, bucket ou Edge Function. Esse retrato pode mudar e deve ser reconfirmado antes de staging.

Para reconhecer a baseline sem recriar tabelas, siga [OPERATIONS.md](OPERATIONS.md). A operação exige novo diff, backup e aprovação; nenhum SQL remoto foi aplicado durante o hardening.
