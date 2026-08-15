-- ============================================================
-- Teste dos interruptores (20260815230000_interruptores.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. Monta um
-- arremedo do ambiente, aplica a migration DE VERDADE via \i e exercita o
-- que ela promete.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgint -U postgres --auth=trust
--   pg_ctl -D /tmp/pgint -o "-p 5436 -k /tmp" start
--   psql -h /tmp -p 5436 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260815_interruptores_test.sql
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

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, display_name text, is_admin boolean DEFAULT false,
  admin_capabilities text[] NOT NULL DEFAULT '{}');

-- `tem_capacidade` nasce em 20260815220000; reproduzida porque o arremedo não
-- aplica a cadeia inteira de migrations.
CREATE OR REPLACE FUNCTION public.tem_capacidade(capacidade text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $fn$
  SELECT COALESCE(
    (SELECT up.is_admin AND capacidade = ANY(up.admin_capabilities)
       FROM public.user_profiles up WHERE up.id = auth.uid()),
    false);
$fn$;
GRANT EXECUTE ON FUNCTION public.tem_capacidade(text) TO authenticated;

-- A tabela antiga, no estado em que a loja está hoje: pagamentos LIGADOS.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY,
  payments_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO public.site_settings (id, payments_enabled) VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;

GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Personagens
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dona@ervatorio.test'),
  ('22222222-2222-2222-2222-222222222222', 'despacho@ervatorio.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_profiles (id, display_name, is_admin, admin_capabilities) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dona',     true, ARRAY['configuracoes:escrever']),
  ('22222222-2222-2222-2222-222222222222', 'Despacho', true, ARRAY['pedidos:ler','pedidos:escrever'])
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- A migration de verdade
-- ------------------------------------------------------------
\i supabase/migrations/20260815230000_interruptores.sql

\echo ''
\echo '=== 1. `pagamentos` herdou o estado da loja, os outros nascem certos ==='
-- A migration nao pode ligar nem desligar o checkout por conta propria.
SELECT
  (SELECT ligado FROM public.interruptores WHERE chave='pagamentos')  AS pagamentos_herdado,
  (SELECT ligado FROM public.interruptores WHERE chave='assinatura')  AS assinatura_off,
  (SELECT ligado FROM public.interruptores WHERE chave='indicacao')   AS indicacao_off;
-- Esperado: t | f | f

\echo ''
\echo '=== 2. site_settings virou projecao — o trigger mantem em dia ==='
UPDATE public.interruptores SET ligado = false WHERE chave = 'pagamentos';
SELECT
  (SELECT payments_enabled FROM public.site_settings WHERE id=1) = false AS projetou_desligado;

UPDATE public.interruptores SET ligado = true WHERE chave = 'pagamentos';
SELECT
  (SELECT payments_enabled FROM public.site_settings WHERE id=1) = true AS projetou_ligado;
-- Os cinco leitores em js/ continuam funcionando sem mudanca nenhuma.

\echo ''
\echo '=== 3. `interruptor_ligado` responde o que o servidor pergunta ==='
SELECT
  public.interruptor_ligado('pagamentos')     AS pagamentos,
  public.interruptor_ligado('assinatura')     AS assinatura,
  public.interruptor_ligado('nao-existe')     AS chave_inventada;
-- Esperado: t | f | f
-- A terceira: chave desconhecida devolve false. O lado seguro de errar e nao
-- oferecer a capacidade; lancar faria um nome digitado errado derrubar o
-- checkout inteiro.

\echo ''
\echo '=== 4. Quem nao tem `configuracoes:escrever` nao vira nada ==='
SET ROLE authenticated;
SET request.actor = '22222222-2222-2222-2222-222222222222';
DO $$
DECLARE afetadas integer;
BEGIN
  UPDATE public.interruptores SET ligado = false WHERE chave = 'pagamentos';
  GET DIAGNOSTICS afetadas = ROW_COUNT;
  IF afetadas > 0 THEN
    RAISE EXCEPTION 'FALHOU: quem despacha pedido desligou o checkout';
  END IF;
  RAISE NOTICE 'ok: RLS recusou (0 linhas afetadas)';
END $$;
RESET ROLE;

SELECT (SELECT ligado FROM public.interruptores WHERE chave='pagamentos') AS continua_ligado;

\echo ''
\echo '=== 5. Quem tem a capacidade vira ==='
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
UPDATE public.interruptores SET ligado = true WHERE chave = 'assinatura';
RESET ROLE;
SELECT (SELECT ligado FROM public.interruptores WHERE chave='assinatura') AS dona_ligou;

\echo ''
\echo '=== 6. Interruptor inventado e recusado pelo CHECK ==='
DO $$
BEGIN
  INSERT INTO public.interruptores (chave, ligado) VALUES ('pagamnetos', true);
  RAISE EXCEPTION 'FALHOU: aceitou chave desconhecida';
EXCEPTION
  WHEN check_violation THEN RAISE NOTICE 'ok: chave desconhecida recusada (23514)';
END $$;

\echo ''
\echo '=== 7. Ninguem cria nem apaga interruptor pelo painel ==='
-- A lista e decisao de codigo. Criar um pelo painel produziria uma chave que
-- nenhum codigo consulta — e uma tela que promete algo que nao acontece.
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
DO $$
BEGIN
  INSERT INTO public.interruptores (chave, ligado) VALUES ('newsletter', false);
  RAISE EXCEPTION 'FALHOU: inseriu sem policy de INSERT';
EXCEPTION
  WHEN insufficient_privilege OR unique_violation THEN
    RAISE NOTICE 'ok: INSERT recusado';
END $$;
RESET ROLE;

\echo ''
\echo '=== 8. A migration e idempotente ==='
\i supabase/migrations/20260815230000_interruptores.sql
SELECT
  (SELECT count(*) FROM public.interruptores) = 4          AS continuam_quatro,
  (SELECT ligado FROM public.interruptores WHERE chave='assinatura') AS assinatura_continua_ligada;
-- A segunda importa: reaplicar nao pode desfazer o que a operacao decidiu.

\echo ''
\echo '=== FIM — nenhum `f` acima, nenhum FALHOU ==='
