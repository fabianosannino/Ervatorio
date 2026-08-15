-- ============================================================
-- Interruptores — o que liga e desliga sem deploy
-- ============================================================
-- Hoje o unico interruptor do Ervatorio e `site_settings.payments_enabled`:
-- uma coluna booleana numa tabela de uma linha. Cada capacidade nova viraria
-- uma coluna nova, e a tabela nao diz nada sobre o que cada uma faz.
--
-- Pior: o interruptor **so vale no navegador**. `js/checkout.js` le
-- `window.SITE_SETTINGS.payments_enabled` e nenhuma Edge Function confere.
-- Quem virar a variavel no devtools chama `create-order` e
-- `create-payment-preference` do mesmo jeito. E a mesma forma do MFA que so
-- existia no cliente — um gate do lado de quem esta sendo checado.
--
-- ── A decisao ───────────────────────────────────────────────
-- Uma tabela chave-valor, com a regra dos dois niveis herdada da Fase 0:
--
--   se DESLIGAR e medida de protecao  -> variavel de ambiente (nao entra aqui)
--   se LIGAR e decisao comercial      -> chave que o admin vira (esta tabela)
--
-- Por isso a tabela guarda **so** chaves de operacao. Protecao nao mora em
-- lugar que o painel alcanca: um MFA que o painel desliga e um MFA que quem
-- invadiu o painel desliga.
--
-- ── Compatibilidade ─────────────────────────────────────────
-- `site_settings.payments_enabled` continua existindo e continua valendo, mas
-- vira PROJECAO: um trigger a mantem igual ao interruptor. Os cinco leitores
-- em js/ (app, checkout, ervaria, admin) seguem funcionando sem mudanca, e a
-- verdade passa a ter um dono so.
--
-- ── Como testar ─────────────────────────────────────────────
--   supabase/tests/20260815_interruptores_test.sql
--
-- ── ROLLBACK (documentado — NAO aplicar salvo emergencia) ────
--   DROP TRIGGER IF EXISTS trg_projetar_pagamentos ON public.interruptores;
--   DROP FUNCTION IF EXISTS public.projetar_pagamentos();
--   DROP FUNCTION IF EXISTS public.interruptor_ligado(text);
--   DROP TABLE IF EXISTS public.interruptores;
--   `site_settings.payments_enabled` guarda o ultimo valor projetado, entao a
--   loja continua no estado em que estava. O que volta e a falta de gate no
--   servidor.
-- ============================================================

-- ------------------------------------------------------------
-- 1) A tabela
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interruptores (
  chave        TEXT PRIMARY KEY,
  ligado       BOOLEAN NOT NULL,
  alterado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alterado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.interruptores IS
  'Chaves de operacao (decisao comercial). Protecao NAO entra aqui — mora em '
  'variavel de ambiente, fora do alcance do painel.';

-- A lista fechada, para que erro de digitacao nao vire interruptor fantasma:
-- gravado, nunca conferido, e a tela correspondente muda de comportamento sem
-- ninguem entender por que.
CREATE OR REPLACE FUNCTION public.interruptores_conhecidos()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'pagamentos',   -- checkout aceita pedido e cria preferencia no Mercado Pago
    'assinatura',   -- acesso exclusivo por assinatura (2o momento — nasce off)
    'indicacao',    -- vitrine de produto de terceiro por link de afiliado
    'newsletter'    -- captacao de e-mail no rodape e no modal
  ]::text[];
$$;

ALTER TABLE public.interruptores
  DROP CONSTRAINT IF EXISTS interruptores_chave_check;
ALTER TABLE public.interruptores
  ADD CONSTRAINT interruptores_chave_check
  CHECK (chave = ANY(public.interruptores_conhecidos()));

-- ------------------------------------------------------------
-- 2) Os valores iniciais
-- ------------------------------------------------------------
-- `pagamentos` herda o estado atual de site_settings — ligar ou desligar o
-- checkout numa migration seria decidir por quem opera a loja.
INSERT INTO public.interruptores (chave, ligado)
SELECT 'pagamentos', COALESCE((SELECT payments_enabled FROM public.site_settings WHERE id = 1), FALSE)
ON CONFLICT (chave) DO NOTHING;

