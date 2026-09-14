-- ============================================================
-- Teste do dado de saúde (20260915120000_perfil_saude.sql + 20260915130000_perfil_saude_privilegios.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. Monta um
-- arremedo do ambiente, aplica a migration DE VERDADE via \i e prova o que
-- ela promete: só o dono lê e escreve, anon não lê nada, não existe linha
-- sem consentimento, condição fora da lista é recusada, e o dado sensível
-- que estava em `caffeine_pref` some.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgsaude -U postgres --auth=trust
--   pg_ctl -D /tmp/pgsaude -o "-p 5437 -k /tmp" start
--   psql -h /tmp -p 5437 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260915_perfil_saude_test.sql
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
END $$;

-- A tabela onde o dado de saúde estava vazando, com o vazamento dentro.
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  caffeine_pref text, moment_pref text, flavor_pref text);

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ana@x.co'),
  ('22222222-2222-2222-2222-222222222222', 'bia@x.co');

INSERT INTO public.user_preferences (user_id, caffeine_pref) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Grávida'),       -- vazamento
  ('22222222-2222-2222-2222-222222222222', 'descafeinado');  -- preferência de verdade

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;

-- O Supabase concede ALL a anon/authenticated em toda tabela nova de public
-- (ALTER DEFAULT PRIVILEGES). Sem reproduzir isso, o teste não vê o que a
-- primeira versão da migration deixou passar (ver 20260915130000).
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;

-- ------------------------------------------------------------
-- As migrations, de verdade
-- ------------------------------------------------------------
\i supabase/migrations/20260915120000_perfil_saude.sql
\i supabase/migrations/20260915130000_perfil_saude_privilegios.sql

-- ------------------------------------------------------------
-- Bloco 1 — a limpeza tirou o dado sensível e deixou a preferência real
-- ------------------------------------------------------------
SELECT (SELECT caffeine_pref FROM public.user_preferences WHERE user_id='11111111-1111-1111-1111-111111111111') IS NULL
   AND (SELECT caffeine_pref FROM public.user_preferences WHERE user_id='22222222-2222-2222-2222-222222222222') = 'descafeinado'
  AS bloco1_limpeza_so_do_que_era_saude;

-- ------------------------------------------------------------
-- Bloco 2 — Ana (autenticada) grava o próprio consentimento e lê só a si
-- ------------------------------------------------------------
SET ROLE authenticated;
SELECT set_config('request.actor', '11111111-1111-1111-1111-111111111111', false);

INSERT INTO public.perfil_saude (user_id, condicoes, consentimento_em)
VALUES ('11111111-1111-1111-1111-111111111111', ARRAY['gestante','asteraceas'], NOW());

SELECT count(*) = 1 AND bool_and(user_id = '11111111-1111-1111-1111-111111111111')
  AS bloco2_ana_le_so_a_propria_linha
  FROM public.perfil_saude;

-- ------------------------------------------------------------
-- Bloco 3 — Ana não consegue gravar linha em nome de Bia (WITH CHECK)
-- ------------------------------------------------------------
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.perfil_saude (user_id, condicoes, consentimento_em)
    VALUES ('22222222-2222-2222-2222-222222222222', ARRAY['hipertensao'], NOW());
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco3: Ana gravou em nome de Bia'; END IF;
END $$;
SELECT true AS bloco3_nao_grava_em_nome_de_outro;

-- ------------------------------------------------------------
-- Bloco 4 — não existe linha sem consentimento
-- ------------------------------------------------------------
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    UPDATE public.perfil_saude SET consentimento_em = NULL
     WHERE user_id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN not_null_violation THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco4: aceitou consentimento nulo'; END IF;
END $$;
SELECT true AS bloco4_sem_consentimento_nao_ha_linha;

-- ------------------------------------------------------------
-- Bloco 5 — condição fora da lista fechada é recusada
-- ------------------------------------------------------------
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    UPDATE public.perfil_saude SET condicoes = ARRAY['gestante','tenho um problema raro']
     WHERE user_id = '11111111-1111-1111-1111-111111111111';
  EXCEPTION WHEN check_violation THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco5: aceitou condicao desconhecida'; END IF;
