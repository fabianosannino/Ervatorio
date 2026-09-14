-- ============================================================
-- Teste do descadastro da newsletter (20260917120000)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. Monta um
-- arremedo do ambiente, aplica as três migrations DE VERDADE via \i
-- (tabela → só-service_role → descadastro) e prova o que a última
-- promete: todo inscrito nasce com um token único; `active` é projeção
-- de `descadastrado_em` e não se deixa enganar por escrita direta; quem
-- já estava descadastrado antes do gatilho não volta à lista; reenviar o
-- formulário não ressuscita quem saiu; e anon/authenticated ficam sem
-- privilégio nenhum — inclusive TRUNCATE, que a RLS não cobre.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgnews -U postgres --auth=trust
--   pg_ctl -D /tmp/pgnews -o "-p 5439 -k /tmp" start
--   psql -h /tmp -p 5439 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260917_newsletter_descadastro_test.sql
--
-- Saída esperada: todos os blocos com `t`. Qualquer `f` é regressão.
-- ============================================================

\set ON_ERROR_STOP on

-- ------------------------------------------------------------
-- Arremedo do ambiente Supabase
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.actor', true), '')::uuid;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, display_name text, is_admin boolean DEFAULT false);

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
  SELECT COALESCE((SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()), false);
$fn$;

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $fn$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$fn$;

-- O projeto tem ALTER DEFAULT PRIVILEGES concedendo tudo em public a
-- anon e authenticated. É isso que põe TRUNCATE na mão de quem não
-- deveria — e é o que o REVOKE da migration precisa desfazer. Sem
-- simular aqui, o teste passaria por ausência do problema.
-- service_role entra junto porque no Supabase ele também recebe os
-- privilégios por default — é o que faz o bloco 9b provar que o REVOKE
-- da migration mira anon e authenticated, e não a conta que a Edge
-- Function usa para escrever.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- As migrations de verdade, na ordem
-- ------------------------------------------------------------
\i supabase/migrations/20260726120000_newsletter_pausa.sql

-- Uma linha que sai ANTES do gatilho existir: é o caso que o backfill
-- da migration nova tem de encontrar. Com o gatilho já instalado seria
-- impossível criá-la, e o backfill nunca seria exercido.
INSERT INTO public.newsletter_subscribers (email, active)
VALUES ('saiu-antes@exemplo.com', false);

\i supabase/migrations/20260802040000_newsletter_via_edge_function.sql
\i supabase/migrations/20260917120000_newsletter_descadastro.sql

-- ------------------------------------------------------------
-- 1. Todo inscrito nasce com token próprio, único e não nulo
-- ------------------------------------------------------------
INSERT INTO public.newsletter_subscribers (email) VALUES ('ana@exemplo.com'), ('bruno@exemplo.com');

SELECT '1. token nasce preenchido e diferente por linha' AS teste,
       COUNT(*) = 3
   AND COUNT(DISTINCT token_descadastro) = 3
   AND bool_and(token_descadastro IS NOT NULL) AS resultado
  FROM public.newsletter_subscribers;

-- ------------------------------------------------------------
-- 2. O token é único de verdade (índice, não convenção)
-- ------------------------------------------------------------
DO $$
DECLARE v_tok uuid; v_erro text := 'nao recusou';
BEGIN
  SELECT token_descadastro INTO v_tok FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';
  BEGIN
    INSERT INTO public.newsletter_subscribers (email, token_descadastro)
    VALUES ('colisao@exemplo.com', v_tok);
  EXCEPTION WHEN unique_violation THEN v_erro := 'recusou';
  END;
  RAISE NOTICE '2. token repetido: %', v_erro;
  PERFORM set_config('teste.b2', (v_erro = 'recusou')::text, false);
END $$;
SELECT '2. token repetido é recusado pelo índice único' AS teste,
       current_setting('teste.b2')::boolean AS resultado;

-- ------------------------------------------------------------
-- 3. Quem entra está na lista: active = true, sem data de saída
-- ------------------------------------------------------------
SELECT '3. inscrito novo nasce ativo e sem data de saída' AS teste,
       bool_and(active AND descadastrado_em IS NULL) AS resultado
  FROM public.newsletter_subscribers WHERE email IN ('ana@exemplo.com', 'bruno@exemplo.com');

-- ------------------------------------------------------------
-- 4. Registrar o fato desliga a projeção
-- ------------------------------------------------------------
UPDATE public.newsletter_subscribers
   SET descadastrado_em = NOW()
 WHERE email = 'ana@exemplo.com';

SELECT '4. descadastrado_em preenchido → active vira false' AS teste,
       (NOT active) AND descadastrado_em IS NOT NULL AS resultado
  FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';

-- ------------------------------------------------------------
-- 5. Escrever `active` direto não engana o banco
-- ------------------------------------------------------------
-- Sem data, a pessoa está na lista — mesmo que alguém mande false.
UPDATE public.newsletter_subscribers SET active = false WHERE email = 'bruno@exemplo.com';

