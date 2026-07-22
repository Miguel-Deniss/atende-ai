# Cloudflare Setup Guide

## Visão Geral

Este guia explica como conectar o projeto AtendeAI ao Cloudflare para CDN, DDoS protection, WAF, SSL, e performance.

## Configuração Inicial

### 1. DNS

Adicione um registro A ou CNAME no Cloudflare DNS apontando para seu servidor:

```
Tipo  Nome            Conteúdo
A     app             SEU_IP_DO_SERVIDOR
CNAME www             app.atendeai.com
```

**Importante**: Certifique-se de que o proxy Cloudflare (laranja) está ativado para proteção DDoS e CDN.

### 2. SSL/TLS

No dashboard do Cloudflare:

1. **SSL/TLS > Overview**: Selecione "Full (Strict)"
2. **SSL/TLS > Edge Certificates**: Ative:
   - Always Use HTTPS
   - Automatic HTTPS Rewrites
   - HSTS (max-age=63072000; includeSubDomains; preload)

### 3. WAF (Web Application Firewall)

Crie regras WAF para proteção:

```
Rule 1: Block requests without valid User-Agent
  - Field: User-Agent
  - Operator: matches regex
  - Value: (curl|wget|python-requests|bot|crawl)
  - Action: Block

Rule 2: Rate limiting for /api/auth/login
  - Requests: 5 per 15 minutes
  - Action: Block

Rule 3: Rate limiting for /api/ (general)
  - Requests: 100 per minute
  - Action: Block
```

### 4. Caching

Configuração de cache recomendada:

| Pattern | Cache Level | Edge TTL |
|---|---|---|
| `/_next/static/*` | Standard | 30 days |
| `/uploads/*` | Standard | 1 hour |
| `/api/*` | Bypass | - |
| `/privacy`, `/terms` | Standard | 1 day |

### 5. Security Headers

Os headers de segurança são configurados em:
- `next.config.ts` (para Next.js)
- `middleware.ts` (para todas as rotas)
- `cloudflare/worker.ts` (para edge)
- `cloudflare/_headers` (para Pages)

## Componentes Cloudflare

### 1. Workers (Edge Functions)

O arquivo `cloudflare/worker.ts` contém um worker edge que:

- Adiciona headers de segurança
- Bloqueia user-agents maliciosos
- Define cache rules por padrão de URL
- Previne hotlinking

**Deploy**:

```bash
npm install -g wrangler
wrangler login
wrangler deploy cloudflare/worker.ts --name atende-ai-security
```

### 2. Pages (Static Hosting)

Para deploy via Cloudflare Pages (alternativa ao Vercel):

```bash
npx wrangler pages deploy .next --project-name atende-ai
```

Headers customizados: `cloudflare/_headers`
Redirects: `cloudflare/_redirects`

### 3. Turnstile (CAPTCHA)

Para adicionar proteção CAPTCHA sem comprometer a privacidade:

```bash
# 1. Crie um site key em: https://dash.cloudflare.com/?to=/:account/turnstile
# 2. Adicione as variáveis de ambiente:
TURNSTILE_SITE_KEY="1x00000000000000000000AA"
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

### 4. R2 (Object Storage)

Para migrar uploads para Cloudflare R2 (alternativa ao armazenamento local):

```bash
# 1. Crie um bucket no R2
# 2. Configure as credenciais no wrangler.toml
# 3. Use o S3-compatible client para fazer upload
```

## Proteção DDoS

O Cloudflare fornece proteção DDoS automática nos planos Free/Pro/Business:

1. **Layer 3/4**: Mitigação automática de ataques de rede
2. **Layer 7**: WAF + Rate Limiting + IP Access Rules
3. **Bot Management**: Disponível nos planos Business+

## Monitoramento

### Analytics
- Cloudflare Dashboard > Analytics
- Acompanhe: requests, bandwidth, cache ratio, threats blocked, top countries

### Logs
- **Logpush**: Envie logs para R2, S3, ou Datadog
- **Workers Trace**: Debug de workers em tempo real

## Troubleshooting

### Problema: API retorna 403
Verifique se o WAF não está bloqueando requisições legítimas.

### Problema: Cache não funciona
Verifique os headers `Cache-Control` e `CDN-Cache-Control` na resposta.

### Problema: SSL handshake failed
Verifique se o SSL está configurado como "Full (Strict)" e o certificado do servidor é válido.
