# Regras de Engenharia — Ervatório

## Fluxo de trabalho (obrigatório)
- **Nunca** commite direto na `main`. Sempre crie branch `feat|fix|chore/<slug>` e abra PR (draft).
- Um PR = uma mudança pequena e revisável. Não misture temas.
- Só faça merge com: CI verde, preview Vercel validado e critérios de aceite atendidos.
- Toda mudança de risco vai atrás de **feature flag** (padrão: desligada em prod).
- Todo PR descreve: objetivo, o que muda, como testar, e **plano de rollback**.

## Segurança de dados (Supabase / Postgres)
- **Toda** tabela nova nasce com RLS habilitado. Sem exceção.
- Toda policy de `UPDATE`/`INSERT` tem `WITH CHECK` explícito. Nunca deixe colunas de privilégio (`is_admin`) editáveis pelo próprio usuário.
- Views que expõem dados de usuário usam `WITH (security_invoker = true)` ou não são concedidas a `authenticated`/`anon`.
- Operações que exigem `service_role`, recálculo de preço, ou integração externa vão para Edge Function — nunca para o cliente.
- Autorização (admin vs. usuário) é validada **no servidor** (Edge Function/RLS), nunca só no JavaScript do cliente.
- Nota de nomenclatura: em `user_profiles`, a coluna `role` é o perfil de chá do usuário (iniciante, tea_master…) e É editável pelo dono; as colunas de privilégio são `is_admin` e `admin_capabilities`.
- **`is_admin` diz se ENTRA no painel; `admin_capabilities` diz o que FAZ** (migration `20260815220000`). São dois eixos, e juntá-los foi o erro original: quem despachava pedido recebia junto o poder de apagar a base de usuários.
  - O predicado das policies é `public.tem_capacidade('<cap>')`, que exige `is_admin` **e** a capacidade — revogar o acesso ao painel basta para tirar tudo.
  - Capacidade nova entra em `public.capacidades_conhecidas()`; o `CHECK` recusa o que não estiver lá, para que erro de digitação não vire capacidade fantasma.
  - `admin_capabilities` é coluna de privilégio: só `service_role` escreve (trigger `trg_protect_profile_privileges`). Sem isso ela seria o caminho aberto que `is_admin` deixou de ser.
  - A lista em `js/admin.js` é **UX**: esconde o que não adianta clicar. Se ela e o banco divergirem, **o banco vence**.
  - Mexeu em policy ou capacidade? Rode `supabase/tests/20260815_rbac_capacidade_test.sql` — ele aplica a migration de verdade num Postgres descartável e prova as recusas.

## Interruptores — o que liga e desliga sem deploy

- A tabela `interruptores` (migration `20260815230000`) guarda **só chaves de
  operação**: decisão comercial que o admin vira. Protecão **não** entra ali —
  mora em variável de ambiente, fora do alcance do painel. A régua: *se
  desligar é proteção → ambiente; se ligar é decisão comercial → painel.*
- **O servidor é quem recusa.** `payments_enabled` valia só no navegador:
  `js/checkout.js` lia `window.SITE_SETTINGS` e nenhuma Edge Function conferia
  — quem virasse a variável no devtools chamava `create-order` do mesmo jeito.
  Agora `create-order` e `create-payment-preference` chamam `exigirLigado`
  (`supabase/functions/_shared/interruptores.ts`), que **falha fechada**.
- `site_settings.payments_enabled` virou **projeção** mantida por trigger. Os
  cinco leitores em `js/` seguem funcionando; a verdade tem um dono só. Não
  escreva naquela coluna — escreva no interruptor.
- Interruptor novo entra em `public.interruptores_conhecidos()` **e** na lista
  `ADM_INTERRUPTORES` de `js/admin.js`. O `CHECK` recusa o que não estiver na
  primeira; a segunda é UX e cada entrada declara **o que para de acontecer ao
  desligar**.
- Mexeu em interruptor? Rode `supabase/tests/20260815_interruptores_test.sql`.

## Segredos
- **Nunca** coloque `service_role`, tokens de API ou secrets em arquivos servidos ao navegador, no HTML, ou no repositório.
- Segredos vivem em Supabase Secrets / Vercel Environment Variables. A única chave pública aceitável é a `sb_publishable_...` (anon/publishable).
- Antes de commitar, rode varredura de segredos (gitleaks/trufflehog). O CI também roda.

## Migrations
- Toda mudança de schema é uma migration versionada e **idempotente** (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`), em `supabase/migrations/`.
- Teste a migration em um **Supabase branch (staging)** antes de aplicar em produção.
- Migrations nunca destroem dados sem backup verificado e passo de rollback documentado.

## Pagamentos (Mercado Pago)
- O total do pedido é **sempre** recalculado no servidor a partir do preço autoritativo do banco. Nunca confie em valor vindo do cliente.
- Toda mudança no fluxo de pagamento é testada em **sandbox** ponta-a-ponta antes de ir a produção.
- Não ligue pagamentos em produção enquanto a validação de assinatura do webhook não estiver funcionando ou uma decisão de risco documentada for tomada (ver `WEBHOOK_SIGNATURE_DEBT.md`).

## Compliance
- Nenhum script de tracking (analytics, pixel) dispara antes do **consentimento** do usuário (LGPD / Consent Mode v2).
- Dados pessoais têm base legal, política de retenção e caminho de exclusão.

## Qualidade (Definition of Done)
- Acessibilidade: elementos interativos são `<button>`/`<a>` reais, operáveis por teclado; modais com foco/ESC/`aria-modal`; contraste AA.
- Performance: nenhuma mudança piora LCP/TBT/CLS; imagens otimizadas; scripts com `defer`.
- Observabilidade: erros logados; mudanças críticas emitem evento/metrificação.
- Nunca quebre o checkout, o login ou o webhook de pagamento sem teste que prove o contrário.

## Ordem de prioridade em conflito
Segurança de dados > Compliance legal > Integridade de pagamento > Estabilidade > Performance > Nova feature.
