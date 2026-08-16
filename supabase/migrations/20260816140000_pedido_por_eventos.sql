-- ============================================================
-- O estado do pedido sai dos fatos, e `orders.status` vira projeção
-- ============================================================
--
-- ## O defeito
--
-- `orders.status` é sobrescrito por três caminhos independentes:
--
--   * `create-order` escreve `pending`;
--   * `mp-webhook` escreve o resultado do pagamento;
--   * `js/admin-orders.js` escreve o que o admin escolher — **do navegador**,
--     com `update` direto na tabela.
--
-- Nenhum deles sabe o que os outros escreveram, e a coluna só guarda o último.
-- A idempotência do webhook é feita à mão (`if (order.status === newStatus)`),
-- e ela não cobre o caso que importa: um `paid` atrasado do Mercado Pago —
-- reentrega depois de instabilidade, notificação duplicada — que chega DEPOIS
-- de um `refunded`. Os dois valores são diferentes, o noop não pega, e o
-- pedido volta a «pago» com o dinheiro já devolvido.
--
-- `order_status_history` existe, mas **nada escreve nela**: aparece só no mapa
-- de rótulos de `js/admin-audit.js`. É a mesma forma de tabela que promete
-- histórico e não tem linha.
--
-- ## A decisão
--
-- `pedido_eventos` é append-only por gatilho: o banco recusa `update` e
-- `delete`. Corrigir um fato é ACRESCENTAR o que corrige.
--
-- O estado corrente é o MAIOR já alcançado, numa ordem de irreversibilidade —
-- não o último a chegar. É o que faz entrega fora de ordem deixar de corromper,
-- e o que dá idempotência de graça.
--
-- `orders.status` continua como PROJEÇÃO mantida por gatilho, porque há
-- leitores em `js/` e em `admin-metrics` que filtram por ela em SQL.
--
-- ## A porta do navegador
--
-- Projeção só é projeção se ninguém mais escrever nela. O `update` direto de
-- `js/admin-orders.js` continuaria funcionando e sobrescrevendo o gatilho, então
-- o privilégio de coluna é revogado: `authenticated` deixa de poder escrever
-- `status`. Quem move o pedido passa pela função `registrar_fato_do_pedido`,
-- que confere a capacidade.
--
-- ## Como testar
--   supabase/tests/20260816_pedido_eventos_test.sql
--
-- ## Rollback
--   DROP TRIGGER IF EXISTS trg_pedido_eventos_append_only ON public.pedido_eventos;
--   DROP TRIGGER IF EXISTS trg_projetar_status_do_pedido ON public.pedido_eventos;
--   DROP FUNCTION IF EXISTS public.registrar_fato_do_pedido(uuid, text, text);
--   DROP FUNCTION IF EXISTS public.recusar_escrita_em_evento();
--   DROP FUNCTION IF EXISTS public.projetar_status_do_pedido();
--   DROP TABLE IF EXISTS public.pedido_eventos;
--   GRANT UPDATE ON public.orders TO authenticated;   -- devolve a tabela inteira
-- `orders.status` guarda o último valor projetado: nenhum pedido perde estado.
-- ============================================================

-- ------------------------------------------------------------
-- 1) A régua, no banco
-- ------------------------------------------------------------
-- Ordem de IRREVERSIBILIDADE, não cronológica. A mesma lista existe em
-- `supabase/functions/_shared/estado-do-pedido.ts`, e o teste compara as duas:
-- se divergirem, a projeção passa a discordar da derivação em silêncio.
--
-- `cancelled` e `refunded` no topo, acima de `delivered`, porque desfecho
-- negativo que chega atrasado deve prevalecer — é o erro barato dos dois.
-- `failed` fica logo acima de `pending`: é a falha do pagamento, e qualquer
-- pagamento posterior que dê certo deve passar por cima dela.
CREATE OR REPLACE FUNCTION public.estados_do_pedido()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'pending',    -- criado, aguardando pagamento
    'failed',     -- pagamento recusado
    'paid',
    'processing', -- em preparo
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  ]::text[];
$$;

