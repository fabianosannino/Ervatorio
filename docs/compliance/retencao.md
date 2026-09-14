# Política de Retenção de Dados — Ervatório (Onda 2.3)

Referência operacional interna. A versão pública resumida está em `privacidade.html` (seção 6). Revisar com o(a) advogado(a) junto com as páginas legais.

## Tabela de retenção

| Dado | Onde vive | Retenção | Ao fim do prazo / exclusão de conta |
|---|---|---|---|
| Conta Auth (e-mail, login) | `auth.users` | Enquanto a conta existir | Excluído via `user-data-rights` (delete) |
| Perfil (nome, e-mail, sabores e momentos preferidos) | `user_profiles`, `user_preferences` | Enquanto a conta existir | CASCADE na exclusão da conta. Telefone, cidade e país deixaram de ser pedidos em 15/09/2026 (PR 08); as colunas existem para contas antigas e saem no export/exclusão |
| **Saúde e restrições (sensível)** — condições de lista fechada | `perfil_saude` (migration `20260915120000`) | Enquanto o consentimento durar | Retirar o consentimento = `DELETE` da linha pela própria tela (RLS do dono); CASCADE na exclusão da conta; sai no export. Nunca no `localStorage` nem no cache do SW |
| Diário de infusões (erva, horário, sensação de lista fechada) | `diario_infusoes` (migration `20260916120000`) | Enquanto a conta existir | CASCADE; sai no export. Registro novo só com o interruptor `diario` ligado; ler e apagar não dependem dele |
| Favoritos, inventário, histórico da roda, blends salvos | `user_favorites`, `user_inventory`, `tea_wheel_history`, `saved_recipes` | Enquanto a conta existir | CASCADE na exclusão da conta |
| `tasting_journal` | tabela antiga, **zero linhas**, nenhum código escreve | — | Limpeza própria pendente (D21): privilégios ainda são os de default |
| Endereços salvos | `user_addresses` | Enquanto a conta existir | CASCADE na exclusão da conta |
| Pedidos (valores, itens, status) | `orders`, `order_items` | **5 anos** após o exercício fiscal (obrigação fiscal/CDC) | Mantidos **anonimizados**: `user_id → NULL`, snapshot de endereço reduzido a cidade/UF/país, nome → `[excluído a pedido do titular]` |
| Payload de pagamento (auditoria) | `orders.payment_payload` | Igual ao pedido | Vazio hoje: a loja está fechada (`pagamentos` desligado) e o Mercado Pago está congelado sem uso. Revisar quando a Stripe entrar |
| Consentimento LGPD do cadastro | `user_profiles.lgpd_accepted_at` | Enquanto a conta existir | CASCADE; o registro de consentimento de pedidos antigos permanece implícito no pedido anonimizado |
| Escolha de cookies | `localStorage` do navegador (`erv_consent_v1`) | Até o usuário limpar/alterar | Controlado pelo próprio titular (banner) |
| Uso sem conta: estante, blend, blends salvos, carrinho, idioma, tema, perfil local, cache do catálogo e das fichas, monitor de cafeína (`erb_caf_<dia>`), resultado do teste de 1 minuto, opt-in da loja | `localStorage` (`erb_*`, `erv_loja_optin`) | Até o usuário limpar | Só no aparelho; nunca enviado ao servidor sem conta. O monitor de cafeína **nunca** sai do aparelho |
| Restrições de sessão do «Encontre seu chá» | memória do navegador (`encState`) | A sessão | Não vai para o servidor nem para o `localStorage` (`encontrar.spec.mjs` confere) |
| Newsletter (opt-in) | `user_profiles.newsletter_optin` (provedor externo na Onda 10) | Até revogação | Remoção imediata no descadastro |
| Newsletter anônima (e-mail, `source` = pausa/rodape/blog/checkout/admin/loja/clube/ficha/receita/encontrar, `locale`, `consent_at`) | `newsletter_subscribers` | **24 meses** sem interação, ou até revogação | `active = false` no descadastro; purga da linha após 24 meses inativos |
| Cliques de indicação (produto + data/hora) | `cliques_de_indicacao` (migration `20260816120000`) | Indefinida, como estatística | **Não é dado pessoal**: sem IP, hash, sessão ou conta, de propósito |
| Logs de Edge Functions | Supabase Logs | Retenção da plataforma (curta) | Automática |
| Contadores de rate limit | `edge_rate_limits` | ~1 dia (higiene automática) | Automática |
| Backups do banco | Supabase Backups/PITR | Janela do plano (dias) | Expiram automaticamente; dados excluídos desaparecem dos backups ao fim da janela |

