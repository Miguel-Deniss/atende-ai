# Rotas da API

Este arquivo registra contratos estáveis, sem duplicar cada detalhe do código.

- `/api/auth/*`: cadastro, confirmação e reenvio de e-mail, login, refresh rotativo, logout, recuperação de senha e TOTP.
- `/api/clients`, `/api/conversations`, `/api/schedule`, `/api/settings`, `/api/upload` e `/api/files/*`: recursos autenticados e escopados pelo tenant da sessão.
- `/api/public/companies/*`: leitura e agendamento público com validação de empresa, serviço, disponibilidade e rate limit.
- `/api/public/demo`: captação consentida de lead com honeypot, rate limit e retenção de 90 dias.
- `/api/webhooks/whatsapp`: assinatura Meta obrigatória, persistência idempotente e fila assíncrona.
- `/api/webhooks/stripe`: assinatura Stripe obrigatória e deduplicação pelo ID do evento.
- `/api/cron/*`: endpoints protegidos por bearer `CRON_SECRET`.
- `/api/health`: liveness pública sem dependências.
- `/api/health/ready`: readiness protegida por bearer `HEALTHCHECK_SECRET` ou `CRON_SECRET`.
- `/api/admin/*`: rotas globais exclusivas de `SUPER_ADMIN`.

Respostas usam `{ "success": true, "data": ... }` ou `{ "success": false, "error": "..." }`. Erros internos de banco e provedores não fazem parte do contrato público. Para alterar uma rota, atualize seu schema Zod, autorização, testes e esta visão geral quando o contrato estável mudar.
