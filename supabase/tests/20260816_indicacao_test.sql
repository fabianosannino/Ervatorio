-- ============================================================
-- Teste da indicação (20260816120000_indicacao_de_terceiro.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. Monta um
-- arremedo do ambiente, aplica a migration DE VERDADE via \i e exercita o que
-- ela promete.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgind -U postgres --auth=trust
--   pg_ctl -D /tmp/pgind -o "-p 5437 -k /tmp" start
--   psql -h /tmp -p 5437 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260816_indicacao_test.sql
--
-- Saída esperada: todos os blocos com `t`. Qualquer `f` é regressão.
--
-- O que este arquivo NÃO cobre, e é bom saber: a recusa da `create-order` a
-- produto de indicação é TypeScript, não SQL — está em
-- `supabase/functions/create-order/index.ts` e não tem teste automático neste
-- repositório. É a barreira mais importante da mudança, e a que depende de
-- conferência manual no staging.
-- ============================================================

\set ON_ERROR_STOP on

-- ------------------------------------------------------------
-- Arremedo do ambiente Supabase
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- A tabela de produtos, no estado em que ela está antes desta migration.
CREATE TABLE IF NOT EXISTS public.admin_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL,
  active boolean DEFAULT true,
  supplier text);

GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Produtos que já existem quando a migration roda. Nenhum deles pode mudar de
-- comportamento — é a primeira coisa que o teste confere.
INSERT INTO public.admin_products (id, name, price) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Camomila 50g', 24.90),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Gaiwan de porcelana', 89.00)
ON CONFLICT DO NOTHING;

