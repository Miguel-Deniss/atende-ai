# Cloudflare

Não há Worker, Pages ou configuração Cloudflare ativa neste repositório. Os arquivos antigos foram removidos porque conflitavam com headers e cache do Next.js, bloqueavam crawlers legítimos e continham placeholders.

Se Cloudflare for adotado futuramente, trate-o como projeto separado e revisado: TLS Full Strict, APIs e conteúdo privado sem cache, assets versionados com cache longo, webhooks e health checks liberados, rate limiting específico por rota e nenhuma regra genérica contra `bot`, `curl` ou `wget`. DNS, WAF, Turnstile e R2 dependem de decisão e autorização externas.
