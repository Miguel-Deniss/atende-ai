### 3.18 Mapeamento de Rotas da API

---

## Auth (11 rotas)

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/login/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public
- **Funções**: `POST(request)`
- **Fluxo**:
  1. Parseia body com `loginSchema` (Zod) — aceita `email`, `password`, `totpCode` e `recoveryCode` opcionais
  2. Extrai IP e User-Agent dos headers
  3. `checkLoginRateLimit` por IP — se excedido, retorna `rateLimitResponse`
  4. `findUnique` user por email — se não existir, log `LOGIN_FAILURE` + erro 401
  5. `verifyPassword` — se inválido, cria `LoginAttempt` (success:false), log `LOGIN_FAILURE`, erro 401
  6. Verifica `isActive` do usuário e `company.status !== "SUSPENDED"`
  7. Se `user.twoFactorEnabled` e sem `totpCode` nem `recoveryCode` no body, retorna `requiresTwoFactor: true`
  8. Se 2FA: `verifyTotp(twoFactorSecret, totpCode)` (`src/lib/auth/two-factor.ts`); se TOTP falhar e houver `recoveryCode`, `verifyRecoveryCode` valida o hash SHA-256 e **consome o código** (remove o hash usado, atualiza `twoFactorRecoveryCodes` no user) + log `TWOFA_RECOVERY_USED` com quantos restam; nenhum válido → 401
  9. `setAuthCookies(userId, companyId, role, ip, userAgent)` — cria session + accessToken + refreshToken
  10. Atualiza `lastLoginAt` e `lastLoginIp` no user
  11. Cria `LoginAttempt` com success:true
  12. `resetLoginAttempts(ip)`
  13. Log `LOGIN_SUCCESS`
  14. Retorna `{ user: { id, name, email, role, companyId, companyName } }`
- **Validação**: `loginSchema` (email, password, totpCode opcional, recoveryCode opcional)
- **Dependências**: `prisma`, `verifyPassword`, `setAuthCookies`, `loginSchema`, `successResponse`/`errorResponse`/`rateLimitResponse`, `checkLoginRateLimit`/`getRateLimitHeaders`/`resetLoginAttempts`, `createLog`, `verifyToken`, `verifyTotp`/`verifyRecoveryCode` (`src/lib/auth/two-factor.ts`)
- **Problemas**: Nenhum reportado
- **Observações**: Usa `rateLimitResponse` próprio com headers `Retry-After` e `X-RateLimit-*`. Anti-enumeration: mesma mensagem "Email ou senha inválidos" para email inexistente e senha errada. Códigos de recuperação são de uso único (hash consumido).

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/register/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public
- **Funções**: `POST(request)`
- **Fluxo**:
  1. Parseia body com `registerSchema`
  2. Verifica email duplicado (`findUnique`), retorna 409 se existir
  3. `hashPassword(password)`
  4. Gera slug da empresa: lowercased + sanitized + `-${Date.now().toString(36)}`
  5. Transação: cria `Company` + `CompanySettings` + `User` (role ADMIN)
  6. `setAuthCookies` — login automático pós-registro
  7. Log `REGISTER`
  8. Retorna `{ user }` com status 201
