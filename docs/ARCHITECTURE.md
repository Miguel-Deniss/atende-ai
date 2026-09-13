# Arquitetura

## Componentes

```text
Browser / Meta / Stripe
          |
     Next.js 15
  pages + API routes
          |
 auth, tenant guards, DTOs
          |
      Prisma 6
          |
 PostgreSQL 17 / Supabase
   |       |       |
 sessions queue  LISTEN/NOTIFY
```

Next.js é a aplicação e a API. Prisma é a única camada relacional. Supabase fornece PostgreSQL gerenciado; Auth, Data API, Storage e Edge Functions do Supabase estão fora da arquitetura atual.

## Identidades de banco

- `atendeai_runtime`: `CONNECT`, `USAGE` do schema e DML nas tabelas/sequências; usada por `DATABASE_URL`.
- migrator/administrador: cria e altera schema; usada apenas por `DIRECT_URL` em jobs controlados.
- `anon`, `authenticated` e `service_role`: sem acesso ao schema `public` enquanto a Data API estiver fora de uso.

RLS não é a barreira primária. A sessão autenticada determina `companyId`, e cada consulta ou mutação tenant-scoped inclui esse identificador. `SUPER_ADMIN` é global; `ADMIN` pertence a uma empresa e não ignora tenant guards.

## Autenticação

O cadastro transaciona empresa e primeiro administrador. A confirmação de e-mail é obrigatória e precede qualquer sessão. Access e refresh JWTs usam issuer, audience, algoritmo explícito, tipo e vínculo a `sessionToken`. Refresh rotaciona o token persistido. Logout, troca de senha, desativação, suspensão e mudança crítica revogam sessões.

## Assíncrono e realtime

O webhook Meta valida a assinatura antes de persistir um evento deduplicado. A fila no PostgreSQL registra tentativas, disponibilidade, claim, sucesso e dead-letter; o cron processa retries com backoff. Realtime usa PostgreSQL `LISTEN/NOTIFY`, com EventEmitter apenas para entrega local, evitando dependência em memória de uma única instância.

## Arquivos

Arquivos privados ficam em `UPLOAD_DIR`, fora de `public`. Upload valida tamanho, extensão, MIME declarado e magic bytes, usa UUID e registra tenant. Download passa por autorização e assinatura curta. Em múltiplas VPS, substituir o volume por object storage privado mantendo a mesma camada de acesso.

## Limites e trade-offs

PostgreSQL como fila e Pub/Sub reduz infraestrutura no estágio atual, mas exige monitoramento de conexões, lag e tamanho das tabelas. Redis/BullMQ é a evolução indicada quando workers independentes, throughput ou fan-out crescerem. Rollback de container não reverte migration; migrations devem ser retrocompatíveis.
