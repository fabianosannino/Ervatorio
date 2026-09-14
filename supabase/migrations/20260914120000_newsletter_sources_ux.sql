-- ============================================================
-- Newsletter: origens novas para a captura contextual (handoff 14/09, D10)
-- ============================================================
-- Ate aqui a unica captura de e-mail do site era a pagina Pausa. O handoff
-- de UX poe formulario onde a intencao esta: o bloco "Avise-me" da home
-- (loja), a pagina do Clube, a ficha, a receita e o resultado de
-- "Encontre seu chá". Cada um manda um `source` proprio, e o `CHECK` de
-- `newsletter_source_check` so aceitava pausa|rodape|blog|checkout|admin.
--
-- Sem esta migration a Edge Function `newsletter-subscribe` REBAIXA fonte
-- desconhecida para 'pausa' — o e-mail entra, mas com a etiqueta errada, e
-- nao da para saber quem pediu aviso da loja e quem pediu a newsletter.
--
-- So amplia o CHECK. Nenhuma coluna, policy ou tabela muda.
--
-- ── ROLLBACK (documentado) ────────────────────────────────────
--   ALTER TABLE public.newsletter_subscribers
--     DROP CONSTRAINT IF EXISTS newsletter_source_check;
--   ALTER TABLE public.newsletter_subscribers
--     ADD CONSTRAINT newsletter_source_check
--     CHECK (source IN ('pausa','rodape','blog','checkout','admin'));
--   (falha se ja houver linha com fonte nova — apagar ou reetiquetar antes)
-- ============================================================
ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_source_check;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_source_check
  CHECK (source IN (
    'pausa', 'rodape', 'blog', 'checkout', 'admin',
    'loja',       -- "Avise-me quando a loja abrir" (home)
    'clube',      -- lista de espera / pre-venda do Clube
    'ficha',      -- "Receber esta ficha por e-mail"
    'receita',    -- "Receber esta receita por e-mail"
    'encontrar'   -- "Receber por e-mail" no resultado de Encontre seu chá
  ));