-- Personagens
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dona@ervatorio.test'),
  ('22222222-2222-2222-2222-222222222222', 'despacho@ervatorio.test'),
  ('33333333-3333-3333-3333-333333333333', 'cliente@ervatorio.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_profiles (id, display_name, is_admin, admin_capabilities) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dona',     true,  ARRAY['configuracoes:escrever']),
  ('22222222-2222-2222-2222-222222222222', 'Despacho', true,  ARRAY['pedidos:ler']),
  ('33333333-3333-3333-3333-333333333333', 'Cliente',  false, ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- A migration de verdade
-- ------------------------------------------------------------
\i supabase/migrations/20260816120000_indicacao_de_terceiro.sql

\echo ''
\echo '=== 1. Produto que já existia continua sendo nosso ==='
-- O default é `proprio`. Se esta migration mudasse o comportamento de produto
-- existente, dois itens do catálogo sumiriam da vitrine no deploy.
SELECT
  (SELECT count(*) = 2 FROM public.admin_products WHERE modo_de_venda = 'proprio') AS todos_proprios,
  (SELECT count(*) = 0 FROM public.admin_products WHERE link_externo IS NOT NULL)  AS nenhum_link;
-- Esperado: t | t

\echo ''
\echo '=== 2. A bicondicional: os DOIS lados erram ==='
\set ON_ERROR_STOP off
-- Indicação sem link: o card não teria para onde encaminhar.
INSERT INTO public.admin_products (name, price, modo_de_venda)
VALUES ('Livro sem link', 70.00, 'indicacao');
\echo '^ esperado: ERRO (indicacao sem link)'

-- Venda própria COM link: teria dois caminhos de compra, e o comprador
-- escolheria justamente o que não gera pedido nosso.
INSERT INTO public.admin_products (name, price, modo_de_venda, link_externo)
VALUES ('Camomila com link', 24.90, 'proprio', 'https://exemplo.test/x');
\echo '^ esperado: ERRO (proprio com link)'

-- Modo inventado.
INSERT INTO public.admin_products (name, price, modo_de_venda)
VALUES ('Modo estranho', 10.00, 'consignado');
\echo '^ esperado: ERRO (modo_de_venda fora da lista)'
\set ON_ERROR_STOP on

\echo ''
\echo '=== 3. O link é conferido pelo BANCO ==='
SELECT
  public.link_de_indicacao_seguro('https://www.amazon.com.br/dp/B01?tag=erv-20') AS ok_https,
  public.link_de_indicacao_seguro('http://www.amazon.com.br/dp/B01')             AS recusa_http,
  public.link_de_indicacao_seguro('javascript:alert(1)')                         AS recusa_javascript,
  public.link_de_indicacao_seguro('https://ervatorio.com.br@evil.tld/login')     AS recusa_credencial,
  public.link_de_indicacao_seguro('https://exemplo.test/a b')                    AS recusa_espaco,
  public.link_de_indicacao_seguro(NULL)                                          AS recusa_nulo;
-- Esperado: t | f | f | f | f | f
--
-- A quarta é a que engana o olho: `https://ervatorio.com.br@evil.tld` tem o
-- nosso domínio no lugar do usuário, e o navegador vai para `evil.tld`.

\set ON_ERROR_STOP off
INSERT INTO public.admin_products (name, price, modo_de_venda, link_externo)
VALUES ('Indicação insegura', 10.00, 'indicacao', 'http://exemplo.test/x');
\echo '^ esperado: ERRO (CHECK do link)'
\set ON_ERROR_STOP on

\echo ''
\echo '=== 4. Uma indicação válida entra ==='
INSERT INTO public.admin_products (id, name, price, modo_de_venda, link_externo, parceiro)
VALUES ('bbbbbbbb-0000-4000-8000-000000000001', 'Bule de vidro (Amazon)', 149.00,
        'indicacao', 'https://www.amazon.com.br/dp/B0TEST?tag=erv-20', 'Amazon');
SELECT
  (SELECT modo_de_venda = 'indicacao' FROM public.admin_products
    WHERE id='bbbbbbbb-0000-4000-8000-000000000001') AS entrou;
-- Esperado: t

\echo ''
\echo '=== 5. `indicacao:ler` entrou na lista conhecida ==='
-- Sem isto o CHECK de user_profiles recusaria conceder a capacidade, e a
-- policy de cliques ficaria inalcançável PARA SEMPRE, sem erro nenhum: a
-- tabela do painel só ficaria vazia.
SELECT
  'indicacao:ler' = ANY(public.capacidades_conhecidas()) AS na_lista,
  (SELECT 'indicacao:ler' = ANY(admin_capabilities) FROM public.user_profiles
    WHERE id='22222222-2222-2222-2222-222222222222') AS admin_existente_recebeu,
  (SELECT 'indicacao:ler' = ANY(admin_capabilities) FROM public.user_profiles
    WHERE id='33333333-3333-3333-3333-333333333333') AS nao_admin_nao_recebeu;
-- Esperado: t | t | f

\echo ''
\echo '=== 6. Os cliques: quem lê e quem não lê ==='
INSERT INTO public.cliques_de_indicacao (produto_id)
VALUES ('bbbbbbbb-0000-4000-8000-000000000001'),
       ('bbbbbbbb-0000-4000-8000-000000000001');

SET ROLE authenticated;

-- O cliente não alcança: volume encaminhado é informação comercial.
SET request.actor = '33333333-3333-3333-3333-333333333333';
SELECT count(*) = 0 AS cliente_nao_le FROM public.cliques_de_indicacao;
-- Esperado: t

-- O admin com a capacidade lê, e é com isso que se confere a fatura.
SET request.actor = '22222222-2222-2222-2222-222222222222';
SELECT count(*) = 2 AS admin_le FROM public.cliques_de_indicacao;
-- Esperado: t

-- O admin SEM a capacidade não lê. Aqui a Dona volta a ter só
-- `configuracoes:escrever` — entrar no painel não é ver tudo dentro dele.
-- (A migration lhe deu `indicacao:ler` no backfill; tiramos de volta para
-- exercitar a recusa. Precisa sair do papel `authenticated` para escrever em
-- `user_profiles`, que é justamente o ponto: o próprio admin não se concede.)
RESET ROLE;
UPDATE public.user_profiles
   SET admin_capabilities = ARRAY['configuracoes:escrever']
 WHERE id = '11111111-1111-1111-1111-111111111111';
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
SELECT count(*) = 0 AS admin_sem_capacidade_nao_le FROM public.cliques_de_indicacao;
-- Esperado: t

\echo ''
\echo '=== 7. Ninguém escreve clique pela porta do cliente ==='
-- Quem escreve é a Edge Function com service_role, que não passa por RLS. Sem
-- esta recusa, qualquer visitante inflaria a contagem que fatura o parceiro.
\set ON_ERROR_STOP off
SET request.actor = '22222222-2222-2222-2222-222222222222';
INSERT INTO public.cliques_de_indicacao (produto_id)
VALUES ('bbbbbbbb-0000-4000-8000-000000000001');
\echo '^ esperado: ERRO ou 0 linhas (admin nao escreve clique)'
\set ON_ERROR_STOP on

RESET ROLE;
RESET request.actor;

\echo ''
\echo '=== 8. Apagar o produto leva os cliques junto ==='
-- ON DELETE CASCADE: clique órfão não conta para ninguém e ainda apareceria
-- no total.
DELETE FROM public.admin_products WHERE id='bbbbbbbb-0000-4000-8000-000000000001';
SELECT count(*) = 0 AS cliques_foram_junto FROM public.cliques_de_indicacao;
-- Esperado: t

\echo ''
\echo '=== fim ==='