- **Validação**: `registerSchema` (name, email, password, companyName, phone opcional)
- **Dependências**: `prisma`, `hashPassword`, `setAuthCookies`, `registerSchema`, `successResponse`/`errorResponse`, `createLog`, `generateToken`
- **Problemas**: Nenhum reportado
- **Observações**: Gera `emailVerificationToken` via `generateToken()` mas não envia email. Trial de 14 dias automático. Slug não é unique validado.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/logout/route.ts`
- **Métodos HTTP**: `POST`, `DELETE`
- **Autenticação**: public (opcional)
- **Funções**: `POST()`, `DELETE()` (delega para POST)
- **Fluxo**:
  1. `getCurrentUser()` — pode ser null (logout mesmo sem sessão)
  2. Lê `session_token` cookie
  3. `revokeSession(sessionToken)` — se token existir
  4. `clearAuthCookies()` — remove session_token, access_token, refresh_token
  5. Se usuário logado, log `LOGOUT`
  6. Retorna sucesso
- **Validação**: Nenhuma
- **Dependências**: `revokeSession`, `clearAuthCookies`, `getCurrentUser`, `successResponse`/`errorResponse`, `createLog`, `cookies`
- **Problemas**: `revokeSession` **não está exportada** em `session.ts` — causará erro em runtime ao tentar revogar a sessão
- **Observações**: `DELETE()` simplesmente chama `POST()`. O catch também limpa cookies e retorna sucesso (graceful degradation).

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/me/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required (com fallback)
- **Funções**: `GET()`
- **Fluxo**:
  1. `getCurrentUser()` — se null, tenta `refreshAccessToken()` e busca novamente
  2. Se ainda null, retorna 401
  3. Retorna `{ id, name, email, role, companyId, isActive, twoFactorEnabled, company: { name, status, planType, subscriptionStatus } }`
- **Validação**: Nenhuma
- **Dependências**: `getCurrentUser`, `refreshAccessToken`, `successResponse`/`errorResponse`
- **Problemas**: `twoFactorEnabled` **não existe no tipo retornado por `getCurrentUser`** — o select em `session.ts:161-177` não inclui `twoFactorEnabled`, então será `undefined` na resposta
- **Observações**: Implementa refresh automático de access token expirado.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/refresh/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public (usa cookie refresh_token)
- **Funções**: `POST()`
- **Fluxo**:
  1. Chama `refreshAccessToken()` que lê o refresh_token cookie, verifica JWT, busca usuário, gera novo access_token e sett no cookie
  2. Se falhar, retorna 401
- **Validação**: Nenhuma
- **Dependências**: `refreshAccessToken`, `successResponse`/`errorResponse`
- **Problemas**: Nenhum reportado
- **Observações**: Função mínima que delega toda a lógica para `session.ts`.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/forgot-password/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public
- **Funções**: `POST(request)`
- **Fluxo**:
  1. Parseia body com `forgotPasswordSchema`
  2. `findUnique` user por email
  3. Se não existir, retorna mensagem genérica (anti-enumeration)
  4. Gera `resetToken` (48 bytes) com `generateToken`, expira em 1h
  5. Atualiza `resetPasswordToken` e `resetPasswordExpires` no user
  6. Log `PASSWORD_RESET`
  7. Retorna mensagem genérica + `resetToken` em desenvolvimento
- **Validação**: `forgotPasswordSchema` (email)
- **Dependências**: `prisma`, `forgotPasswordSchema`, `successResponse`/`errorResponse`, `generateToken`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Anti-enumeration: mesma mensagem para email existente e inexistente. Token exposto apenas em `NODE_ENV=development`. Não envia email de fato.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/reset-password/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public (via token)
- **Funções**: `POST(request)`
- **Fluxo**:
  1. Parseia body com `resetPasswordSchema`
  2. `findFirst` user por `resetPasswordToken` + `resetPasswordExpires > now`
  3. Se não encontrado, retorna 400
  4. `hashPassword(password)` e atualiza user: novo hash, token null, expires null
  5. `revokeAllUserSessions(user.id)` — revoga todas as sessões
  6. Log `PASSWORD_RESET`
- **Validação**: `resetPasswordSchema` (token, password)
- **Dependências**: `prisma`, `resetPasswordSchema`, `hashPassword`, `successResponse`/`errorResponse`, `revokeAllUserSessions`, `createLog`
- **Problemas**: `revokeAllUserSessions` **não está exportada** em `session.ts` — causará erro em runtime
- **Observações**: Usa `findFirst` (não `findUnique`) porque `resetPasswordToken` não é unique no schema.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/verify-email/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public (via token)
- **Funções**: `POST(request)`
- **Fluxo**:
  1. Extrai `token` do body
  2. Valida se token foi enviado
  3. `findUnique` user por `emailVerificationToken`
  4. Se não encontrado, retorna 400
  5. Atualiza `emailVerified: true` e `emailVerificationToken: null`
- **Validação**: Nenhuma (validação manual de token presente)
- **Dependências**: `prisma`, `successResponse`/`errorResponse`
- **Problemas**: Nenhum reportado
- **Observações**: Não usa Zod. Rota simples de 34 linhas.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/2fa/setup/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required + ADMIN ou SUPER_ADMIN role
- **Funções**: `POST()`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. Verifica `role === "ADMIN" || role === "SUPER_ADMIN"` — 403 caso contrário (ATTENDANT/FINANCIAL/EMPLOYEE não configuram 2FA)
  3. `generateSecret(email)` (`src/lib/auth/two-factor.ts`) — segredo TOTP com label `AtendeAI:email`
  4. `generateRecoveryCodes(10)` — 10 códigos `XXXXXX-XXXXXX-XXXXXX` (hex)
  5. Salva `twoFactorSecret` (base32) e `twoFactorRecoveryCodes` (hash SHA-256 de cada código) no user
  6. Log `TWOFA_SETUP`
  7. Gera `qrCodeDataUrl` via pacote `qrcode` a partir do `otpauth_url`
  8. Retorna `{ secret, otpauth_url, qrCodeDataUrl, recoveryCodes }` — códigos exibidos **uma única vez**
- **Validação**: Nenhuma
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `two-factor.ts` (`generateSecret`/`generateQrDataUrl`/`generateRecoveryCodes`/`hashRecoveryCodes`), `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Secret é salvo antes da verificação (setup + verify em duas chamadas). Recovery codes são hasheados (SHA-256) no armazenamento — não são recuperáveis após a resposta.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/2fa/verify/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. Extrai `token` do body, valida tamanho 6
  3. Busca `twoFactorSecret` do user no DB
  4. `verifyTotp(twoFactorSecret, token)` (`src/lib/auth/two-factor.ts`) — delega ao `speakeasy.totp.verify` com window=1
  5. Se válido, ativa `twoFactorEnabled: true`
  6. Log `TWOFA_VERIFY`
- **Validação**: Manual (token length 6)
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `verifyTotp`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Verifica o token contra o secret salvo no setup.

---