-- Com data, a pessoa saiu — mesmo que alguém mande true.
UPDATE public.newsletter_subscribers SET active = true WHERE email = 'ana@exemplo.com';

SELECT '5. active é projeção: escrita direta é recalculada' AS teste,
       (SELECT active FROM public.newsletter_subscribers WHERE email = 'bruno@exemplo.com')
   AND NOT (SELECT active FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com') AS resultado;

-- ------------------------------------------------------------
-- 6. A data da saída não se perde num UPDATE qualquer
-- ------------------------------------------------------------
DO $$
DECLARE v_antes timestamptz; v_depois timestamptz;
BEGIN
  SELECT descadastrado_em INTO v_antes FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';
  UPDATE public.newsletter_subscribers SET locale = 'en' WHERE email = 'ana@exemplo.com';
  SELECT descadastrado_em INTO v_depois FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';
  PERFORM set_config('teste.b6', (v_antes = v_depois)::text, false);
END $$;
SELECT '6. a data de saída sobrevive a outros UPDATEs' AS teste,
       current_setting('teste.b6')::boolean AS resultado;

-- ------------------------------------------------------------
-- 7. Backfill: quem saiu antes do gatilho não voltou à lista
-- ------------------------------------------------------------
SELECT '7. linha antiga (active=false, sem data) ganhou data e segue fora' AS teste,
       (NOT active) AND descadastrado_em IS NOT NULL AS resultado
  FROM public.newsletter_subscribers WHERE email = 'saiu-antes@exemplo.com';

-- ------------------------------------------------------------
-- 8. Reenviar o formulário não ressuscita quem saiu
-- ------------------------------------------------------------
-- É o que a Edge Function faz: upsert com ignoreDuplicates.
INSERT INTO public.newsletter_subscribers (email, source, locale, consent)
VALUES ('ana@exemplo.com', 'pausa', 'pt', true)
ON CONFLICT (email) DO NOTHING;

SELECT '8. reinscrição não reativa quem se descadastrou' AS teste,
       NOT active AS resultado
  FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';

-- ------------------------------------------------------------
-- 9. anon e authenticated não têm privilégio nenhum — nem TRUNCATE
-- ------------------------------------------------------------
-- TRUNCATE é o que importa aqui: não passa por RLS. As policies
-- seguram SELECT/INSERT/UPDATE/DELETE; só o REVOKE segura este.
SELECT '9. anon/authenticated sem privilégio (inclusive TRUNCATE)' AS teste,
       NOT bool_or(TRUE) IS NULL
   AND NOT EXISTS (
         SELECT 1 FROM information_schema.role_table_grants
          WHERE table_schema = 'public'
            AND table_name = 'newsletter_subscribers'
            AND grantee IN ('anon', 'authenticated')) AS resultado;

SELECT '9b. o REVOKE não atingiu service_role' AS teste,
       has_table_privilege('service_role', 'public.newsletter_subscribers', 'SELECT')
   AND has_table_privilege('service_role', 'public.newsletter_subscribers', 'UPDATE') AS resultado;

-- ------------------------------------------------------------
-- 10. RLS continua ligada e sem porta para anon
-- ------------------------------------------------------------
SELECT '10. RLS ligada e nenhuma policy para anon' AS teste,
       (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.newsletter_subscribers'::regclass)
   AND NOT EXISTS (
         SELECT 1 FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers'
            AND 'anon' = ANY(COALESCE(roles, '{}'))) AS resultado;

-- ------------------------------------------------------------
-- 11. Idempotência: reaplicar a migration não muda nada
-- ------------------------------------------------------------
-- Só a migration nova é reaplicada. As anteriores recriam a tabela e
-- as policies; reaplicá-las aqui provaria outra coisa, e o teste delas
-- já existe.
DO $$
DECLARE v_tok uuid; v_data timestamptz;
BEGIN
  SELECT token_descadastro, descadastrado_em INTO v_tok, v_data
    FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';
  PERFORM set_config('teste.tok', v_tok::text, false);
  PERFORM set_config('teste.data', v_data::text, false);
END $$;

\i supabase/migrations/20260917120000_newsletter_descadastro.sql

SELECT '11. reaplicar a migration preserva token e data de saída' AS teste,
       token_descadastro::text = current_setting('teste.tok')
   AND descadastrado_em::text = current_setting('teste.data') AS resultado
  FROM public.newsletter_subscribers WHERE email = 'ana@exemplo.com';

-- ------------------------------------------------------------
-- 12. O índice que o admin usa continua servindo à consulta real
-- ------------------------------------------------------------
SELECT '12. índice parcial de ativos continua existindo' AS teste,
       EXISTS (SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                  AND tablename = 'newsletter_subscribers'
                  AND indexname = 'idx_newsletter_active_created') AS resultado;
