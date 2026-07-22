# RLS - Row Level Security

## Visão Geral

O Row Level Security (RLS) é uma camada de segurança a nível de banco de dados que garante que cada usuário veja apenas os dados que lhe pertencem, mesmo que uma consulta SQL tente acessar registros de outros tenants.

## Estado Atual

O RLS **não está ativo** no banco de dados atual. O sistema depende exclusivamente da validação em nível de aplicação (Prisma + TypeScript), onde cada query filtra por `companyId`.

## Como Ativar

### 1. Executar a migração SQL

```bash
# Via connection string
psql "$DATABASE_URL" -f prisma/migrations/rls/001_enable_rls.sql

# Ou via terminal local
psql -h localhost -U postgres -d atendeai -f prisma/migrations/rls/001_enable_rls.sql
```

### 2. Executar os índices adicionais

```bash
psql "$DATABASE_URL" -f prisma/migrations/rls/002_composite_indexes.sql
```

## Arquitetura

### Funções auxiliares (criadas pela migration)

| Função | Descrição |
|---|---|
| `auth.user_id()` | Extrai o `sub` (user ID) do JWT da requisição |
| `auth.company_id()` | Extrai o `company_id` do JWT |
| `auth.user_role()` | Extrai a `role` do JWT |
| `auth.is_admin()` | Retorna true se `role = 'ADMIN'` |

### Policies por tabela

Cada tabela possui policies que:

1. **SELECT**: Usuário vê apenas registros da sua empresa (admins veem tudo)
2. **INSERT/UPDATE/DELETE**: Usuário modifica apenas registros da sua empresa
3. **Admin bypass**: Admins têm acesso irrestrito para suporte

### Tabelas cobertas

| Tabela | Policy Principal | Admin Bypass |
|---|---|---|
| companies | company_id match | ✓ |
| users | company_id match (SELECT), user_id match (UPDATE) | ✓ |
| sessions | user_id match | ✓ |
| login_attempts | user_id match (SELECT) | ✓ |
| company_settings | company_id match | ✓ |
| ai_configs | company_id match | ✓ |
| services | via ai_configs → company_id | - |
| faqs | via ai_configs → company_id | - |
| clients | company_id match | ✓ |
| appointments | company_id match | ✓ |
| conversations | company_id match | ✓ |
| uploads | company_id match | ✓ |
| audit_logs | company_id match (SELECT) | ✓ |
| api_keys | company_id match | ✓ |
| webhook_events | admin only | ✓ |

## Supabase vs Prisma

O RLS é efetivo quando as queries passam pelo **Supabase Client** (que injeta o JWT na sessão PostgreSQL).

- **Supabase Client**: RLS ativo, policies são aplicadas automaticamente
- **Prisma ORM**: Conecta como superusuário, **bypassa RLS**. A segurança continua sendo feita pelo código da aplicação

### Recomendação

1. Mantenha a validação em nível de aplicação (Prisma + `companyId` filter) como camada primária
2. Ative o RLS como camada secundária de defesa para consultas via Supabase
3. Use o Supabase Client para acesso direto ao banco em Edge Functions

## Verificação

```sql
-- Listar tabelas com RLS ativo
SELECT relname FROM pg_class WHERE relrowsecurity = true AND relkind = 'r';

-- Listar todas as policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies ORDER BY tablename;
```
