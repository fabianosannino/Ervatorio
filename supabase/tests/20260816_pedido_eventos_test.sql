-- ============================================================
-- Teste do pedido por eventos (20260816140000_pedido_por_eventos.sql)
-- ============================================================
-- Roda num Postgres descartável. Monta um arremedo do ambiente, aplica a
-- migration DE VERDADE via \i e exercita o que ela promete.
--
--   initdb -D /tmp/pgped -U postgres --auth=trust
--   pg_ctl -D /tmp/pgped -o "-p 5438 -k /tmp" start
--   psql -h /tmp -p 5438 -U postgres -f supabase/tests/20260816_pedido_eventos_test.sql
--
-- Saída esperada: todos os blocos com `t`. Qualquer `f` é regressão.
-- ============================================================

\set ON_ERROR_STOP on

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

CREATE OR REPLACE FUNCTION public.tem_capacidade(capacidade text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $fn$
  SELECT COALESCE(
    (SELECT up.is_admin AND capacidade = ANY(up.admin_capabilities)
       FROM public.user_profiles up WHERE up.id = auth.uid()),
    false);
$fn$;
GRANT EXECUTE ON FUNCTION public.tem_capacidade(text) TO authenticated;

-- `orders`, no estado em que ela está antes desta migration.
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  total_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz, shipped_at timestamptz, delivered_at timestamptz,
  -- As colunas que o admin edita pela tela. Precisam existir aqui: a migration
  -- as reconcede nominalmente, e um `GRANT` sobre coluna inexistente ERRA — que
  -- é o comportamento desejado, porque avisa que a lista da migration e o
  -- esquema de produção divergiram.
  shipping_carrier text,
  shipping_tracking_code text,
  admin_notes text);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orders_dono ON public.orders;
CREATE POLICY orders_dono ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.tem_capacidade('pedidos:ler'));

-- **Esta policy precisa existir no arremedo, e a primeira versão do teste não a
-- tinha.** Em produção ela existe (`orders_admin_all`, `FOR ALL`, migration
-- 20260727030000) — é o que permitia a `js/admin-orders.js` escrever `status`
-- direto do navegador.
--
-- Sem ela aqui, o bloco 5 passava pelo MOTIVO ERRADO: a RLS barrava o `update`
-- antes de o privilégio de coluna ser avaliado, e o teste imprimia `UPDATE 0`
-- em vez do erro de permissão. Provaria que a porta está fechada num banco onde
-- ela já estava fechada por outra razão — e continuaria verde se o `REVOKE` da
-- migration fosse removido.
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all ON public.orders
  FOR ALL TO authenticated
  USING (public.tem_capacidade('pedidos:escrever'))
  WITH CHECK (public.tem_capacidade('pedidos:escrever'));

GRANT SELECT, UPDATE ON public.orders TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Personagens
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'ana@ervatorio.test'),
  ('22222222-2222-2222-2222-222222222222', 'despacho@ervatorio.test'),
  ('33333333-3333-3333-3333-333333333333', 'leitor@ervatorio.test')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_profiles (id, display_name, is_admin, admin_capabilities) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ana',      false, ARRAY[]::text[]),
  ('22222222-2222-2222-2222-222222222222', 'Despacho', true,  ARRAY['pedidos:ler','pedidos:escrever']),
  ('33333333-3333-3333-3333-333333333333', 'Leitor',   true,  ARRAY['pedidos:ler'])
ON CONFLICT DO NOTHING;

-- Pedidos que já existem quando a migration roda.
INSERT INTO public.orders (id, user_id, status, total_cents, paid_at) VALUES
  ('aaaa0000-0000-4000-8000-000000000001', '11111111-1111-1111-1111-111111111111', 'delivered', 5000, now() - interval '10 days'),
  ('aaaa0000-0000-4000-8000-000000000002', '11111111-1111-1111-1111-111111111111', 'pending',   3000, NULL)
