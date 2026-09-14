-- ============================================================
-- Descadastro da newsletter: o inscrito sai sozinho
-- ============================================================
-- A `newsletter-subscribe` (migration 20260802040000) fechou a
-- captação: só service_role escreve, com rate limit e resposta
-- indistinguível. O que ela deixou de fora, e o cabeçalho dela diz,
-- é a saída: `active` existia, mas o inscrito é anônimo e não tinha
-- como virá-la. Hoje o descadastro é `delete` manual por admin, com
-- prazo de 15 dias — e a Política de Privacidade (v1.2, seção 7) diz
-- isso em público, porque prometer um link que não existe seria pior.
--
-- Esta migration dá ao inscrito a chave da própria porta:
--
--   1. `token_descadastro` — um UUID por linha, que vai no link de
--      cada e-mail de campanha. É capacidade, não identidade: com ele
--      só se faz uma coisa, sair. A function nunca devolve o endereço
--      a quem apresenta o token, para um token sorteado não virar
--      oráculo de e-mail.
--
--   2. `descadastrado_em` — o FATO. `active` vira PROJEÇÃO mantida
--      por gatilho, como `orders.status` (20260816140000) e
--      `site_settings.payments_enabled` (20260815230000). Escrever
--      `active = false` e esquecer a data era o jeito de perder a
--      prova de quando a pessoa saiu; agora não dá: o gatilho
--      recalcula `active` a partir da data, em INSERT e em UPDATE.
--      Quem descadastra registra a data; o resto é consequência.
--
--   3. REVOKE dos privilégios que os ALTER DEFAULT PRIVILEGES do
--      projeto deram a `anon` e `authenticated`. Conferido em
--      produção em 17/09: os dois papéis têm DELETE, INSERT,
--      REFERENCES, SELECT, TRIGGER, TRUNCATE e UPDATE nesta tabela.
--      A RLS segura SELECT/INSERT/UPDATE/DELETE (não há policy para
--      anon), e a API REST não expõe TRUNCATE — mas **TRUNCATE não
--      passa por RLS**, e é a única operação que esvaziaria de uma
--      vez a lista que o cabeçalho da 20260726120000 chama de "o
--      ativo". Privilégio que ninguém usa e que nenhuma policy
--      contém não fica. Nada no cliente lê esta tabela (conferido em
--      js/ e supabase/functions/): quem escreve é a Edge Function,
--      como service_role. Quando houver tela de admin para a lista, o
--      GRANT volta nominalmente para `authenticated` — a policy
--      `newsletter_admin_all` já limita a quem é admin.
--
-- Não entra aqui: double opt-in. Ele exige envio de e-mail
-- transacional e muda o que "inscrito" significa para as linhas que
-- já existem — é a próxima migration, não esta.
--
-- ROLLBACK (documentado — a perda é a prova de saída, não a lista):
--   DROP TRIGGER IF EXISTS newsletter_projeta_active ON public.newsletter_subscribers;
--   DROP FUNCTION IF EXISTS public.newsletter_projeta_active();
--   ALTER TABLE public.newsletter_subscribers
--     DROP COLUMN IF EXISTS descadastrado_em,
--     DROP COLUMN IF EXISTS token_descadastro;
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers
--     TO anon, authenticated;   -- só se algo passar a depender disso
--
-- Teste: supabase/tests/20260917_newsletter_descadastro_test.sql
-- ============================================================

-- ── 1. As colunas ───────────────────────────────────────────
-- gen_random_uuid() é nativa do Postgres 13+; não precisa de pgcrypto.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS token_descadastro UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS descadastrado_em TIMESTAMPTZ;

-- Único de verdade: é por ele que a function acha a linha, e um
-- token repetido descadastraria a pessoa errada.
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_token_descadastro_uidx
  ON public.newsletter_subscribers (token_descadastro);

COMMENT ON COLUMN public.newsletter_subscribers.token_descadastro IS
  'Capacidade de sair da lista, enviada no link de cada campanha. '
  'Não identifica ninguém para quem o apresenta: a Edge Function '
  'newsletter-unsubscribe nunca devolve o e-mail da linha.';

COMMENT ON COLUMN public.newsletter_subscribers.descadastrado_em IS
  'O fato: quando o titular saiu. NULL = na lista. `active` é a '
  'projeção disto, mantida por gatilho — não escreva `active`.';

-- ── 2. Backfill antes do gatilho ────────────────────────────
-- Quem já estava com active = false saiu em algum momento que a
-- tabela não guardou; `updated_at` é a melhor aproximação que existe.
-- Sem este passo, o gatilho abaixo ressuscitaria essas linhas no
-- primeiro UPDATE — descadastrado silenciosamente de volta à lista é
-- exatamente o que não pode acontecer.
UPDATE public.newsletter_subscribers
   SET descadastrado_em = COALESCE(updated_at, created_at, NOW())
 WHERE active IS FALSE
   AND descadastrado_em IS NULL;

-- ── 3. `active` vira projeção ───────────────────────────────
CREATE OR REPLACE FUNCTION public.newsletter_projeta_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.active := (NEW.descadastrado_em IS NULL);
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.newsletter_projeta_active() IS
  'Mantém newsletter_subscribers.active = (descadastrado_em IS NULL). '
  'A verdade é a data; o booleano é conveniência para os índices e '
  'consultas que já existiam.';

DROP TRIGGER IF EXISTS newsletter_projeta_active ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_projeta_active
  BEFORE INSERT OR UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_projeta_active();

-- ── 4. Privilégios ──────────────────────────────────────────
REVOKE ALL ON public.newsletter_subscribers FROM anon, authenticated;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscrições anônimas de newsletter (Pausa, Clube, ficha, receita, '
  'loja, Encontre seu chá). Escrita EXCLUSIVAMENTE pelas Edge '
  'Functions newsletter-subscribe e newsletter-unsubscribe, como '
  'service_role: anon e authenticated não têm privilégio nenhum aqui. '
  'A saída do titular é `descadastrado_em`; `active` é projeção.';