END $$;
SELECT true AS bloco5_condicao_fora_da_lista_e_recusada;

-- ------------------------------------------------------------
-- Bloco 6 — Bia (autenticada) não vê a linha de Ana
-- ------------------------------------------------------------
SELECT set_config('request.actor', '22222222-2222-2222-2222-222222222222', false);
SELECT count(*) = 0 AS bloco6_bia_nao_ve_ana FROM public.perfil_saude;

-- Bia também não altera nem apaga a linha de Ana (USING filtra: 0 linhas).
UPDATE public.perfil_saude SET condicoes = '{}' WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.perfil_saude WHERE user_id = '11111111-1111-1111-1111-111111111111';
RESET ROLE;
SELECT (SELECT condicoes FROM public.perfil_saude WHERE user_id='11111111-1111-1111-1111-111111111111') = ARRAY['gestante','asteraceas']
  AS bloco6b_linha_de_ana_intacta;

-- ------------------------------------------------------------
-- Bloco 7 — anon não lê nada (nem com RLS: não tem privilégio de tabela)
-- ------------------------------------------------------------
SET ROLE anon;
SELECT set_config('request.actor', '', false);
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    PERFORM count(*) FROM public.perfil_saude;
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco7: anon leu perfil_saude'; END IF;
END $$;
RESET ROLE;
SELECT true AS bloco7_anon_nao_le;

-- ------------------------------------------------------------
-- Bloco 8 — retirar o consentimento = apagar a linha (o dono consegue)
-- ------------------------------------------------------------
SET ROLE authenticated;
SELECT set_config('request.actor', '11111111-1111-1111-1111-111111111111', false);
DELETE FROM public.perfil_saude WHERE user_id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) = 0 AS bloco8_retirar_consentimento_apaga FROM public.perfil_saude;
RESET ROLE;

-- ------------------------------------------------------------
-- Bloco 9 — a conta cai, a linha cai junto (CASCADE)
-- ------------------------------------------------------------
INSERT INTO public.perfil_saude (user_id, condicoes, consentimento_em)
VALUES ('22222222-2222-2222-2222-222222222222', ARRAY['diabetes'], NOW());
DELETE FROM auth.users WHERE id = '22222222-2222-2222-2222-222222222222';
SELECT count(*) = 0 AS bloco9_cai_com_a_conta
  FROM public.perfil_saude WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- ------------------------------------------------------------
-- Bloco 10 — idempotência: aplicar de novo não quebra
-- ------------------------------------------------------------
\i supabase/migrations/20260915120000_perfil_saude.sql
\i supabase/migrations/20260915130000_perfil_saude_privilegios.sql
SELECT true AS bloco10_idempotente;

-- ------------------------------------------------------------
-- Bloco 11 — privilégios de tabela: só o necessário, nominalmente
-- ------------------------------------------------------------
-- anon: nada. authenticated: SELECT, INSERT, DELETE e UPDATE só nas quatro
-- colunas (user_id fica de fora). Nem TRUNCATE, nem TRIGGER, nem REFERENCES.
SELECT
  NOT has_table_privilege('anon', 'public.perfil_saude', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.perfil_saude', 'INSERT')
  AND has_table_privilege('authenticated', 'public.perfil_saude', 'SELECT')
  AND has_table_privilege('authenticated', 'public.perfil_saude', 'INSERT')
  AND has_table_privilege('authenticated', 'public.perfil_saude', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.perfil_saude', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.perfil_saude', 'TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.perfil_saude', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.perfil_saude', 'UPDATE')          -- tabela inteira: não
  AND has_column_privilege('authenticated', 'public.perfil_saude', 'condicoes', 'UPDATE') -- coluna: sim
  AND NOT has_column_privilege('authenticated', 'public.perfil_saude', 'user_id', 'UPDATE')
  AS bloco11_privilegios_minimos;
