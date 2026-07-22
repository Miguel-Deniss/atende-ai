# Multi-Tenant Architecture

## Visão Geral

O sistema utiliza **isolamento por companyId** (shared database, shared schema). Cada registro pertence a uma empresa específica, e o acesso é controlado por:

1. **Validação em nível de aplicação** (camada primária - já implementada)
2. **Row Level Security** (camada secundária - opcional via Supabase)
3. **Plan limits** (restrições por plano - nova camada)

## Camadas de Isolamento

### 1. Schema (Banco de Dados)

Todas as tabelas de negócio possuem `companyId` como chave estrangeira obrigatória:

```
Company
  ├── users (companyId FK)
  ├── clients (companyId FK)
  ├── appointments (companyId FK)
  ├── conversations (companyId FK)
  ├── uploads (companyId FK)
  ├── audit_logs (companyId FK)
  ├── api_keys (companyId FK)
  ├── company_settings (companyId FK, 1:1)
  └── ai_configs (companyId FK, 1:1)
       ├── services (aiConfigId FK)
       └── faqs (aiConfigId FK)
```

### 2. Aplicação (Middleware + API)

- **Middleware** (`src/middleware.ts`): Valida tokens JWT antes de páginas protegidas
- **Session** (`src/lib/auth/session.ts`): `getCurrentUser()` retorna usuário + empresa
- **API Routes**: Cada endpoint filtra por `user.companyId`
- **Tenant Guard** (`src/lib/tenant/guard.ts`): Utilitário centralizado de validação

### 3. Plano (Restrições por Assinatura)

`src/lib/tenant/plan-limits.ts` define limites por plano:

| Recurso | Starter | Pro | Business |
|---|---|---|---|
| Usuários | 3 | 10 | Ilimitado |
| Clientes | 100 | 1.000 | 50.000 |
| Agendamentos | 200 | 5.000 | 99.999 |
| Conversas | 500 | 10.000 | 99.999 |
| Uploads | 50 | 200 | 1.000 |
| Armazenamento | 100MB | 500MB | 2GB |
| API Keys | 2 | 5 | 20 |
| Mensagens IA | 500 | 5.000 | 50.000 |

## Fluxo de Requisição

```
Requisição → Middleware (valida token)
  → API Route → getCurrentUser() (valida sessão)
    → resolveTenant() (valida role + plano)
      → Query com companyId filter
        → Valida resource ownership (IDOR check)
          → Resposta
```

## IDOR Protection

O sistema protege contra Insecure Direct Object Reference (IDOR) em três níveis:

1. **Query filter**: Toda busca usa `{ where: { companyId: user.companyId } }`
2. **Resource validation**: `getClientForCompany(id, companyId)` no [id]/route.ts
3. **Tenant guard**: `enforceResourceAccess()` e `validateResourceAccess()` no guard.ts

## Como Adicionar Novo Recurso

```typescript
// 1. Schema: adicionar companyId ao modelo Prisma
model NewEntity {
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
  @@index([companyId])
}

// 2. API: usar o tenant guard
import { withTenantGuard, validateResourceAccess } from "@/lib/tenant/guard";

export async function GET() {
  return withTenantGuard(async (context) => {
    const data = await prisma.newEntity.findMany({
      where: { companyId: context.companyId },
    });
    return successResponse(data);
  });
}
```