## Caminhos de exclusão

1. **Autoatendimento**: menu do perfil → "Excluir minha conta" → Edge Function `user-data-rights` (anonimiza pedidos → deleta Auth user → CASCADE).
2. **Via encarregado (DPO)**: solicitação pelo canal da Política de Privacidade → admin executa a mesma function (ou `admin-delete-user` após anonimização) em até 15 dias.
3. **Backups**: a exclusão não remove o dado de backups já existentes; ele expira com a janela de retenção do backup. Em caso de solicitação expressa, documentar essa janela na resposta ao titular.
4. **Newsletter anônima** (`newsletter_subscribers`): **hoje é processo manual**. O inscrito não tem conta, e nenhuma policy permite que ele mesmo se descadastre — só admin. Ao receber o pedido pelo canal da Política de Privacidade, executar como `service_role`:

   ```sql
   delete from public.newsletter_subscribers where email = '<e-mail do titular>';
   ```

   Prazo: 15 dias, igual aos demais. **Isto continua sendo uma lacuna conhecida.** A Edge Function `newsletter-subscribe` já existe, mas ela cobriu a captação, não o descadastro — o link com token ficou para a etapa 3. Enquanto não existir, todo e-mail de campanha precisa trazer o endereço do encarregado em vez de um link de unsubscribe.

### Prova de consentimento (`consent_at`)

Até a Edge Function, `consent_at` era **escrivível pelo cliente**: a policy `newsletter_public_insert` tinha `WITH CHECK (true)`, então quem enviava o formulário podia mandar qualquer data. Evidência de consentimento que o próprio interessado pode forjar não sustenta a base legal.

Agora quem grava é o servidor: a function aceita só `email`, `source` e `locale`, e `consent_at` vem do `DEFAULT NOW()` da tabela. A policy pública de INSERT foi removida (migration `20260802040000`).

Vale ser exato sobre o que essa data prova: **o momento em que o formulário foi enviado, não a confirmação do titular.** Sem double opt-in, ninguém garante que o dono do endereço foi quem digitou. Para uma inscrição contestada, a defesa é fraca. O double opt-in fecha isso e está na etapa 3.

Reinscrição não ressuscita quem saiu: a function usa `ignoreDuplicates`, então reenviar o formulário com um e-mail que está `active = false` **não** o reativa.

## A versão pública

`privacidade.html` (v1.1, 14/09/2026) é o resumo público desta tabela. **Dado novo = linha aqui e linha lá**, no mesmo PR — a política que descreve o sistema de ontem é a que não protege ninguém. O que a v1.1 diz e o código sustenta: saúde com consentimento próprio (art. 11 I) e finalidade única; restrições de sessão sem servidor; diário sem texto livre; indicação sem identidade; cadastro só com nome e e-mail; loja fechada e operador de pagamento a nomear antes da abertura (o Mercado Pago saiu do texto); medição (GTM/GA4, Clarity, Meta Pixel) só com consentimento e hoje desativada (`ANALYTICS` vazio em `js/config.js`).

## Princípios

- **Minimização**: não coletamos dados que não usamos (auditar novos campos a cada feature).
- **Anonimização > exclusão** quando houver obrigação legal de guarda (fiscal).
- Alterações nesta política acompanham migration/PR — nunca ajuste manual sem versionamento.
