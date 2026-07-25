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
  1. Parseia body com `loginSchema` (Zod)
  2. Extrai IP e User-Agent dos headers
  3. `checkLoginRateLimit` por IP — se excedido, retorna `rateLimitResponse`
  4. `findUnique` user por email — se não existir, log `LOGIN_FAILURE` + erro 401
  5. `verifyPassword` — se inválido, cria `LoginAttempt` (success:false), log `LOGIN_FAILURE`, erro 401
  6. Verifica `isActive` do usuário e `company.status !== "SUSPENDED"`
  7. Se `user.twoFactorEnabled` e sem `totpCode` no body, retorna `requiresTwoFactor: true`
  8. Se TOTP presente, `speakeasy.totp.verify` com window=1
  9. `setAuthCookies(userId, companyId, role, ip, userAgent)` — cria session + accessToken + refreshToken
  10. Atualiza `lastLoginAt` e `lastLoginIp` no user
  11. Cria `LoginAttempt` com success:true
  12. `resetLoginAttempts(ip)`
  13. Log `LOGIN_SUCCESS`
  14. Retorna `{ user: { id, name, email, role, companyId, companyName } }`
- **Validação**: `loginSchema` (email, password, totpCode opcional)
- **Dependências**: `prisma`, `verifyPassword`, `setAuthCookies`, `loginSchema`, `successResponse`/`errorResponse`/`rateLimitResponse`, `checkLoginRateLimit`/`getRateLimitHeaders`/`resetLoginAttempts`, `createLog`, `verifyToken`, `speakeasy`
- **Problemas**: Nenhum reportado
- **Observações**: Usa `rateLimitResponse` próprio com headers `Retry-After` e `X-RateLimit-*`. Anti-enumeration: mesma mensagem "Email ou senha inválidos" para email inexistente e senha errada.

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
- **Autenticação**: required + ADMIN role
- **Funções**: `POST()`
- **Fluxo**:
  1. `getCurrentUser()` — 401 se não logado
  2. Verifica `role === "ADMIN"` — 403 caso contrário
  3. `speakeasy.generateSecret({ name: "AtendeAI:email" })`
  4. Salva `twoFactorSecret` no user
  5. Log `AI_CONFIG_CHANGE`
  6. Retorna `{ secret, otpauth_url }`
- **Validação**: Nenhuma
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `speakeasy`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Apenas ADMIN pode configurar 2FA. Secret é salvo antes da verificação (setup + verify em duas chamadas).

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
  4. `speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 })`
  5. Se válido, ativa `twoFactorEnabled: true`
  6. Log `AI_CONFIG_CHANGE`
- **Validação**: Manual (token length 6)
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `speakeasy`, `createLog`
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
  4. `speakeasy.totp.verify` — se inválido, erro 400
  5. Se válido, limpa `twoFactorEnabled: false` e `twoFactorSecret: null`
  6. Log `AI_CONFIG_CHANGE`
- **Validação**: Manual (token length 6)
- **Dependências**: `getCurrentUser`, `prisma`, `successResponse`/`errorResponse`, `speakeasy`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Exige o código TOTP atual para desabilitar (confirmação).

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
  3. Inclui última mensagem (`messages: { take: 1, orderBy: { createdAt: desc } }`)
  4. Mapeia resultado com `id, phone, name, status, unread, lastMessage, lastMessageAt, createdAt, updatedAt, clientId`
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
- **Funções**: `GET(request, { params })`, `POST(request, { params })`, `isGarbageResponse(content)`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401 se não logado
  2. Verifica conversation + companyId
  3. `findMany` messages por `conversationId`, ordenadas ASC
- **Fluxo (POST)**:
  1. `getCurrentUser()` — 401 se não logado
  2. Verifica conversation + companyId — verifica se `aiConfig` existe
  3. Valida `body.content` (string)
  4. Salva mensagem do usuário (role: "user")
  5. Busca histórico (últimas 20 mensagens)
  6. Filtra histórico removendo mensagens do assistente que são "garbage" (`isGarbageResponse`)
  7. Chama `generateAIResponse(cleanHistory, company + aiConfig data)`
  8. Verifica se resposta da IA é "garbage" — se for, erro 500
  9. Salva resposta (role: "assistant")
