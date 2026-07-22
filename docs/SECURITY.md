# Segurança da Infraestrutura

## Camadas de Segurança

```
Layer 7: Cloudflare WAF + Rate Limiting
  ↓
Layer 6: Application Security Headers (middleware.ts + next.config.ts)
  ↓
Layer 5: Auth (JWT + Session + 2FA + CSRF)
  ↓
Layer 4: Multi-Tenant Isolation (companyId checks)
  ↓
Layer 3: Row Level Security (database policies)
  ↓
Layer 2: Input Validation (Zod schemas)
  ↓
Layer 1: SQL Injection Protection (Prisma ORM)
```

## Proteções Implementadas

### 1. IDOR (Insecure Direct Object Reference)

**O que é**: Ataque onde o usuário acessa recursos de outro usuário alterando IDs na URL.

**Proteção**:
- `src/lib/tenant/guard.ts` → `validateResourceAccess()` e `enforceResourceAccess()`
- Toda API filtra por `companyId` antes de retornar dados
- Logs de tentativas de IDOR em `src/lib/tenant/guard.ts:39`
- Mensagens de erro genéricas ("não encontrado" em vez de "não pertence a você")

### 2. Mass Assignment

**O que é**: Ataque onde o usuário envia campos não permitidos no body.

**Proteção**:
- Zod schemas definem campos permitidos (ex: `profileUpdateSchema`)
- `allowedFields` whitelist em admin routes
- Prisma `select` explícito em queries

### 3. Enumeration

**O que é**: Ataque onde o atacante descobre informações válidas (emails, IDs) através de respostas diferentes.

**Proteção**:
- `src/lib/security/enumeration.ts` → `checkEnumerationRate()` limita tentativas por identificador
- Mensagens genéricas: "Email ou senha inválidos" (login), "Se o email existir..." (forgot password)
- `getGenericNotFoundMessage()` retorna sempre "não encontrado(a)" sem detalhes

### 4. Brute Force

**O que é**: Ataque de tentativas repetidas de senha.

**Proteção**:
- `src/lib/rate-limit/index.ts` → 5 tentativas por IP a cada 15 minutos no login
- `src/lib/rate-limit/index.ts` → 30 requisições por minuto para API geral
- `src/lib/rate-limit/index.ts` → 60 requisições por minuto para API interna
- Login attempts registrados em banco (tabela `login_attempts`)
- Após exceder limite, todas as tentativas são bloqueadas até o reset da janela

### 5. Replay Attacks

**O que é**: Ataque onde uma requisição legítima é capturada e reenviada.

**Proteção**:
- `src/lib/security/nonce.ts` → Nonce + timestamp para operações sensíveis
- Nonces são armazenados em memória e rejeitados se reutilizados
- Janela de 60 segundos para validade do nonce
- `createReplaySafePayload()` para criar payloads com proteção

### 6. CSRF (Cross-Site Request Forgery)

**Proteção**:
- `src/lib/security/csrf.ts` → Geração e validação de tokens CSRF
- Cookies `SameSite: "strict"` para CSRF token
- Cookies `SameSite: "lax"` para tokens de sessão
- `httpOnly` em todos os cookies sensíveis

### 7. Storage Security

**Proteção**:
- `src/lib/storage/access.ts` → `validateFileAccess()` com verificação de companyId
- `src/app/api/files/[id]/route.ts` → Servir arquivos via API com autenticação
- Signed URLs com expiração para compartilhamento
- Validação de tipo MIME, extensão, e tamanho no upload
- Quarentena de extensões executáveis (.exe, .bat, .sh, etc.)

### 8. Headers de Segurança

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: default-src 'self'; ...
```

## Checklist de Segurança

- [ ] RLS ativo no banco de dados (ver `docs/RLS.md`)
- [ ] Cloudflare WAF configurado (ver `docs/CLOUDFLARE.md`)
- [ ] SSL/TLS modo Full (Strict)
- [ ] HSTS pré-carregado
- [ ] Rate limiting configurado
- [ ] Audit logging ativo
- [ ] 2FA disponível para admins
- [ ] CSRF protection em formulários
- [ ] Input validation em todas as APIs
- [ ] File upload sanitization
- [ ] Session revocation funcional
- [ ] Backup automático configurado
