# Operações

## Ambientes e credenciais

Use segredos distintos por ambiente. `DATABASE_URL` pertence à role limitada de runtime; `DIRECT_URL` pertence à role de migração e nunca deve ser exposta ao container da aplicação. Mantenha `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `SIGNED_URL_SECRET`, `CRON_SECRET` e `HEALTHCHECK_SECRET` independentes e rotacionáveis.

## Banco existente e baseline

As migrations são, em ordem: baseline das tabelas preexistentes, hardening, leads da demonstração e expiração de confirmação de e-mail. Em banco vazio, execute `npx prisma migrate deploy`.

O banco Supabase já existente contém o schema da baseline, mas não contém `_prisma_migrations`. Depois de comparar novamente o schema e fazer backup, marque **somente** a baseline como aplicada:

```powershell
npx prisma migrate resolve --applied 20260912000000_baseline
npx prisma migrate deploy
```

Impacto: `migrate resolve` não executa SQL; apenas registra que a baseline já existe. O `migrate deploy` seguinte aplica as migrations posteriores. Não execute o comando se houver drift em relação à baseline. Nunca marque as migrations de hardening como aplicadas sem confirmar que suas colunas e índices existem.

## Role limitada no Supabase

Execute como administrador em uma janela controlada, substituindo a senha por um segredo gerado. Não coloque a senha no histórico do shell.

```sql
create role atendeai_runtime login password '<secret>';
grant connect on database postgres to atendeai_runtime;
grant usage on schema public to atendeai_runtime;
grant select, insert, update, delete on all tables in schema public to atendeai_runtime;
grant usage, select on all sequences in schema public to atendeai_runtime;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to atendeai_runtime;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to atendeai_runtime;
```

Teste que a role não cria nem remove tabelas. Configure `DATABASE_URL` com essa role e preserve a conexão administrativa apenas em `DIRECT_URL` no job de migração.

## Backup e restauração

`npm run db:backup` produz um dump customizado com timestamp. Armazene cópias criptografadas fora da VPS e faça teste periódico de restauração:

```powershell
pg_restore --clean --if-exists --no-owner --dbname $env:RESTORE_DATABASE_URL .\backups\atendeai-YYYYMMDD-HHMMSS.dump
npx prisma migrate status
```

Restaure sempre em banco descartável primeiro. Para produção, habilite backups gerenciados e Point-in-Time Recovery no plano Supabase escolhido; isso depende de configuração externa.

## Staging

1. Crie banco e credenciais exclusivos.
2. Configure a role runtime, `DATABASE_URL` e `DIRECT_URL`.
3. Configure Meta, Stripe e Resend em modo de teste e URLs de webhook do staging.
4. Publique os cron jobs para fila, lembretes e retenção com `CRON_SECRET`.
5. Execute backup, `prisma migrate deploy`, seed dos planos e readiness.
6. Teste cadastro e confirmação de e-mail, dois tenants, upload e download, agendamento concorrente, takeover humano, replay de webhook e billing de teste.
7. Verifique logs sem PII, métricas, alertas e restauração do backup.

## Deploy e rollback

O workflow publica duas imagens imutáveis do SHA: aplicação e migrator. `scripts/deploy-image.sh` baixa o SHA exato, aplica migrations, preserva o container anterior, troca a aplicação e consulta a liveness. Se o health gate falhar, o container anterior volta.

Migrations devem seguir expansão/contração e permanecer compatíveis com a versão anterior; rollback de container não desfaz DDL. Mudanças destrutivas exigem release separada, backup verificado e plano manual.

## Incidente

1. Preserve evidências e registre horário, ambiente e request IDs.
2. Revogue credenciais comprometidas e sessões afetadas.
3. Isole a integração ou tenant sem apagar dados.
4. Faça rollback do container se a regressão for de aplicação.
5. Restaure banco apenas após validar o ponto e o impacto.
6. Avalie notificação a titulares e ANPD com responsável jurídico.
7. Documente causa, impacto e ações preventivas.