-- ------------------------------------------------------------
-- 2) pedido_eventos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pedido_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  estado text NOT NULL,
  CONSTRAINT estado_conhecido CHECK (estado = ANY(public.estados_do_pedido())),

  -- De onde veio o fato. Sem isto, «quem mudou este pedido?» só se responde
  -- cruzando o log de auditoria com a hora, e nem sempre dá.
  origem text NOT NULL DEFAULT 'sistema',
  CONSTRAINT origem_conhecida CHECK (origem IN ('webhook', 'admin', 'cliente', 'sistema')),

  -- Quando ACONTECEU, que não é quando a linha foi escrita. A distinção
  -- importa no webhook atrasado: o pagamento ocorreu no gateway, a linha nasce
  -- aqui, às vezes minutos depois — e é `ocorrido_em` que vai no extrato.
  ocorrido_em timestamptz NOT NULL DEFAULT now(),
  registrado_em timestamptz NOT NULL DEFAULT now(),

  motivo text,
  referencia text,   -- id de pagamento, código de rastreio
  autor uuid         -- quem fez, quando há alguém. NULL para webhook.
);

COMMENT ON TABLE public.pedido_eventos IS
  'A verdade sobre o pedido. Append-only. orders.status é projeção — ver 20260816140000.';

CREATE INDEX IF NOT EXISTS pedido_eventos_order_idx
  ON public.pedido_eventos (order_id, ocorrido_em DESC);

-- ------------------------------------------------------------
-- 3) Backfill — ninguém perde o estado que já tinha
-- ------------------------------------------------------------
-- Sem isto, o primeiro recálculo devolveria `pending` para a base inteira:
-- pedidos pagos e entregues voltariam a «aguardando pagamento».
--
-- `ocorrido_em` sai da melhor data conhecida. Datar tudo com `now()` diria que
-- a base inteira mudou de estado no minuto da migration.
INSERT INTO public.pedido_eventos (order_id, estado, origem, ocorrido_em, motivo)
SELECT
  o.id,
  o.status,
  'sistema',
  COALESCE(
    CASE o.status
      WHEN 'delivered' THEN o.delivered_at
      WHEN 'shipped'   THEN o.shipped_at
      WHEN 'paid'      THEN o.paid_at
      ELSE NULL
    END,
    o.paid_at,
    o.created_at
  ),
  'Estado que o pedido já tinha quando os fatos nasceram (20260816140000).'
FROM public.orders o
WHERE o.status = ANY(public.estados_do_pedido())
  AND NOT EXISTS (
    SELECT 1 FROM public.pedido_eventos e WHERE e.order_id = o.id
  );

-- ------------------------------------------------------------
-- 4) Append-only, imposto pelo banco
-- ------------------------------------------------------------
-- Um histórico que se edita não é histórico. Em código a regra vale até o
-- primeiro `update` escrito às pressas para "corrigir" uma linha — e é
-- justamente essa correção que apagaria a prova do que aconteceu.
CREATE OR REPLACE FUNCTION public.recusar_escrita_em_evento()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'pedido_eventos e append-only: % recusado. Para corrigir, acrescente um fato.',
    TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_pedido_eventos_append_only ON public.pedido_eventos;
CREATE TRIGGER trg_pedido_eventos_append_only
  BEFORE UPDATE OR DELETE ON public.pedido_eventos
  FOR EACH ROW EXECUTE FUNCTION public.recusar_escrita_em_evento();

-- ------------------------------------------------------------
-- 5) A projeção
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.projetar_status_do_pedido()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  maior text;
BEGIN
  SELECT e.estado INTO maior
    FROM public.pedido_eventos e
   WHERE e.order_id = NEW.order_id
   ORDER BY array_position(public.estados_do_pedido(), e.estado) DESC
   LIMIT 1;

  UPDATE public.orders
     SET status = COALESCE(maior, 'pending')
   WHERE id = NEW.order_id
     AND status IS DISTINCT FROM COALESCE(maior, 'pending');

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_projetar_status_do_pedido ON public.pedido_eventos;
CREATE TRIGGER trg_projetar_status_do_pedido
  AFTER INSERT ON public.pedido_eventos
  FOR EACH ROW EXECUTE FUNCTION public.projetar_status_do_pedido();

COMMENT ON COLUMN public.orders.status IS
  'PROJEÇÃO do maior estado alcançado em pedido_eventos. Não escreva aqui: registre um fato.';

-- ------------------------------------------------------------
-- 6) RLS e a porta do navegador
-- ------------------------------------------------------------
ALTER TABLE public.pedido_eventos ENABLE ROW LEVEL SECURITY;

