# RLS e Data API

RLS está desativado e não há policies aplicadas. Essa é uma decisão explícita da arquitetura atual: somente o backend Next.js acessa o banco por Prisma, usando uma role PostgreSQL limitada, e a Data API do Supabase permanece fechada.

As roles `anon`, `authenticated` e `service_role` não devem receber `USAGE` no schema `public` nem privilégios nas tabelas. Verifique periodicamente:

```sql
select r.rolname,
       has_schema_privilege(r.rolname, 'public', 'USAGE') as schema_usage,
       has_table_privilege(r.rolname, 'public.companies', 'SELECT') as can_select
from pg_roles r
where r.rolname in ('anon', 'authenticated', 'service_role');
```

Não aplique os antigos SQLs de `prisma/migrations/rls`; eles foram removidos porque dependiam de uma arquitetura de Auth/Data API que não existe. Se acesso direto, Supabase Auth ou Edge Functions forem introduzidos, isso será uma mudança arquitetural: desenhe policies novas para todas as tabelas, teste com dois tenants e mantenha os guards da aplicação como outra camada.
