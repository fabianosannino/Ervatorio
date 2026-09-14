-- ============================================================
-- Teste do diário de infusões (20260916120000_diario_infusoes.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. Monta um
-- arremedo do ambiente, aplica a migration dos interruptores e a do diário
-- DE VERDADE via \i e prova o que elas prometem: o interruptor nasce
-- desligado e, desligado, o banco recusa registro novo; ligado, só o dono
-- grava e lê; sensação fora da lista é recusada; anon não lê; desligar não
-- tira do dono o direito de ler e apagar; a linha cai com a conta.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgdiario -U postgres --auth=trust
--   pg_ctl -D /tmp/pgdiario -o "-p 5438 -k /tmp" start
--   psql -h /tmp -p 5438 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260916_diario_infusoes_test.sql
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

-- O que a migration dos interruptores precisa encontrar.
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, display_name text, is_admin boolean DEFAULT false,
  admin_capabilities text[] NOT NULL DEFAULT '{}');

CREATE OR REPLACE FUNCTION public.tem_capacidade(capacidade text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $fn$
  SELECT COALESCE(
    (SELECT up.is_admin AND capacidade = ANY(up.admin_capabilities)
       FROM public.user_profiles up WHERE up.id = auth.uid()),
    false);
$fn$;
GRANT EXECUTE ON FUNCTION public.tem_capacidade(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY,
  payments_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO public.site_settings (id, payments_enabled) VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ana@x.co'),
  ('22222222-2222-2222-2222-222222222222', 'bia@x.co'),
  ('33333333-3333-3333-3333-333333333333', 'dona@x.co');
INSERT INTO public.user_profiles (id, display_name, is_admin, admin_capabilities) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Dona', true, ARRAY['configuracoes:escrever']);

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;

-- O Supabase concede ALL a anon/authenticated em toda tabela nova de public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;

-- ------------------------------------------------------------
-- As migrations, de verdade
-- ------------------------------------------------------------
\i supabase/migrations/20260815230000_interruptores.sql
\i supabase/migrations/20260916120000_diario_infusoes.sql

-- ------------------------------------------------------------
-- Bloco 1 — o interruptor existe, nasce desligado, e os outros não mudam
-- ------------------------------------------------------------
SELECT (SELECT ligado FROM public.interruptores WHERE chave='diario') = FALSE
   AND (SELECT count(*) FROM public.interruptores) = 5
   AND 'diario' = ANY(public.interruptores_conhecidos())
  AS bloco1_interruptor_nasce_desligado;

-- ------------------------------------------------------------
-- Bloco 2 — desligado: Ana (autenticada, dona) não consegue registrar
-- ------------------------------------------------------------
SET ROLE authenticated;
SELECT set_config('request.actor', '11111111-1111-1111-1111-111111111111', false);
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome, sensacao)
    VALUES ('11111111-1111-1111-1111-111111111111', '1', 'Camomila', 'relaxei');
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco2: registrou com o interruptor desligado'; END IF;
END $$;
RESET ROLE;
SELECT true AS bloco2_desligado_recusa_registro;

-- ------------------------------------------------------------
-- Bloco 3 — a Dona liga pelo painel (capacidade); Ana registra e lê só o seu
-- ------------------------------------------------------------
SET ROLE authenticated;
SELECT set_config('request.actor', '33333333-3333-3333-3333-333333333333', false);
UPDATE public.interruptores SET ligado = TRUE WHERE chave = 'diario';
RESET ROLE;
SELECT (SELECT ligado FROM public.interruptores WHERE chave='diario') AS bloco3a_dona_ligou;

SET ROLE authenticated;
SELECT set_config('request.actor', '11111111-1111-1111-1111-111111111111', false);
INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome, sensacao)
VALUES ('11111111-1111-1111-1111-111111111111', '1', 'Camomila', 'relaxei');
INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome, tomado_em)
VALUES ('11111111-1111-1111-1111-111111111111', 'guarana', 'Guaraná', now() - interval '1 day');
SELECT count(*) = 2 AND bool_and(user_id = '11111111-1111-1111-1111-111111111111')
  AS bloco3b_ana_registra_e_le_so_o_seu
  FROM public.diario_infusoes;

-- ------------------------------------------------------------
-- Bloco 4 — Ana não registra em nome de Bia (WITH CHECK)
-- ------------------------------------------------------------
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome)
    VALUES ('22222222-2222-2222-2222-222222222222', '2', 'Valeriana');
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco4: Ana registrou em nome de Bia'; END IF;
END $$;
SELECT true AS bloco4_nao_registra_em_nome_de_outro;

-- ------------------------------------------------------------
-- Bloco 5 — sensação fora da lista, erva sem id válido e nome vazio: recusados
-- ------------------------------------------------------------
DO $$
DECLARE recusas int := 0;
BEGIN
  BEGIN
    INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome, sensacao)
    VALUES ('11111111-1111-1111-1111-111111111111', '1', 'Camomila', 'fiquei enjoada porque estou grávida');
  EXCEPTION WHEN check_violation THEN recusas := recusas + 1;
  END;
  BEGIN
    INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome)
    VALUES ('11111111-1111-1111-1111-111111111111', 'Camomila com açúcar', 'Camomila');
  EXCEPTION WHEN check_violation THEN recusas := recusas + 1;
  END;
  BEGIN
    INSERT INTO public.diario_infusoes (user_id, erva_id, erva_nome)
    VALUES ('11111111-1111-1111-1111-111111111111', '1', '');
  EXCEPTION WHEN check_violation THEN recusas := recusas + 1;
  END;
  IF recusas <> 3 THEN RAISE EXCEPTION 'bloco5: aceitou valor fora da regra (% de 3 recusas)', recusas; END IF;