- **Validação**: Manual (body.content string)
- **Dependências**: `prisma`, `getCurrentUser`, `generateAIResponse`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`notFoundResponse`
- **Problemas**: Nenhum reportado
- **Observações**: `isGarbageResponse` detecta padrões como "sou um modelo de linguagem", "como uma ia", "meta", "llama". Histórico limpo é passado para a IA tanto para contexto quanto para a resposta.

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
  4. Switch por `event.type`:
     - **checkout.session.completed**: extrai customerId, subscriptionId, priceId → `updateMany` company com stripeCustomerId match, atualiza subscriptionId, status ACTIVE, planType
     - **customer.subscription.updated/deleted**: mapeia status Stripe → DB, atualiza company
     - **invoice.paid**: log `PAYMENT_SUCCESS`
     - **invoice.payment_failed**: atualiza status PAST_DUE, log `PAYMENT_FAILURE`
  5. Retorna `{ received: true }`
- **Validação**: Stripe webhook signature (constructEvent)
- **Dependências**: `prisma`, `errorResponse`, `createLog`
- **Problemas**: Nenhum reportado
- **Observações**: Stripe instanciado com `require()` inline. Helper `mapPriceIdToPlan` lê env vars `STRIPE_STARTER_PRO_BUSINESS_PRICE_ID`.

---

#### `route.ts`
- **Caminho**: `src/app/api/webhooks/whatsapp/route.ts`
- **Métodos HTTP**: `GET`, `POST`
- **Autenticação**: public (validação via HMAC)
- **Funções**: `POST(request)`, `GET(request)`
- **Fluxo (POST)**:
  1. Lê body raw + header `x-hub-signature-256`
  2. Se `webhookSecret` configurado e sem assinatura: log + erro 401
  3. Se `webhookSecret` configurado e com assinatura: calcula HMAC-SHA256 do body, compara com `timingSafeEqual`
  4. Parseia JSON
  5. Log `WEBHOOK_RECEIVED`
  6. Salva `WebhookEvent` no DB (provider: whatsapp, event, payload, signature, status: received)
- **Fluxo (GET)**:
  1. Lê query params `hub.mode`, `hub.verify_token`, `hub.challenge`
  2. Se `mode === "subscribe"` e token confere: retorna challenge
  3. Caso contrário: 403
- **Validação**: HMAC-SHA256 signature (condicional)
- **Dependências**: `prisma`, `errorResponse`, `createLog`, `crypto`
- **Problemas**: Nenhum reportado
- **Observações**: GET é usado pelo WhatsApp para verificação inicial do webhook. Assinatura é opcional se `WHATSAPP_WEBHOOK_SECRET` não configurado.

---

## Admin (5 rotas)

---

#### `route.ts`
- **Caminho**: `src/app/api/admin/stats/route.ts`
- **Métodos HTTP**: `GET`
- **Autenticação**: required + ADMIN role
- **Funções**: `GET()`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "ADMIN"` — 403
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
- **Autenticação**: required + ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "ADMIN"` — 403
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
- **Autenticação**: required + ADMIN role
- **Funções**: `GET(request, { params })`, `PATCH(request, { params })`, `DELETE(request, { params })`
- **Fluxo (GET)**:
  1. `getCurrentUser()` — 401
  2. `role !== "ADMIN"` — 403
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
- **Autenticação**: required + ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "ADMIN"` — 403
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
- **Autenticação**: required + ADMIN role
- **Funções**: `GET(request)`
- **Fluxo**:
  1. `getCurrentUser()` — 401
  2. `role !== "ADMIN"` — 403
  3. Parseia query params com `paginationSchema` + `action`, `companyId`
  4. `findMany` auditLogs com includes: `user` (name, email), `company` (name)
  5. Paginação
- **Validação**: `paginationSchema`
- **Dependências**: `prisma`, `getCurrentUser`, `successResponse`/`errorResponse`/`unauthorizedResponse`/`forbiddenResponse`, `paginationSchema`
- **Problemas**: Nenhum reportado (quase idêntico a admin/audit)
- **Observações**: Muito similar a `admin/audit/route.ts`, mas com select diferente (não inclui role do user) e chave `logs` em vez de `auditLogs` na resposta.