#### `route.ts`
- **Caminho**: `src/app/api/auth/2fa/disable/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. Extrai `token` do body, valida tamanho 6
  3. Busca `twoFactorSecret` do user
  4. `verifyTotp` — se inválido, erro 400
  5. Se válido, limpa `twoFactorEnabled: false`, `twoFactorSecret: null` e `twoFactorRecoveryCodes: Prisma.JsonNull`
  6. Log `TWOFA_DISABLE`
- **Validação**: Manual (token length 6)
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `verifyTotp`, `createLog`, `Prisma`
- **Problemas**: Nenhum reportado
- **Observações**: Exige o código TOTP atual para desabilitar (confirmação). Códigos de recuperação também são descartados.

---

## Data (10 rotas)

---

#### `route.ts`
- **Caminho**: `src/app/api/clients/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required
- **Funções**: `GET(request)`, `POST(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401 se não logado
  2. Rate limit por company+IP (`checkDefaultRateLimit`)
  3. Parseia query params com `paginationSchema` (page, limit, search, status)
  4. Monta `where` clause: companyId, deletedAt:null, filtro search (name/phone/lastService), filtro status
  5. `findMany` com paginação + `count` total
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401 se não logado
  2. Parseia body com `clientSchema`
  3. Cria client com `companyId` + `date: new Date()`
  4. Log `USER_CREATE`
- **Validação**: `paginationSchema` (GET), `clientSchema` (POST)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `clientSchema`/`paginationSchema`, `createLog`, `checkDefaultRateLimit`/`getRateLimitHeaders`
- **Problemas**: Nenhum reportado
- **Observações**: Soft delete (`deletedAt: null`). Rate limit de 429. Paginação com `page`, `limit`, `total`, `totalPages`.

---

#### `route.ts`
- **Caminho**: `src/app/api/clients/[id]/route.ts`
- **Métodos HTTP**: `GET`, `PUT`, `DELETE`
- **Autenticação**: required
- **Funções**: `GET(request, { params })`, `PUT(request, { params })`, `DELETE(request, { params })`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. `params.id` extraído via `await params`
  3. Helper `getClientForCompany(id, companyId)` — busca client com `deletedAt: null`
  4. Se não encontrado, 404
  5. **PUT**: parseia body com `clientSchema.partial()`, atualiza cliente, log `USER_UPDATE` com old/new values
  6. **DELETE**: soft delete (`deletedAt: new Date()`), log `DATA_DELETE`
- **Validação**: `clientSchema.partial()` no PUT
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`notFoundResponse`, `clientSchema`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Sempre escopado por `companyId`. Soft delete via campo `deletedAt`.

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required
- **Funções**: `GET()`, `POST(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401 se não logado
  2. `findMany` conversations por `companyId`, ordenado por `updatedAt desc`
  3. Inclui última mensagem (`messages: { take: 1, orderBy: { createdAt: desc } }`) e `handledBy` (id, name)
  4. Mapeia resultado com `id, phone, name, status, unread, lastMessage, lastMessageAt, createdAt, updatedAt, clientId, handledBy, handledAt`
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401 se não logado
  2. Cria conversation com `companyId`, phone (default "cliente-teste"), name, status "OPEN", unread true
- **Validação**: Nenhuma
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`
- **Problemas**: Nenhum reportado
- **Observações**: POST não valida body com Zod — qualquer campo é aceito. Phone default "cliente-teste" se não enviado.

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/[id]/route.ts`
- **Métodos HTTP**: `GET`, `PATCH`
- **Autenticação**: required
- **Funções**: `GET(request, { params })`, `PATCH(request, { params })`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401 se não logado
  2. `findFirst` conversation por `id` + `companyId`
  3. Inclui `messages` (ordenadas ASC) e `client` (select parcial)
  4. Se `conversation.clientId` for null:
     - Busca client existente por `phone` + `companyId`
     - Se não existir, cria client com phone, name, companyId
     - Atualiza conversation com `clientId`
- **Fluxo (PATCH)**:
  1. `getCurrentUser()` — 401 se não logado
  2. `findFirst` conversation por `id` + `companyId`
  3. Atualiza com `data: body` (qualquer campo)
- **Validação**: Nenhuma
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`notFoundResponse`
- **Problemas**: Nenhum reportado
- **Observações**: Auto-criação de client na leitura. PATCH aceita qualquer campo sem validação Zod.

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/[id]/messages/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required
- **Funções**: `GET(request, { params })`, `POST(request, { params })`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401 se não logado
  2. `loadConversationContext(id, companyId)` — 404 se não encontrada
  3. `findMany` messages por `conversationId`, ordenadas ASC
  4. Marca a conversa como lida (`unread: false`) e publica evento `conversation` (SSE)
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401 se não logado
  2. `loadConversationContext(id, companyId)` — 404 se não encontrada (expõe `handledById` e `phone`)
  3. Valida `body.content` (string)
  4. Se a conversa foi **assumida por um humano** (`handledById` preenchido): salva a mensagem (role `assistant`) e `reply = body.content` — sem IA
  5. Caso contrário: verifica `aiConfig` (400 se ausente) e chama `generateAIResponse({ conversationId, message, company, knownName })` — fachada que delega ao `conversation-manager.processMessage()`; o manager salva a mensagem do usuário, carrega/persiste o estado, detecta intenção, monta prompt, chama o LLM e aplica guardrails; se confirmado, persiste `Appointment`
  6. Atualiza `lastMessage`/`lastMessageAt`/`unread: false`
  7. Se a conversa tem `phone`, envia a resposta ao WhatsApp via `deliverWhatsAppMessage` (`src/lib/whatsapp/deliver.ts`) — busca `WhatsAppConfig` CONNECTED da empresa, descriptografa o token e chama a Graph API
  8. Publica eventos `message` + `conversation` (SSE)
  9. Retorna `{ role: "assistant", content, type, conversationId, handled }`
- **Validação**: Manual (body.content string)
- **Dependências**: `prisma`, `getCurrentUser`, `generateAIResponse`, `loadConversationContext`, `deliverWhatsAppMessage`, `publish` (`src/lib/realtime`), `successResponse`/`errorResponse`/`unauthorizedResponse`/`notFoundResponse`
- **Problemas**: Nenhum reportado
- **Observações**: O código controla o fluxo da conversa (state machine); a IA só gera texto. Em modo humano, a resposta é enviada direto ao WhatsApp sem passar pela IA. Erros de guardrails/agendamento retornam mensagens específicas (500).

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/[id]/takeover/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request, { params })`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. `findFirst` conversation por `id` + `companyId` — 404 se não encontrada
  3. Atualiza `handledById: user.id` e `handledAt: new Date()`
  4. Publica evento `conversation` (SSE)
  5. Retorna `{ id, handledById, handledAt, handledBy: { id, name } }`
- **Observações**: Com a conversa assumida, o webhook do WhatsApp passa a salvar as mensagens do cliente sem acionar a IA, e o painel responde diretamente (ver `messages/route.ts`).

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/[id]/release/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request, { params })`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. `findFirst` conversation por `id` + `companyId` — 404 se não encontrada
  3. Atualiza `handledById: null` e `handledAt: null`
  4. Publica evento `conversation` (SSE)
  5. Retorna `{ id, handledById, handledAt, handledBy }`
- **Observações**: Devolve a conversa ao fluxo automático da IA.

---

