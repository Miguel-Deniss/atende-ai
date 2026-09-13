# Integrações

## Meta Cloud API

Configure `META_APP_ID`, `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN`. Cada empresa armazena seu token de acesso criptografado no banco. O webhook é `/api/webhooks/whatsapp`; sem app secret ou assinatura `sha256` válida, a requisição é rejeitada. Cadastre também o cron `/api/cron/webhooks` para retries.

## Stripe

Use chaves e Price IDs do modo de teste em staging. O endpoint é `/api/webhooks/stripe` e exige `STRIPE_WEBHOOK_SECRET`. Eventos são deduplicados pelo ID do Stripe. Exercite checkout, pagamento, falha, cancelamento, upgrade e downgrade antes de habilitar o modo live.

## Resend

Configure `RESEND_API_KEY` e um `EMAIL_FROM` de domínio verificado. Cadastro exige confirmação de e-mail e o token expira em 24 horas. Teste entrega, bounce e reenvio em staging.

## IA

`AI_PROVIDER=ollama` usa `OLLAMA_URL` e `OLLAMA_MODEL`; `openai` usa `OPENAI_API_KEY` e `OPENAI_MODEL`. O sistema mantém fallback seguro e takeover humano. Valide política de dados e região do provedor antes de usar conteúdo real.