-- Quem vê o pedido vê o histórico dele. É o extrato do comprador — «pago em
-- tal dia, enviado em tal outro» —, e escondê-lo faria o suporte responder o
-- que a tela poderia.
DROP POLICY IF EXISTS pedido_eventos_dono_le ON public.pedido_eventos;
CREATE POLICY pedido_eventos_dono_le ON public.pedido_eventos
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
     WHERE o.id = pedido_eventos.order_id
       AND (o.user_id = auth.uid() OR public.tem_capacidade('pedidos:ler'))
  ));

-- Escrita: ninguém, por RLS. Quem registra é `registrar_fato_do_pedido`
-- (abaixo) ou o `service_role` do webhook. Um `insert` livre aqui permitiria a
-- qualquer pessoa autenticada declarar o próprio pedido como `delivered`.
REVOKE INSERT, UPDATE, DELETE ON public.pedido_eventos FROM anon, authenticated;
GRANT SELECT ON public.pedido_eventos TO authenticated;

-- **A porta que estava aberta.** `js/admin-orders.js` fazia
-- `update({ status }).eq('id', ...)` direto da tela. Projeção só é projeção se
-- ninguém mais escrever nela — senão o gatilho calcula um valor e o navegador
-- grava outro por cima, e a coluna volta a ser a verdade que envelhece.
--
-- ## Por que NÃO basta `REVOKE UPDATE (status)`
--
-- Porque privilégio de coluna e privilégio de tabela são coisas **separadas**
-- no Postgres, e o de tabela não é feito de colunas: um `GRANT UPDATE ON orders`
-- já concedido continua valendo para TODAS as colunas, e o `REVOKE` de uma
-- coluna isolada não subtrai nada dele. A escrita continuaria passando, e o
-- comando não daria erro nenhum — apenas não faria efeito.
--
-- Foi exatamente o que aconteceu na primeira versão desta migration, e o teste
-- só flagrou depois de o arremedo passar a reproduzir a policy `orders_admin_all`
-- de produção. Antes disso a RLS barrava o update por falta de policy, o teste
-- via `UPDATE 0` e dava a resposta certa pelo motivo errado.
--
-- A forma que funciona é derrubar o privilégio de TABELA e reconceder por
-- coluna, nominalmente. O custo é ter de manter esta lista: coluna nova que o
-- admin precise editar pela tela **entra aqui**, senão a tela quebra com
-- «permission denied». É um custo aceito — a alternativa é a coluna de estado
-- continuar escrevível do navegador.
REVOKE UPDATE ON public.orders FROM authenticated;

GRANT UPDATE (
  shipping_carrier,
  shipping_tracking_code,
  admin_notes
) ON public.orders TO authenticated;

-- ------------------------------------------------------------
-- 7) O caminho de quem move o pedido pela tela
-- ------------------------------------------------------------
-- `security definer` porque escreve numa tabela que `authenticated` não
-- alcança — e é por isso que ela **confere a capacidade por dentro**: uma
-- função definer sem checagem é a própria escalada de privilégio que a RLS
-- acima acabou de fechar.
CREATE OR REPLACE FUNCTION public.registrar_fato_do_pedido(
  p_order_id uuid,
  p_estado text,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.tem_capacidade('pedidos:escrever') THEN
    RAISE EXCEPTION 'sem capacidade pedidos:escrever'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (p_estado = ANY(public.estados_do_pedido())) THEN
    RAISE EXCEPTION 'estado desconhecido: %', p_estado
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.pedido_eventos (order_id, estado, origem, motivo, autor)
  VALUES (p_order_id, p_estado, 'admin', p_motivo, auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_fato_do_pedido(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_fato_do_pedido(uuid, text, text) TO authenticated;

-- ------------------------------------------------------------
-- 8) order_status_history: declarada morta
-- ------------------------------------------------------------
-- Não é apagada agora — apagar tabela é irreversível e ela não custa nada
-- vazia. Fica o comentário, para a próxima pessoa não escrever nela achando
-- que é o caminho vivo.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name='order_status_history') THEN
    EXECUTE $c$COMMENT ON TABLE public.order_status_history IS
      'MORTA desde 16/08/2026: nada escrevia nela. O histórico vive em pedido_eventos.'$c$;
  END IF;
END $$;
