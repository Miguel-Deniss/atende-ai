# Privacidade e retenção

Este documento descreve o comportamento técnico atual; não substitui revisão jurídica.

| Categoria                               | Comportamento atual                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Leads da demonstração                   | Consentimento registrado; exclusão automática após 90 dias                                      |
| Eventos de webhook concluídos ou mortos | Payload minimizado no sucesso; eventos antigos removidos após 30 dias                           |
| Tentativas de login                     | Removidas após 90 dias                                                                          |
| Sessões revogadas ou expiradas          | Removidas pelo job de retenção                                                                  |
| Clientes, conversas, mensagens e agenda | Mantidos enquanto necessários à conta; titular pode ser exportado ou anonimizado por `clientId` |
| Uploads                                 | Metadados entram na exportação; arquivo e registro respeitam autorização do tenant              |
| Cobrança                                | Deve seguir a retenção fiscal definida após revisão contábil/jurídica                           |

`POST /api/account/data-export` fornece exportação autenticada e tenant-scoped. `POST /api/account/data-deletion` recebe apenas `clientId` e anonimiza o titular dentro de transação. Exclusão da empresa é um fluxo administrativo distinto.

O cron protegido `/api/cron/retention` executa a limpeza automática. Provedores externos podem receber o mínimo necessário: Meta para mensagens, Stripe para billing, Resend para e-mail e o provedor de IA configurado para geração. Não envie documentos, segredos ou histórico desnecessário à IA.

Antes do lançamento, definir bases legais, controlador/operador, canal real do encarregado, prazos fiscais, subprocessadores, transferências internacionais e procedimento de resposta a titulares.