ON CONFLICT DO NOTHING;

\i supabase/migrations/20260816140000_pedido_por_eventos.sql

\echo ''
\echo '=== 1. Backfill: ninguém perdeu o estado que tinha ==='
-- Sem isto, o primeiro recálculo devolveria `pending` para a base inteira.
SELECT
  (SELECT status = 'delivered' FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000001') AS entregue_continua,
  (SELECT count(*) = 2 FROM public.pedido_eventos) AS um_fato_por_pedido;
-- Esperado: t | t

\echo ''
\echo '=== 2. A projeção acompanha o maior fato ==='
INSERT INTO public.pedido_eventos (order_id, estado, origem)
VALUES ('aaaa0000-0000-4000-8000-000000000002', 'paid', 'webhook');
SELECT status = 'paid' AS subiu FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000002';

INSERT INTO public.pedido_eventos (order_id, estado, origem)
VALUES ('aaaa0000-0000-4000-8000-000000000002', 'shipped', 'admin');
SELECT status = 'shipped' AS subiu_de_novo FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000002';
-- Esperado: t | t

\echo ''
\echo '=== 3. O caso que motivou tudo: `paid` atrasado após `refunded` ==='
-- Reentrega do Mercado Pago depois de instabilidade. A comparação antiga era
-- `order.status === newStatus`; os dois valores são diferentes, o noop não
-- pegava, e o pedido voltava a «pago» com o dinheiro já devolvido.
INSERT INTO public.pedido_eventos (order_id, estado, origem)
VALUES ('aaaa0000-0000-4000-8000-000000000002', 'refunded', 'webhook');
SELECT status = 'refunded' AS reembolsou FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000002';

INSERT INTO public.pedido_eventos (order_id, estado, origem, motivo)
VALUES ('aaaa0000-0000-4000-8000-000000000002', 'paid', 'webhook', 'reentrega atrasada');
SELECT status = 'refunded' AS o_atrasado_nao_desfez FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000002';
-- Esperado: t | t  ← a segunda é a propriedade que justifica o desenho inteiro

\echo ''
\echo '=== 4. Append-only: o banco recusa editar e apagar ==='
\set ON_ERROR_STOP off
UPDATE public.pedido_eventos SET estado = 'delivered' WHERE order_id='aaaa0000-0000-4000-8000-000000000002';
\echo '^ esperado: ERRO (update recusado)'
DELETE FROM public.pedido_eventos WHERE order_id='aaaa0000-0000-4000-8000-000000000002';
\echo '^ esperado: ERRO (delete recusado)'

INSERT INTO public.pedido_eventos (order_id, estado) VALUES ('aaaa0000-0000-4000-8000-000000000002', 'teleportado');
\echo '^ esperado: ERRO (estado fora da lista)'
\set ON_ERROR_STOP on

SELECT count(*) >= 5 AS nada_foi_apagado FROM public.pedido_eventos;
-- Esperado: t

\echo ''
\echo '=== 5. A porta do navegador está fechada ==='
SET ROLE authenticated;
SET request.actor = '22222222-2222-2222-2222-222222222222';

\set ON_ERROR_STOP off
-- Era exatamente isto que `js/admin-orders.js` fazia. Projeção só é projeção
-- se ninguém mais escrever nela.
-- A RLS DEIXA (o Despacho tem `pedidos:escrever` e a policy é FOR ALL). Quem
-- recusa é o privilégio de coluna revogado pela migration. Se o erro que
-- aparecer aqui for outro, ou se não aparecer nenhum, a porta não está fechada
-- por onde eu disse que está.
UPDATE public.orders SET status = 'delivered' WHERE id='aaaa0000-0000-4000-8000-000000000002';
\echo '^ esperado: ERRO permission denied (a coluna status saiu do grant)'

-- A contraprova, e ela é a metade que evita o remédio pior que a doença: as
-- colunas que a tela do admin EDITA precisam continuar escrevíveis. Sem isto,
-- o `REVOKE UPDATE` de tabela inteira passaria neste arquivo e quebraria
-- transportadora, rastreio e observação em produção, com «permission denied».
UPDATE public.orders
   SET admin_notes = 'anotacao do despacho',
       shipping_carrier = 'Correios',
       shipping_tracking_code = 'BR123'
 WHERE id='aaaa0000-0000-4000-8000-000000000002';
\echo '^ esperado: UPDATE 1 (as colunas da tela seguem escrevíveis)'

-- E ninguém insere fato pela porta do cliente: seria declarar o próprio
-- pedido como entregue.
INSERT INTO public.pedido_eventos (order_id, estado) VALUES ('aaaa0000-0000-4000-8000-000000000002', 'delivered');
\echo '^ esperado: ERRO (insert direto recusado)'
\set ON_ERROR_STOP on

RESET ROLE;
SELECT status = 'refunded' AS continua_reembolsado FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000002';
-- Esperado: t

\echo ''
\echo '=== 6. O caminho legítimo exige a capacidade ==='
SET ROLE authenticated;

-- Quem só lê não move.
SET request.actor = '33333333-3333-3333-3333-333333333333';
\set ON_ERROR_STOP off
SELECT public.registrar_fato_do_pedido('aaaa0000-0000-4000-8000-000000000001', 'refunded', 'tentativa');
\echo '^ esperado: ERRO (sem pedidos:escrever)'
\set ON_ERROR_STOP on

-- A cliente comum também não.
SET request.actor = '11111111-1111-1111-1111-111111111111';
\set ON_ERROR_STOP off
SELECT public.registrar_fato_do_pedido('aaaa0000-0000-4000-8000-000000000001', 'delivered', 'meu proprio pedido');
\echo '^ esperado: ERRO (sem capacidade)'
\set ON_ERROR_STOP on

-- Quem tem a capacidade, move.
SET request.actor = '22222222-2222-2222-2222-222222222222';
SELECT public.registrar_fato_do_pedido('aaaa0000-0000-4000-8000-000000000001', 'refunded', 'devolucao aceita');
RESET ROLE;
SELECT status = 'refunded' AS o_despacho_moveu FROM public.orders WHERE id='aaaa0000-0000-4000-8000-000000000001';
-- Esperado: t

\echo ''
\echo '=== 7. Quem vê o pedido vê o histórico; quem não vê, não ==='
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
SELECT count(*) > 0 AS ana_le_o_proprio_extrato FROM public.pedido_eventos
 WHERE order_id = 'aaaa0000-0000-4000-8000-000000000001';

-- Um pedido de outra pessoa.
RESET ROLE;
INSERT INTO public.orders (id, user_id, status, total_cents)
VALUES ('bbbb0000-0000-4000-8000-000000000001', '33333333-3333-3333-3333-333333333333', 'pending', 100)
ON CONFLICT DO NOTHING;
INSERT INTO public.pedido_eventos (order_id, estado) VALUES ('bbbb0000-0000-4000-8000-000000000001', 'paid');

SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
SELECT count(*) = 0 AS ana_nao_le_o_dos_outros FROM public.pedido_eventos
 WHERE order_id = 'bbbb0000-0000-4000-8000-000000000001';
RESET ROLE;
RESET request.actor;
-- Esperado: t | t

\echo ''
\echo '=== 8. A régua do banco é a mesma do TypeScript ==='
-- `supabase/functions/_shared/estado-do-pedido.ts` tem a lista em ESTADOS_DO_PEDIDO.
-- Se divergirem, a projeção passa a discordar da derivação EM SILÊNCIO: nada
-- quebra, a tela mostra um estado e o webhook decide por outro.
SELECT public.estados_do_pedido() =
  ARRAY['pending','failed','paid','processing','shipped','delivered','cancelled','refunded']::text[]
  AS regua_confere;
-- Esperado: t

\echo ''
\echo '=== fim ==='
