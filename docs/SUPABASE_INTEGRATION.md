# Supabase Integration Guide

## Visão Geral

O Supabase é integrado como **camada complementar** ao sistema existente. O core auth e banco continuam usando Prisma + JWT + PostgreSQL puro.

## Componentes Integrados

### 1. Supabase Client (`src/lib/supabase/client.ts`)

Dois clientes disponíveis:

- `getSupabaseAdmin()`: Cliente com `service_role` key (operações administrativas)
- `getSupabaseClient()`: Cliente com `anon` key (operações de usuário final)

Ambos retornam `null` se não configurados, garantindo que o sistema funcione sem Supabase.

### 2. Auth Sync (`src/lib/supabase/auth.ts`)

Sincroniza usuários entre Prisma e Supabase Auth:

- `createSupabaseUser()`: Cria usuário no Supabase Auth durante o registro
- `deleteSupabaseUser()`: Remove usuário do Supabase Auth
- `listSupabaseUsers()`: Lista usuários de uma empresa no Supabase

### 3. Storage (`src/lib/supabase/storage.ts`)

Gerencia uploads no Supabase Storage com isolamento por empresa:

- `uploadToSupabase()`: Upload com path `{companyId}/{fileName}`
- `deleteFromSupabase()`: Remove arquivo
- `listCompanyFiles()`: Lista arquivos de uma empresa
- `getSignedUrl()`: Gera URL temporária (1h) para acesso seguro

## Configuração

### 1. Criar projeto Supabase

```bash
# Acesse https://supabase.com e crie um novo projeto
```

### 2. Configurar variáveis de ambiente

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_STORAGE_BUCKET="company-uploads"
```

### 3. Executar migração RLS

```bash
psql "$DATABASE_URL" -f prisma/migrations/rls/001_enable_rls.sql
```

### 4. Criar Storage Bucket

No dashboard Supabase:
1. Storage > Create Bucket
2. Nome: `company-uploads`
3. Public: false
4. Adicionar policy RLS do arquivo `001_enable_rls.sql`

## Fluxo de Autenticação

```
Registro (POST /api/auth/register)
  → Cria usuário no Prisma (existente)
  → Cria usuário no Supabase Auth (novo - se configurado)
  → Seta cookies JWT (existente)

Login (POST /api/auth/login)
  → Valida credenciais no Prisma (existente)
  → Seta cookies JWT (existente)
  → Supabase Auth é opcional

Logout (POST /api/auth/logout)
  → Revoga sessão no Prisma (existente)
  → Limpa cookies (existente)
```

**Nota**: O Supabase Auth não substitui o fluxo JWT existente. Ambos coexistem.

## RLS via Prisma vs Supabase

| Característica | Prisma | Supabase Client |
|---|---|---|
| Segurança | Código (companyId filter) | Código + RLS (policy) |
| Performance | Direto (sem overhead) | Leve overhead (JWT parse) |
| Complexidade | Simples | Média (policies SQL) |
| Edge Functions | Não | Sim |

Recomendação: Use Prisma para operações complexas e Supabase Client para acesso direto ao banco em Edge Functions.

## Storage: Local vs Supabase

| Característica | Local | Supabase |
|---|---|---|
| CDN | Manual (Cloudflare) | Automático |
| RLS | Manual (API guard) | Políticas RLS |
| Backup | Script separado | Incluso |
| Performance | Servidor origem | Edge |
| Custo | Incluso no servidor | Por armazenamento |

Recomendação: Use Supabase Storage para produção e local para desenvolvimento.
