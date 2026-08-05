Analise todas as alterações já implementadas anteriormente.

Não reimplemente funcionalidades que já existam.

Não altere o design.

Não altere a experiência do usuário.

Não remova funcionalidades.

Implemente apenas melhorias que ainda não existam relacionadas à arquitetura SaaS, Supabase, Multi-Tenant, Row Level Security, Cloudflare e segurança da infraestrutura.

Antes de alterar qualquer código, identifique automaticamente o que já foi implementado e trabalhe apenas sobre o que estiver faltando.

Você é um Engenheiro de Software Sênior especializado em Arquitetura SaaS, Next.js, PostgreSQL, Supabase, Cloudflare e Segurança.

Meu sistema já possui uma primeira camada de segurança implementada.

Agora quero evoluir a arquitetura para um nível profissional.

Não altere nenhuma funcionalidade existente.

Não altere layout.

Não altere design.

Não remova componentes.

Implemente apenas melhorias.

---

## SUPABASE

Configure corretamente:

• Supabase Auth
• PostgreSQL
• Storage
• Row Level Security (RLS)
• Policies
• Sessões
• Refresh Tokens
• Storage Seguro

---

## ROW LEVEL SECURITY

Ativar RLS em todas as tabelas.

Criar Policies para:

- leitura
- escrita
- atualização
- exclusão

Garantir que:

Cada usuário veja apenas seus próprios dados.

Cada empresa visualize apenas seus próprios registros.

Nenhuma consulta ignore as Policies.

---

## MULTI TENANT

Transformar completamente o sistema em Multi-Tenant.

Cada empresa deve possuir isolamento completo de:

Clientes

Conversas

Agenda

IA

Planos

Assinatura

Configurações

Uploads

Arquivos

Histórico

Nunca permitir acesso cruzado.

Todas as consultas ao banco devem validar:

empresa_id

usuário

permissão

---

## STORAGE

Proteger Storage.

Cada empresa deve acessar somente seus próprios arquivos.

Bloquear acesso público quando não necessário.

Criar policies também para Storage.

---

## CLOUDFARE

Preparar todo o projeto para uso do Cloudflare.

Adicionar:

• Headers compatíveis
• Cache
• CDN
• SSL
• Firewall
• Proteção DDoS
• Rate Limit
• Proxy
• DNS Ready

Gerar documentação explicando como conectar o projeto ao Cloudflare.

---

## APIs

Refatorar todas as APIs.

Toda API deve validar:

Usuário

Empresa

Plano

Permissão

Sessão

Nunca confiar em parâmetros enviados pelo frontend.

---

## SESSÕES

Melhorar gerenciamento.

Adicionar:

Refresh Tokens

Expiração

Renovação automática

Logout seguro

Revogação de sessões

---

## AUTENTICAÇÃO

Melhorar integração entre:

Next.js

Supabase Auth

Middleware

Sessões

Cookies

Proteção das rotas

---

## BANCO

Melhorar estrutura.

Adicionar:

Índices

Constraints

Integridade Referencial

Foreign Keys

Otimização das consultas

---

## SEGURANÇA

Adicionar:

Proteção contra IDOR

Proteção contra Mass Assignment

Proteção contra Enumeration

Proteção contra Brute Force

Proteção contra Replay Attacks

---

## DOCUMENTAÇÃO

Gerar documentação técnica de:

RLS

Policies

Multi Tenant

Fluxo de autenticação

Fluxo do banco

Fluxo do usuário

Arquitetura

---

## RELATÓRIO

Ao terminar:

Liste tudo que foi implementado.

Explique o motivo.

Explique os benefícios.

Liste o que ainda depende de configuração manual.