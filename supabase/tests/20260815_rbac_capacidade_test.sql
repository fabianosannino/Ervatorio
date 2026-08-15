-- ============================================================
-- Teste do RBAC por capacidade (20260815220000_rbac_por_capacidade.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. O
-- arquivo monta um arremedo do ambiente (auth.uid(), as tabelas, os
-- papéis), aplica a migration DE VERDADE via \i e exercita o que ela
-- promete.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgrbac -U postgres --auth=trust
--   pg_ctl -D /tmp/pgrbac -o "-p 5434 -k /tmp" start
--   psql -h /tmp -p 5434 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260815_rbac_capacidade_test.sql
--
-- Saída esperada: todos os blocos com `= t`. Qualquer `f` é regressão.
-- ============================================================

\set ON_ERROR_STOP on

-- ------------------------------------------------------------
-- Arremedo do ambiente Supabase
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);

-- No Supabase, auth.uid() vem do JWT. Aqui vem de um GUC.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.actor', true), '')::uuid;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, display_name text, is_admin boolean DEFAULT false);

-- `is_admin()` nasce em 20260727030000; reproduzida aqui porque o
-- arremedo não aplica a cadeia inteira de migrations.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $fn$
  SELECT COALESCE(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()),
    false);
$fn$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id bigserial PRIMARY KEY, action text, actor uuid);
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY, value jsonb);
CREATE TABLE IF NOT EXISTS public.order_returns (
  id bigserial PRIMARY KEY, order_id uuid, status text);
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id bigserial PRIMARY KEY, product_id text, approved boolean DEFAULT false);
CREATE TABLE IF NOT EXISTS public.admin_products (
  id bigserial PRIMARY KEY, name text, stock text);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_returns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_products  ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- O GRANT por coluna de 20260716120000, reproduzido: `is_admin` e
-- `admin_capabilities` NÃO entram. É a primeira barreira; o trigger é a segunda.
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (display_name) ON public.user_profiles TO authenticated;

-- Personagens
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dona@ervatorio.test'),
  ('22222222-2222-2222-2222-222222222222', 'despacho@ervatorio.test'),
  ('33333333-3333-3333-3333-333333333333', 'cliente@ervatorio.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_profiles (id, display_name, is_admin) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dona',     true),
  ('22222222-2222-2222-2222-222222222222', 'Despacho', true),
  ('33333333-3333-3333-3333-333333333333', 'Cliente',  false)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- A migration de verdade
-- ------------------------------------------------------------
\i supabase/migrations/20260815220000_rbac_por_capacidade.sql

\echo ''
\echo '=== 1. Compatibilidade: admin existente manteve tudo ==='
-- O aplicar da migration não pode tirar acesso de ninguém.
SELECT
  (SELECT admin_capabilities = public.capacidades_conhecidas()
     FROM public.user_profiles WHERE display_name = 'Dona') AS dona_tem_tudo,
  (SELECT admin_capabilities = '{}'
     FROM public.user_profiles WHERE display_name = 'Cliente') AS cliente_sem_nada;

-- Reduz o Despacho ao que ele precisa. É a operação que a migration
-- deliberadamente não faz sozinha — ela não sabe quem é quem.
UPDATE public.user_profiles
   SET admin_capabilities = ARRAY['pedidos:ler','pedidos:escrever','devolucoes:escrever']
 WHERE display_name = 'Despacho';

\echo ''
\echo '=== 2. A capacidade decide, e is_admin sozinho não basta ==='
SET request.actor = '22222222-2222-2222-2222-222222222222';
SELECT
  public.is_admin()                                AS eh_admin,
  public.tem_capacidade('devolucoes:escrever')     AS pode_devolucao,
  public.tem_capacidade('usuarios:excluir')        AS pode_apagar_usuario,
  public.tem_capacidade('configuracoes:escrever')  AS pode_configuracao;
-- Esperado: t | t | f | f
-- A terceira coluna é o ponto do arquivo inteiro: antes desta migration
-- ela seria `t`, e quem despacha pedido apagaria a base de usuários.

\echo ''
\echo '=== 3. A policy recusa de verdade, não só a função ==='
SET ROLE authenticated;
SET request.actor = '22222222-2222-2222-2222-222222222222';

-- Tem a capacidade: escreve.
INSERT INTO public.order_returns (order_id, status)
VALUES ('44444444-4444-4444-4444-444444444444', 'solicitada');
\echo 'devolucao inserida (esperado: INSERT 0 1)'

-- Não tem: o RLS barra.
DO $$
BEGIN
  INSERT INTO public.site_settings (key, value) VALUES ('payments_enabled', 'true'::jsonb);
  RAISE EXCEPTION 'FALHOU: escreveu em site_settings sem a capacidade';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok: site_settings recusou (42501)';
END $$;

DO $$
BEGIN
  INSERT INTO public.admin_products (name, stock) VALUES ('Camomila', 'in');
  RAISE EXCEPTION 'FALHOU: escreveu no catálogo sem a capacidade';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok: catálogo recusou (42501)';
END $$;

-- A trilha de auditoria não é legível para quem não tem a capacidade.
SELECT count(*) = 0 AS auditoria_invisivel FROM public.admin_audit_log;

RESET ROLE;

\echo ''
\echo '=== 4. Quem não é admin não passa, mesmo com capacidade na coluna ==='
-- Cenário do dedo errado: alguém escreve capacidades num perfil comum.
-- `tem_capacidade` exige as duas coisas, então continua fechado — e
-- revogar is_admin basta para tirar tudo.
UPDATE public.user_profiles
   SET admin_capabilities = public.capacidades_conhecidas()
 WHERE display_name = 'Cliente';

SET request.actor = '33333333-3333-3333-3333-333333333333';
SELECT
  public.is_admin()                            AS eh_admin,
  public.tem_capacidade('usuarios:excluir')    AS pode_apagar,
  public.tem_capacidade('catalogo:escrever')   AS pode_catalogo;
-- Esperado: f | f | f

\echo ''
\echo '=== 5. Ninguém se autoconcede capacidade ==='
SET ROLE authenticated;
SET request.actor = '33333333-3333-3333-3333-333333333333';
DO $$
BEGIN
  UPDATE public.user_profiles
     SET admin_capabilities = ARRAY['usuarios:excluir']
   WHERE id = auth.uid();
  RAISE EXCEPTION 'FALHOU: usuário concedeu capacidade a si mesmo';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'ok: autoconcessão recusada (42501)';
END $$;
RESET ROLE;

\echo ''
\echo '=== 6. Capacidade inventada é recusada pelo CHECK ==='
DO $$
BEGIN
  UPDATE public.user_profiles
     SET admin_capabilities = ARRAY['pedidos:escrver']  -- erro de digitação
   WHERE display_name = 'Despacho';
  RAISE EXCEPTION 'FALHOU: aceitou capacidade desconhecida';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'ok: capacidade desconhecida recusada (23514)';
END $$;

\echo ''
\echo '=== 7. A migration é idempotente ==='
\i supabase/migrations/20260815220000_rbac_por_capacidade.sql
\echo 'aplicada duas vezes sem erro'

-- O reaplicar NÃO pode devolver todas as capacidades a quem foi reduzido:
-- o UPDATE de compatibilidade é guardado por `admin_capabilities = '{}'`.
SELECT array_length(admin_capabilities, 1) = 3 AS despacho_continua_reduzido
  FROM public.user_profiles WHERE display_name = 'Despacho';

\echo ''
\echo '=== FIM — nenhum `f` acima, nenhum FALHOU ==='