END $$;
SELECT true AS bloco5_lista_fechada_e_formato;

-- ------------------------------------------------------------
-- Bloco 6 — Ana corrige a sensação (coluna liberada); não muda o dono
-- ------------------------------------------------------------
UPDATE public.diario_infusoes SET sensacao = 'dormi_bem' WHERE erva_id = '1';
SELECT (SELECT sensacao FROM public.diario_infusoes WHERE erva_id='1') = 'dormi_bem'
  AS bloco6a_corrige_sensacao;
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    UPDATE public.diario_infusoes SET user_id = '22222222-2222-2222-2222-222222222222' WHERE erva_id = '1';
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco6: trocou o dono da linha'; END IF;
END $$;
SELECT true AS bloco6b_nao_troca_o_dono;

-- ------------------------------------------------------------
-- Bloco 7 — Bia não vê, não altera nem apaga o diário de Ana
-- ------------------------------------------------------------
SELECT set_config('request.actor', '22222222-2222-2222-2222-222222222222', false);
SELECT count(*) = 0 AS bloco7a_bia_nao_ve_ana FROM public.diario_infusoes;
UPDATE public.diario_infusoes SET sensacao = 'nao_gostei' WHERE erva_id = '1';
DELETE FROM public.diario_infusoes WHERE erva_id = '1';
RESET ROLE;
SELECT (SELECT sensacao FROM public.diario_infusoes WHERE erva_id='1') = 'dormi_bem'
   AND (SELECT count(*) FROM public.diario_infusoes) = 2
  AS bloco7b_diario_de_ana_intacto;

-- ------------------------------------------------------------
-- Bloco 8 — anon não lê nada (não tem privilégio de tabela)
-- ------------------------------------------------------------
SET ROLE anon;
SELECT set_config('request.actor', '', false);
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    PERFORM count(*) FROM public.diario_infusoes;
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco8: anon leu diario_infusoes'; END IF;
END $$;
RESET ROLE;
SELECT true AS bloco8_anon_nao_le;

-- ------------------------------------------------------------
-- Bloco 9 — desligar não sequestra: Ana ainda lê e apaga; só não registra
-- ------------------------------------------------------------
UPDATE public.interruptores SET ligado = FALSE WHERE chave = 'diario';
SET ROLE authenticated;
SELECT set_config('request.actor', '11111111-1111-1111-1111-111111111111', false);
SELECT count(*) = 2 AS bloco9a_desligado_ainda_le FROM public.diario_infusoes;
DELETE FROM public.diario_infusoes WHERE erva_id = 'guarana';
SELECT count(*) = 1 AS bloco9b_desligado_ainda_apaga FROM public.diario_infusoes;
DO $$
DECLARE recusou boolean := false;
BEGIN
  BEGIN
    UPDATE public.diario_infusoes SET sensacao = 'foco' WHERE erva_id = '1';
  EXCEPTION WHEN insufficient_privilege THEN recusou := true;
  END;
  IF NOT recusou THEN RAISE EXCEPTION 'bloco9: alterou com o interruptor desligado'; END IF;
END $$;
RESET ROLE;
SELECT true AS bloco9c_desligado_nao_altera;

-- ------------------------------------------------------------
-- Bloco 10 — a conta cai, o diário cai junto (CASCADE)
-- ------------------------------------------------------------
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT count(*) = 0 AS bloco10_cai_com_a_conta FROM public.diario_infusoes;

-- ------------------------------------------------------------
-- Bloco 11 — idempotência: reaplicar não desfaz o que a operação decidiu
-- ------------------------------------------------------------
-- Só a migration nova: a de 20260815230000 recria `interruptores_conhecidos()`
-- com a lista de quatro e o CHECK recusaria a linha `diario`. Em produção as
-- migrations rodam uma vez, em ordem — reaplicar a antiga depois desta não
-- é um cenário; reaplicar esta, é.
UPDATE public.interruptores SET ligado = TRUE WHERE chave = 'diario';
\i supabase/migrations/20260916120000_diario_infusoes.sql
SELECT (SELECT count(*) FROM public.interruptores) = 5
   AND (SELECT ligado FROM public.interruptores WHERE chave='diario') = TRUE
  AS bloco11_idempotente;

-- ------------------------------------------------------------
-- Bloco 12 — privilégios de tabela: só o necessário, nominalmente
-- ------------------------------------------------------------
SELECT
  NOT has_table_privilege('anon', 'public.diario_infusoes', 'SELECT')
  AND NOT has_table_privilege('anon', 'public.diario_infusoes', 'INSERT')
  AND has_table_privilege('authenticated', 'public.diario_infusoes', 'SELECT')
  AND has_table_privilege('authenticated', 'public.diario_infusoes', 'INSERT')
  AND has_table_privilege('authenticated', 'public.diario_infusoes', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.diario_infusoes', 'TRUNCATE')
  AND NOT has_table_privilege('authenticated', 'public.diario_infusoes', 'TRIGGER')
  AND NOT has_table_privilege('authenticated', 'public.diario_infusoes', 'REFERENCES')
  AND NOT has_table_privilege('authenticated', 'public.diario_infusoes', 'UPDATE')           -- tabela inteira: não
  AND has_column_privilege('authenticated', 'public.diario_infusoes', 'sensacao', 'UPDATE')  -- coluna: sim
  AND NOT has_column_privilege('authenticated', 'public.diario_infusoes', 'user_id', 'UPDATE')
  AND NOT has_column_privilege('authenticated', 'public.diario_infusoes', 'tomado_em', 'UPDATE')
  AS bloco12_privilegios_minimos;