#### `route.ts`
- **Caminho**: `src/app/api/conversations/events/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required
- **Funções**: `GET(request)` — Server-Sent Events (SSE)
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. Cria `ReadableStream` com `Content-Type: text/event-stream`
  3. Assina eventos do `src/lib/realtime` (EventEmitter) filtrados por `companyId`
  4. Eventos nomeados: `ready` (na conexão), `heartbeat` (a cada 15s), `message` (`{ conversationId, role, content }`), `conversation` (`{ id }`)
  5. Limpa a assinatura e fecha o stream em `abort`/`close`
- **Observações**: Sem infraestrutura externa (Redis/WS) — SSE em memória no processo. Em múltiplas instâncias/deploy serverless, o cliente usa o polling de fallback da UI (20s). Headers `Cache-Control: no-cache` + `X-Accel-Buffering: no`.

---

#### `route.ts`
- **Caminho**: `src/app/api/schedule/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required
- **Funções**: `GET(request)`, `POST(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. Lê query params `date`, `month`, `year`
  3. Se `date` fornecido: filtra por dia (00:00:00.000Z a 23:59:59.999Z)
  4. Se `month` + `year` fornecidos: filtra por mês completo
  5. `findMany` com `companyId`, `deletedAt: null`, ordenado por date+time ASC
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401
  2. Parseia body com `appointmentSchema`
  3. Cria appointment com `date: new Date(date + "T12:00:00.000Z")`, `companyId`
  4. Log `USER_CREATE`
- **Validação**: `appointmentSchema` no POST
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `appointmentSchema`/`paginationSchema`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Filtro flexível por dia ou mês. Horário fixo 12:00 UTC para a data.

---

#### `route.ts`
- **Caminho**: `src/app/api/schedule/[id]/route.ts`
- **Métodos HTTP**: `GET`, `PATCH`, `DELETE`
- **Autenticação**: required + permissão `company:view_schedule` (GET) / `company:manage_schedule` (PATCH/DELETE)
- **Fluxo (GET)**: `findFirst` por `{ id, companyId, deletedAt: null }`; 404 se não pertencer à empresa (isolamento multi-tenant)
- **Fluxo (PATCH)**: `{ status }` restrito a `pending | confirmed | cancelled | completed`; atualiza e loga `USER_UPDATE`
- **Fluxo (DELETE)**: soft-delete (`deletedAt: now`) + log `DATA_DELETE`
- **Validação**: status whitelist manual

---

#### `route.ts`
- **Caminho**: `src/app/api/settings/route.ts`
- **Métodos HTTP**: `GET`, `PUT`
- **Autenticação**: required
- **Funções**: `GET()`, `PUT(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. `findUnique` company com include: `settings`, `aiConfig` (com services, faq)
  3. Retorna: `companyName, phone, address, hours, welcomeMessage, absenceMessage, services, faq, autoTransfer, autoReminders, requireConfirmation`
- **Fluxo (PUT)**:
  1. `getCurrentUser()` — 401
  2. Parseia body com `companySettingsSchema`
  3. Extrai `services, faq, welcomeMessage, absenceMessage, autoTransfer, autoReminders, requireConfirmation, companyName, phone, address, hours`
  4. Atualiza `Company` (campos diretos)
  5. Upsert `CompanySettings` (autoTransfer, autoReminders, requireConfirmation)
  6. Upsert `AIConfig` (welcomeMessage, absenceMessage) + replace completo de services e faq
  7. Log `AI_CONFIG_CHANGE`
- **Validação**: `companySettingsSchema`
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `companySettingsSchema`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: PUT sobrescreve completamente services e faq (deleteMany + createMany).

---

#### `route.ts`
- **Caminho**: `src/app/api/subscription/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required
- **Funções**: `GET()`, `POST(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. `findUnique` company com select: `planType, subscriptionStatus, stripeCustomerId, stripeSubscriptionId, trialEndsAt, createdAt`
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401
  2. Extrai `planType` do body
  3. Valida se é `STARTER`, `PRO` ou `BUSINESS`
  4. Busca planType anterior para log
  5. Atualiza company com novo planType + subscriptionStatus "ACTIVE"
  6. Log `PLAN_CHANGE` com old/new values
- **Validação**: Manual (whitelist de planos)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Não integra com Stripe no momento da mudança — apenas atualiza o DB.

---

#### `route.ts`
- **Caminho**: `src/app/api/profile/route.ts`
- **Métodos HTTP**: `GET`, `PUT`, `PATCH`
- **Autenticação**: required
- **Funções**: `GET()`, `PUT(request)`, `PATCH(request)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. `findUnique` user com select: `id, name, email, phone, role, avatarUrl, twoFactorEnabled`
- **Fluxo (PUT)**:
  1. `getCurrentUser()` — 401
  2. Parseia body com `profileUpdateSchema`
  3. Atualiza user com dados parseados
- **Fluxo (PATCH)**:
  1. `getCurrentUser()` — 401
  2. Se body contém `password`, parseia com `passwordChangeSchema`
  3. Busca `passwordHash` atual
  4. `verifyPassword(currentPassword, hash)` — 400 se inválido
  5. `hashPassword(newPassword)` e atualiza
  6. Log `PASSWORD_CHANGE`
- **Validação**: `profileUpdateSchema` (PUT), `passwordChangeSchema` (PATCH)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `profileUpdateSchema`/`passwordChangeSchema`, `hashPassword`/`verifyPassword`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: PUT para dados do perfil, PATCH apenas para troca de senha. Verifica senha atual antes de alterar.

---

#### `route.ts`
- **Caminho**: `src/app/api/upload/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `formData()` — extrai campo `file`
  3. Valida tamanho (MAX_FILE_SIZE, default 5MB)
  4. Valida extensão (whitelist: .jpg, .jpeg, .png, .webp, .gif, .pdf, .txt, .doc, .docx, .xls, .xlsx)
  5. Valida extensões bloqueadas (.exe, .bat, .sh, .py, .php, etc.)
  6. Valida MIME type (whitelist)
  7. Gera nome seguro com `sanitizeFilename` + `crypto.randomUUID()` + extensão
  8. Cria diretório `public/uploads/{companyId}/`
  9. Salva arquivo em disco
  10. Cria registro `Upload` no DB
  11. Retorna `{ url, name, size, id }`
- **Validação**: Manual (tamanho, extensão, MIME)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`, `createLog`, `sanitizeFilename`, `writeFile`/`mkdir` (fs/promises), `path`, `crypto`
- **Problemas**: Nenhum reportado
- **Observações**: Uploads salvos em `public/uploads/`. Log de atividade suspeita se extensão bloqueada for tentada.

---

#### `route.ts`
- **Caminho**: `src/app/api/files/[id]/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required (ou token público)
- **Funções**: `GET(request, { params })`
- **Fluxo**:
  1. Extrai `id` dos params e `token` da query string
  2. Se não há user nem token: 401
  3. Se `token` presente: `validateFileToken(token)` — verifica validade + uploadId match
  4. Se `user` presente: `validateFileAccess(id, userId, companyId, role)`
  5. Se upload não encontrado: 404
  6. Verifica se arquivo existe em disco
  7. Lê buffer e retorna `Response` com Content-Type, Content-Disposition, Content-Length, Cache-Control, X-Content-Type-Options
- **Validação**: Nenhuma
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`notFoundResponse`, `validateFileAccess`/`validateFileToken`, `readFile` (fs/promises), `path`, `existsSync` (fs)
- **Problemas**: Nenhum reportado
- **Observações**: Suporta acesso via token (links compartilháveis) ou autenticação. Cache privado de 1h.

---

## Public Booking (3 rotas) — agendamento online

---

#### `route.ts`
- **Caminho**: `src/app/api/public/companies/[slug]/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: public
- **Fluxo**: `getPublicCompany(slug)` → empresa ativa (não deletada, `status: ACTIVE`) com settings, aiConfig.services ordenados; retorna `{ companyId, slug, name, phone, address, hours, welcomeMessage, services, bookingEnabled }`
- **Observações**: Não expõe dados sensíveis (tokens, emails de staff, etc). 404 se não encontrada.

---

#### `route.ts`
- **Caminho**: `src/app/api/public/companies/[slug]/slots/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: public
- **Parâmetros**: `date` (YYYY-MM-DD, obrigatório)
- **Fluxo**: valida empresa ativa + `bookingEnabled`; `getAvailableSlots(companyId, date, hours)` parseia horários ("08:00 às 18:00") em slots de 30min, remove ocupados (appointments do dia) e passados (se hoje)
- **Observações**: 403 se agendamento desabilitado, 400 se `date` inválido.

---

#### `route.ts`
- **Caminho**: `src/app/api/public/companies/[slug]/appointments/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public + rate limit (`public-booking:IP`)
- **Fluxo**: `publicBookingSchema` (name, phone, email opcional, date, time, service) → valida empresa ativa + `bookingEnabled` + horário disponível → upsert de `Client` por phone (update name/email/lastService) → cria `Appointment` status `pending` → log `AI_APPOINTMENT_CREATE`
- **Observações**: 409 se horário indisponível. Página `/b/[slug]`.

---

## System (3 rotas)

---

#### `route.ts`
- **Caminho**: `src/app/api/health/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: public
- **Funções**: `GET()`, `checkDatabase()`, `checkOpenAI()`, `checkStripe()`, `checkSMTP()`, `checkStorage()`
- **Fluxo**:
  1. Gera `requestId`
  2. Executa 5 health checks em paralelo (`Promise.allSettled`):
     - **Database**: query `SELECT 1` via circuit breaker
     - **OpenAI**: GET `api.openai.com/v1/models` com timeout 3s (degraded se não configurado)
     - **Stripe**: `balance.retrieve()` (degraded se não configurado)
     - **SMTP**: conexão TCP na porta configurada com timeout 3s (degraded se não configurado)
     - **Storage**: verifica/acessa diretório de upload
  3. Determina status overall: healthy / degraded / unhealthy
  4. Coleta memória (heap, rss) e CPU (user, system)
  5. Log estruturado
  6. Retorna JSON com todos os checks + metadados
  7. Status HTTP: 200 se healthy ou degraded, 503 se unhealthy
- **Validação**: Nenhuma
- **Dependências**: `prisma`, `logger`, `dbCircuitBreaker`, `NextResponse`
- **Problemas**: Nenhum reportado
- **Observações**: Endpoint público e sem autenticação. Cache-Control: no-store. Stripe usa `require()` em vez de import.

---

#### `route.ts`
- **Caminho**: `src/app/api/test-supabase/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: public
- **Funções**: `GET()`
- **Fluxo**:
  1. Verifica se Supabase está configurado (`isSupabaseConfigured`)
  2. Se não, retorna erro com instruções
  3. Obtém cliente admin (`getSupabaseAdmin`)
  4. Query `companies` com limit 5
  5. Retorna dados ou erro
- **Validação**: Nenhuma
- **Dependências**: `getSupabaseAdmin`, `isSupabaseConfigured`, `NextResponse`
- **Problemas**: Nenhum reportado
- **Observações**: Endpoint de diagnóstico. Usa `NextResponse.json` diretamente, não os helpers `successResponse`/`errorResponse`.

---

#### `route.ts`
- **Caminho**: `src/app/api/webhooks/stripe/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: public (validação via Stripe signature)
- **Funções**: `POST(request)`, `mapPriceIdToPlan(priceId)`, `mapStripeStatus(status)`
- **Fluxo**:
  1. Lê body raw + header `stripe-signature`
  2. Se sem assinatura, log `WEBHOOK_FAILED`, erro 400
  3. `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — se inválido, log + erro 400
  4. `processStripeEvent(event)` (`src/lib/billing/stripe-webhook.ts`) com deduplicação idempotente: `claimEvent` garante o registro único de `WebhookEvent` (unique `provider+signature`) e claim atômico; replay de evento já processado → `"skipped"`; falha → status `failed` + log `WEBHOOK_FAILED` (retentável em novo delivery do Stripe)
  5. Switch por `event.type`:
     - **checkout.session.completed**: ativa assinatura (ACTIVE) e promove planType — **única fonte de confirmação de pagamento**
     - **customer.subscription.updated**: sincroniza status; promove planType **somente** quando status `ACTIVE`/`TRIALING`; `INCOMPLETE`/`PAST_DUE`/`UNPAID` não promovem plano
     - **customer.subscription.deleted**: marca CANCELED
     - **invoice.paid**: registra `PAYMENT_SUCCESS` + envia fatura por e-mail
     - **invoice.payment_failed**: marca PAST_DUE + log `PAYMENT_FAILURE`
  6. Retorna `{ received: true }`
- **Validação**: Stripe webhook signature (constructEvent)
- **Dependências**: `prisma`, `errorResponse`, `createLog`, `src/lib/billing/{stripe-webhook,stripe,plans,coupons,subscription,email}.ts`
- **Problemas**: Nenhum reportado
- **Observações**: `incrementCouponUsage` é executado aqui (e apenas aqui), após confirmação do pagamento. Price IDs lidos de `STRIPE_STARTER/PRO/BUSINESS/ENTERPRISE_PRICE_ID`.

---

#### `route.ts`
- **Caminho**: `src/app/api/webhooks/whatsapp/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: public (validação via HMAC com `META_APP_SECRET`)
- **Funções**: `POST(request)`, `GET(request)`
- **Fluxo (POST)**:
  1. `guardRateLimit(request, "webhook-whatsapp:<ip>", "webhook")` — limite de 300 req/min por IP; excedido → 429 (`src/lib/rate-limit/with-rate-limit.ts`)
  2. Lê body raw + header `x-hub-signature-256`
  3. Valida assinatura via `verifyMetaSignature` (`src/lib/whatsapp/verify-signature.ts`): HMAC-SHA256 do body com `META_APP_SECRET` comparado via `timingSafeEqual`; exige prefixo `sha256=`; inválida → 401
  4. Parseia JSON e loga `WEBHOOK_RECEIVED`
  5. Salva `WebhookEvent` no DB (provider: whatsapp, event, payload, signature, status: received)
  6. Chama `processWhatsAppWebhook` (`src/lib/whatsapp/webhook.ts`):
      - Extrai mensagens de texto (ignora `statuses`/delivery receipts e mídia)
      - Descobre a empresa por `WhatsAppConfig.phoneNumberId` (`metadata.phone_number_id`, status `CONNECTED`); sem config → skip + log
      - **`enforceBilling(config.companyId)`** — empresa inadimplente (status `PAST_DUE`/`CANCELED`/trial expirado): mensagem **ignorada** (skip), log `BILLING_BLOCKED`, sem IA e sem envio
      - Get-or-create `Client` por `(companyId, phone)` via `findOrCreateWhatsAppClient`; `profile.name` → `Client.whatsappName`
      - Busca `Conversation` aberta por `(companyId, clientId)` (fallback por phone); cria se não existir
      - Reutiliza `loadConversationContext` + `processMessage` (ConversationManager) — WhatsApp é só canal de entrada/saída
      - `knownName` = `profile.name` válido ou `null` (mantém `needsName` se ausente)
      - Descriptografa o `accessToken` da config e envia a resposta via `sendWhatsAppMessage` (`src/lib/whatsapp/send-message.ts`) — `POST graph.facebook.com/v20.0/{phone_number_id}/messages` com o token da própria empresa
      - Atualiza `lastMessage`/`lastMessageAt`/`unread`
  7. Atualiza `WebhookEvent` para `processed` ou `failed` e retorna 200 sempre
- **Fluxo (GET)**:
  1. Lê query params `hub.mode`, `hub.verify_token`, `hub.challenge`
  2. Se `mode === "subscribe"` e `verifyWebhookToken` confere (`META_WEBHOOK_VERIFY_TOKEN`): retorna challenge
  3. Caso contrário: 403
- **Validação**: HMAC-SHA256 com `META_APP_SECRET`; verify token com `META_WEBHOOK_VERIFY_TOKEN`
- **Dependências**: `prisma`, `errorResponse`, `createLog`, `src/lib/whatsapp/*`, `src/lib/ai/*`
- **Problemas**: Nenhum reportado
- **Observações**: GET é usado pelo WhatsApp para verificação inicial do webhook. A resposta sempre é 200 para o Meta (que re-envia em não-200). O `accessToken` de cada empresa fica criptografado em `WhatsAppConfig` (nunca no `.env` nem no frontend).

#### Conexão do WhatsApp (Settings)
- **`POST /api/settings/whatsapp/connect`** — autenticado; recebe `{ phoneNumberId, businessAccountId, accessToken, phoneNumber }` (ex.: do Meta Embedded Signup); valida feature `whatsapp` do plano (403 se não tiver); salva `accessToken` criptografado (`src/lib/security/encryption.ts`) em `WhatsAppConfig` (upsert por `companyId`), status `CONNECTED`; loga `WHATSAPP_CONNECT`.
- **`POST /api/settings/whatsapp/disconnect`** — autenticado; marca `WhatsAppConfig` da empresa como `DISCONNECTED`; loga `WHATSAPP_DISCONNECT`.
- **`GET /api/settings/whatsapp/status`** — autenticado; retorna status/config da empresa **sem o accessToken**.

---

## Admin (5 rotas)

> **Nota**: Todas as rotas `admin/*` são globais da plataforma e exigem `role === "SUPER_ADMIN"` (não `ADMIN`). O `ADMIN` é restrito à própria empresa.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/stats/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN role
- **Funções**: `GET()`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "SUPER_ADMIN"` — 403
  3. 8 queries paralelas:
     - Total companies (deletedAt: null)
     - Active companies (status: ACTIVE)
     - Suspended companies
     - Total active users
     - Total clients (deletedAt: null)
     - Total appointments (deletedAt: null)
     - New companies this month
     - `groupBy` planType com `_count`
  4. Calcula distribuição de planos e MRR estimado (STARTER: R$59, PRO: R$119, BUSINESS: R$249)
  5. Retorna `{ companies: { total, active, suspended }, users, clients, appointments, newCompaniesThisMonth, planDistribution, estimatedMRR }`
- **Validação**: Nenhuma
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`
- **Problemas**: Nenhum reportado
- **Observações**: MRR é estimado com base no planType, não no Stripe real.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/companies/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "SUPER_ADMIN"` — 403
  3. Parseia query params com `paginationSchema` (page, limit, search, status)
  4. Monta `where` com search (name, slug) e status
  5. `findMany` companies com `_count` de users, clients, appointments
  6. Paginação
- **Validação**: `paginationSchema`
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`, `paginationSchema`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Lista global de empresas (sem filtro de companyId, diferente das rotas tenant-scoped).

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/companies/[id]/route.ts`
- **Métodos HTTP**: `GET`, `PATCH`, `DELETE`
- **Autenticação**: required + SUPER_ADMIN role
- **Funções**: `GET(request, { params })`, `PATCH(request, { params })`, `DELETE(request, { params })`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. `role !== "SUPER_ADMIN"` — 403
  3. `findUnique` company com includes: `users` (select parcial), `settings`, `aiConfig` (com services, faq), `_count` de tudo
- **Fluxo (PATCH)**:
  1. `getCurrentUser()` — 401, role check 403
  2. Filtra campos permitidos: `status`, `planType`, `name`, `subscriptionStatus`
  3. Se `status === "SUSPENDED"`: desativa todos os usuários + revoga sessões
  4. Se `status === "ACTIVE"": reativa todos os usuários
  5. Log `USER_UPDATE` com old/new values
- **Fluxo (DELETE)**:
  1. `getCurrentUser()` — 401, role check 403
  2. `deleteMany` sessions da company
  3. Soft delete: `deletedAt` + status `CANCELLED`
  4. Log `DATA_DELETE`
- **Validação**: Manual (whitelist de campos no PATCH)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`/`notFoundResponse`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Soft delete da empresa. Suspensão propaga para usuários e sessões.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/audit/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "SUPER_ADMIN"` — 403
  3. Parseia query params com `paginationSchema` + `search`, `companyId`, `action` avulsos
  4. Monta `where` com filtros opcionais
  5. `findMany` auditLogs com includes: `user` (name, email, role), `company` (name)
- **Validação**: `paginationSchema` (parcial)
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`, `paginationSchema`
- **Problemas**: Nenhum reportado
- **Observações**: Filtros por companyId e action. Ordenado por createdAt desc.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/logs/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "SUPER_ADMIN"` — 403
  3. Parseia query params com `paginationSchema` + `action`, `companyId`
  4. `findMany` auditLogs com includes: `user` (name, email), `company` (name)
  5. Paginação
- **Validação**: `paginationSchema`
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`, `paginationSchema`
- **Problemas**: Nenhum reportado (quase idêntico a admin/audit)
- **Observações**: Muito similar a `admin/audit/route.ts`, mas com select diferente (não inclui role do user) e chave `logs` em vez de `auditLogs` na resposta.

---

## Billing (7 rotas) — fase SaaS

---

#### `route.ts`
- **Caminho**: `src/app/api/billing/plans/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required (qualquer role)
- **Funções**: `GET()`
- **Fluxo**: `getCurrentUser()` (401) → `listActivePlans()` (`src/lib/billing/plans.ts`) → retorna planos ativos com `code, name, description, price (centavos), features, limits`
- **Observações**: Planos: FREE (R$0), STARTER (R$59), PRO (R$119), BUSINESS (R$249), ENTERPRISE (R$599). Preços em centavos.

---

#### `route.ts`
- **Caminho**: `src/app/api/billing/checkout/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required + permissão `company:manage_billing` (ADMIN/SUPER_ADMIN)
- **Funções**: `POST(request)`
- **Fluxo**:
  1. `requirePermission("company:manage_billing")` — 401/403
  2. `guardRateLimit(request, "checkout:<ip>")` — 60/min; excedido → 429
  3. Parseia body com `checkoutSchema` (planCode, couponCode opcional, successUrl, cancelUrl)
  4. `getPlanByCode` — 404 se plano inexistente ou inativo
  5. Se `couponCode`: `validateCoupon` (`src/lib/billing/coupons.ts`) — inválido → 400
  6. `computeDiscount(price, type, value)` → valor final
  7. Valida config Stripe: sem `STRIPE_SECRET_KEY` → 503; Price ID do plano ausente (`getMissingStripePriceIds`) → 503. Não há mais modo demo.
  8. `createCheckoutSession` (`src/lib/billing/stripe.ts`) com price ID por env, metadata `companyId/planCode/couponCode`; lança `StripeConfigError` → 503; qualquer outro erro → 502
  9. **Não grava assinatura nem promove plano antes do pagamento** — o Stripe é a fonte de verdade e a confirmação ocorre via webhook (`checkout.session.completed` / `customer.subscription.updated`). Retorna `{ mode: "stripe", url, checkoutSessionId, amount }`
- **Validação**: `checkoutSchema`
- **Dependências**: `requirePermission`, `prisma`, `src/lib/billing/{plans,coupons,stripe}.ts`, `guardRateLimit`
- **Observações**: `incrementCouponUsage` é contabilizado apenas no webhook, após confirmação do Stripe.

---

#### `route.ts`
- **Caminho**: `src/app/api/billing/coupons/validate/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required
- **Funções**: `POST(request)`
- **Fluxo**: autentica → `validateCoupon(code, planCode)` → retorna `{ valid, reason?, coupon? }` ou 400 se inválido
- **Observações**: Verifica inativo, expirado, esgotado (`maxUses`/`usedCount`) e `allowedPlans`.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/coupons/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required + SUPER_ADMIN (via `requireRole`)
- **Fluxo (GET)**: lista cupons com paginação + filtro por status/código
- **Fluxo (POST)**: `couponSchema` → cria cupom; log `COUPON_CREATE`
- **Observações**: `code` normalizado em maiúsculas, unique.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/coupons/[id]/route.ts`
- **Métodos HTTP**: `PATCH`, `DELETE`
- **Autenticação**: required + SUPER_ADMIN
- **Fluxo**: `PATCH` atualiza campos (ativo/desconto/limites) com `couponSchema.partial()`, log `COUPON_UPDATE`; `DELETE` remove + log `COUPON_DELETE`

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/billing/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN
- **Fluxo**: totais (clientes/cobranças ativas, MRR), distribuição por plano/status, últimas 50 transações (`BillingHistory`)
- **Observações**: Dashboard financeiro global da plataforma.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/users/route.ts`
- **Métodos HTTP**: `GET`, `PATCH`, `DELETE`
- **Autenticação**: required + SUPER_ADMIN
- **Fluxo (GET)**: listagem paginada de usuários globais com busca (nome/email), filtros de status e papel, inclui empresa + contadores (sessions/conversas)
- **Fluxo (PATCH)**: `{ id, role?, isActive? }` → altera papel (restrito a `ADMIN`/`ATTENDANT`/`EMPLOYEE`/`FINANCIAL`) ou ativa/desativa; revoga sessions ao desativar; log `USER_UPDATE`
- **Fluxo (DELETE)**: `{ id }` → revoga sessions + soft-delete; log `USER_DELETE`
- **Observações**: Proteção: não modifica/exclui `SUPER_ADMIN` nem a si mesmo.

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/settings/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + SUPER_ADMIN
- **Fluxo**: status do ambiente (nodeEnv, URL base, versão), planos com contagem de assinantes, configuração de integrações (Stripe/WhatsApp/Resend/OpenAI) sem expor segredos, resumo de webhooks recebidos, contagem de API keys

---


- **Métodos HTTP**: `POST`
- **Autenticação**: public (validação via `stripe-signature`)
- **Fluxo**:
  1. `constructEvent` com `STRIPE_WEBHOOK_SECRET` — inválido → 400
  2. **checkout.session.completed**: `syncSubscriptionRow` (`src/lib/billing/subscription.ts`) grava/atualiza `Subscription` (upsert por companyId) + atualiza `Company.planType/subscriptionStatus` + log `PLAN_CHANGE`
  3. **customer.subscription.updated/deleted**: mapeia status Stripe → `Subscription.status` (active→ACTIVE, past_due→PAST_DUE, canceled/unpaid→CANCELED...)
  4. **invoice.paid**: `recordBilling` (`BillingHistory`) + log `PAYMENT_SUCCESS`
  5. **invoice.payment_failed**: grava `PAST_DUE` + log `PAYMENT_FAILURE`
- **Observações**: `src/lib/billing/subscription.ts` é a fonte de verdade (com fallback em `Company.planType/subscriptionStatus`).

---

## Dashboard (2 rotas) — relatórios e estatísticas

---

#### `route.ts`
- **Caminho**: `src/app/api/dashboard/stats/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required (qualquer papel autenticado)
- **Fluxo**: cards (clientes, conversas hoje, agendamentos hoje, taxa de resposta), gráfico de 7 dias (agendamentos/conversas por dia), 5 conversas recentes, agenda de hoje

---

#### `route.ts`
- **Caminho**: `src/app/api/dashboard/reports/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required
- **Parâmetros**: `range` (7d | 30d | 90d)
- **Fluxo**: totais com variação mês a mês, serviços mais procurados, horários de pico (agrupado por hora) e status das conversas

---

## Cron (1 rota) — lembretes automáticos

---

#### `route.ts`
- **Caminho**: `src/app/api/cron/reminders/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: header `x-cron-secret` deve bater com `CRON_SECRET` (env); sem ela → 503, mismatch → 401
- **Fluxo**: `runAppointmentReminders()` (`src/lib/reminders/index.ts`) busca agendamentos nas próximas 24h (min 2h antes) com `reminderSentAt: null` e `deletedAt: null`; por empresa: pula se `settings.autoReminders` off ou cliente sem contato; envia WhatsApp (credenciais `WhatsAppConfig` descriptografadas com AES-GCM) e/ou email (template `AppointmentReminder`), marca `reminderSentAt`, log `EMAIL_SENT`/`EMAIL_FAILED`
- **Execução manual**: `npx tsx scripts/run-reminders.ts`
- **Observações**: Public no middleware (fora de auth de sessão, validado por secret).

---

## Company Users (2 rotas) — fase SaaS

---

#### `route.ts`
- **Caminho**: `src/app/api/company/users/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: required + permissão `company:manage_users` (ADMIN/SUPER_ADMIN)
- **Fluxo (GET)**: lista usuários ativos da empresa
- **Fluxo (POST)**: `createUserSchema` (name, email, password, role) → role restrita a `ATTENDANT`/`EMPLOYEE`/`FINANCIAL` (nunca cria admin); `hashPassword`; `checkUserLimit` por plano (FREE = 1 usuário) → 402 se excedido; log `USER_CREATE`

---

#### `route.ts`
- **Caminho**: `src/app/api/company/users/[id]/route.ts`
- **Métodos HTTP**: `PATCH`, `DELETE`
- **Autenticação**: required + permissão `company:manage_users`
- **Fluxo (PATCH)**: `updateUserSchema` → altera role/ativo; log `USER_UPDATE`
- **Fluxo (DELETE)**: revoga sessions + soft-delete; log `DATA_DELETE`
- **Observações**: Proteção: não edita/exclui `SUPER_ADMIN` nem a si mesmo.

---

## LGPD (2 rotas) — fase SaaS

---

#### `route.ts`
- **Caminho**: `src/app/api/account/data-export/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required + permissão `company:export_data` (ADMIN/SUPER_ADMIN)
- **Fluxo**: `dataExportScopeSchema` (scope: all/clients/appointments/conversations) → monta payload JSON (empresa, clientes, agendamentos, conversas+mensagens; em `all` também usuários, settings, aiConfig, últimos 200 auditLogs) → log `DATA_EXPORT` → retorna `{ data }`
- **Observações**: Atende direito de portabilidade (Art. 18, V LGPD).

---

#### `route.ts`
- **Caminho**: `src/app/api/account/data-deletion/route.ts`
- **Métodos HTTP**: `POST`
- **Autenticação**: required + permissão `company:export_data`
- **Fluxo**: anonimiza em massa por `companyId`:
  - `Client`: name → "Usuário removido (LGPD)", phone "(removido)", email/whatsappName/notes null
  - `Appointment`: name anonimizado
  - `Conversation`: phone "(removido)", name anonimizado, `deletedAt: now`
  → log `DATA_DELETE`; retorna `{ affected: { clients, appointments, conversations } }`
- **Observações**: Atende direito de eliminação (Art. 18, VI LGPD). Operacionalização por anonimização para preservar integridade referencial.
