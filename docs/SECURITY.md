# Segurança

## Controles implementados

- Sessões persistidas, access/refresh JWT com issuer, audience, tipo e identificador de sessão; refresh rotativo e revogação.
- Confirmação de e-mail obrigatória; TOTP opcional e códigos de recuperação de uso único.
- Tenant derivado da sessão e filtros `companyId`; `ADMIN` da empresa não possui bypass global.
- DTOs Zod e seleção explícita de campos mutáveis nas APIs revisadas.
- Verificação de `Origin` para mutações autenticadas, cookies `HttpOnly`, `Secure` em produção e `SameSite`.
- Rate limit distribuído pelo PostgreSQL com fallback em memória; limites específicos em autenticação, endpoints públicos, upload e webhooks.
- Upload privado, autorização por tenant, URL assinada curta, tamanho, extensão, MIME e magic bytes.
- Assinatura Meta obrigatória, deduplicação de webhooks e mensagens, retries e dead-letter.
- Logs estruturados com sanitização de campos sensíveis. Evite incluir payloads completos, telefones, tokens ou documentos em novas mensagens de log.

## Banco

O runtime usa uma role com DML, sem DDL. A role administrativa existe apenas no job de migration. A Data API permanece fechada. RLS não está ativo e não deve ser citado como controle existente.

## Pendências externas antes de produção

- Terminar o threat model e pentest independente.
- Tornar 2FA obrigatório para papéis administrativos, se essa for a decisão de risco.
- Configurar Sentry/monitoramento, alertas, WAF/rate limit de borda e rotação de segredos.
- Exercitar restore, rollback e resposta a incidentes.
- Avaliar antivírus/object storage para arquivos e Redis/BullMQ para escala superior.

Relate vulnerabilidades por um canal privado definido pela organização; não inclua segredos, dados pessoais ou exploração destrutiva.