-- Os demais nascem DESLIGADOS. Um padrao generoso ligaria sozinho algo que
-- cobra ou manda e-mail, e a decisao nao teria sido de ninguem.
INSERT INTO public.interruptores (chave, ligado) VALUES
  ('assinatura', FALSE),
  ('indicacao',  FALSE),
  ('newsletter', TRUE)   -- ja esta no ar hoje; desligar seria mudanca de escopo
ON CONFLICT (chave) DO NOTHING;

-- ------------------------------------------------------------
-- 3) RLS
-- ------------------------------------------------------------
ALTER TABLE public.interruptores ENABLE ROW LEVEL SECURITY;

-- Leitura publica: a vitrine precisa saber se o checkout esta aberto antes de
-- o visitante ter conta. Nao ha dado sensivel aqui — so o estado de uma
-- capacidade que o proprio site ja demonstra ao ser usado.
DROP POLICY IF EXISTS interruptores_public_read ON public.interruptores;
CREATE POLICY interruptores_public_read ON public.interruptores
  FOR SELECT TO anon, authenticated
  USING (true);

-- Escrita: capacidade propria (migration 20260815220000). Quem despacha
-- pedido nao liga o clube de assinatura.
DROP POLICY IF EXISTS interruptores_admin_write ON public.interruptores;
CREATE POLICY interruptores_admin_write ON public.interruptores
  FOR UPDATE TO authenticated
  USING (public.tem_capacidade('configuracoes:escrever'))
  WITH CHECK (public.tem_capacidade('configuracoes:escrever'));

-- Sem policy de INSERT nem DELETE, de proposito: a lista de interruptores e
-- decisao de codigo (esta migration), nao de operacao. Acrescentar um pelo
-- painel criaria uma chave que nenhum codigo consulta.
GRANT SELECT ON public.interruptores TO anon, authenticated;
GRANT UPDATE (ligado, alterado_em, alterado_por) ON public.interruptores TO authenticated;

-- ------------------------------------------------------------
-- 4) O predicado que o servidor usa
-- ------------------------------------------------------------
-- SECURITY DEFINER para que a Edge Function possa perguntar sem depender do
-- token de quem chamou — e para que a resposta seja a mesma para todo mundo.
CREATE OR REPLACE FUNCTION public.interruptor_ligado(p_chave text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  -- Chave desconhecida devolve false: o lado seguro de errar e nao oferecer a
  -- capacidade. Lancar faria um nome digitado errado derrubar o checkout.
  SELECT COALESCE((SELECT i.ligado FROM public.interruptores i WHERE i.chave = p_chave), false);
$$;

REVOKE ALL ON FUNCTION public.interruptor_ligado(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.interruptor_ligado(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 5) `site_settings.payments_enabled` vira projecao
-- ------------------------------------------------------------
-- Os cinco leitores em js/ continuam funcionando sem mudanca. O que muda e
-- quem manda: a verdade passa a ser `interruptores`, e a coluna antiga e
-- mantida igual por trigger.
--
-- Duas verdades independentes seria o defeito que este projeto ja consertou
-- em `profiles.plano` — a que envelhece e a gravada.
CREATE OR REPLACE FUNCTION public.projetar_pagamentos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.chave = 'pagamentos' THEN
    UPDATE public.site_settings
       SET payments_enabled = NEW.ligado, updated_at = NOW()
     WHERE id = 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projetar_pagamentos ON public.interruptores;
CREATE TRIGGER trg_projetar_pagamentos
  AFTER INSERT OR UPDATE ON public.interruptores
  FOR EACH ROW EXECUTE FUNCTION public.projetar_pagamentos();

-- Alinha a projecao com o estado atual, para o caso de a tabela ja existir de
-- uma aplicacao anterior desta migration.
UPDATE public.interruptores SET alterado_em = alterado_em WHERE chave = 'pagamentos';

COMMENT ON COLUMN public.site_settings.payments_enabled IS
  'PROJECAO de interruptores.pagamentos, mantida por trigger. Nao escreva '
  'aqui: escreva no interruptor. Existe para os leitores antigos em js/.';
