-- ============================================================
-- Indicação — o parceiro vende na loja dele, e nós medimos o que mandamos
-- ============================================================
--
-- ## As duas modalidades, e por que a diferença precisa ser estrutural
--
-- Um produto que não é nosso pode ser vendido de dois jeitos:
--
--   * **indicação** — o parceiro vende na loja dele (Amazon, Mercado Livre,
--     loja própria), o dinheiro NÃO passa por aqui, e nós recebemos comissão
--     sobre o que encaminhamos;
--   * **marketplace** — a cobrança passa por nós, e nós entregamos.
--
-- A diferença não é arrumação de tela. No marketplace deixamos de ser vitrine
-- e viramos intermediário, e o CDC trata a cadeia de fornecimento como
-- **solidária**: o comprador escolhe de quem cobrar quando o outro lado não
-- entrega. Descobrir de qual tipo era o produto no meio de uma reclamação é
-- tarde — daí a constraint, e não a convenção.
--
-- ## O erro que a bicondicional impede
--
-- `link_externo` sem `indicacao` é tão errado quanto `indicacao` sem link. Um
-- produto de venda própria com link externo teria DOIS caminhos de compra, e o
-- comprador escolheria justamente o que não gera pedido nosso — pagando fora,
-- reclamando aqui, sem nada no banco ligando as duas coisas.
--
-- ## O que isto NÃO é
--
-- Não é programa de afiliados. Aqui o afiliado somos **nós**: encaminhamos
-- para o parceiro e recebemos por isso. O caminho inverso — alguém traz
-- comprador para a nossa loja e recebe comissão — é outra tabela, com prazo e
-- identificação de visitante, porque lá a pergunta é «quem trouxe este
-- comprador» e ela não tem resposta sem identificar a visita. Juntar as duas
-- numa tabela só produziria uma que não responde nenhuma das duas.
--
-- ## Rollback
--
--   ALTER TABLE public.admin_products DROP CONSTRAINT IF EXISTS admin_products_indicacao_tem_link;
--   ALTER TABLE public.admin_products DROP COLUMN IF EXISTS modo_de_venda;
--   ALTER TABLE public.admin_products DROP COLUMN IF EXISTS link_externo;
--   ALTER TABLE public.admin_products DROP COLUMN IF EXISTS parceiro;
--   DROP TABLE IF EXISTS public.cliques_de_indicacao;
--
-- Nenhum produto existente muda de comportamento: todos nascem 'proprio', que
-- é o que já eram.
--
-- ## Como testar
--   supabase/tests/20260816_indicacao_test.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1) admin_products: como este produto é vendido
-- ------------------------------------------------------------
ALTER TABLE public.admin_products
  ADD COLUMN IF NOT EXISTS modo_de_venda text NOT NULL DEFAULT 'proprio',
  ADD COLUMN IF NOT EXISTS link_externo  text,
  -- Quem vende do outro lado. TEXTO, e não FK para user_profiles, porque no
  -- começo o parceiro não tem conta aqui — exigir cadastro dele para cadastrar
  -- o produto inverteria a ordem do combinado comercial.
  ADD COLUMN IF NOT EXISTS parceiro      text;

COMMENT ON COLUMN public.admin_products.modo_de_venda IS
  'proprio = nós vendemos e entregamos; indicacao = o parceiro vende na loja dele.';
COMMENT ON COLUMN public.admin_products.link_externo IS
  'Destino da indicação. Obrigatório em indicacao, proibido em proprio.';

ALTER TABLE public.admin_products
  DROP CONSTRAINT IF EXISTS admin_products_modo_de_venda_check;
ALTER TABLE public.admin_products
  ADD CONSTRAINT admin_products_modo_de_venda_check
  CHECK (modo_de_venda IN ('proprio', 'indicacao'));

-- A bicondicional. Ver o cabeçalho: os dois lados erram.
ALTER TABLE public.admin_products
  DROP CONSTRAINT IF EXISTS admin_products_indicacao_tem_link;
ALTER TABLE public.admin_products
  ADD CONSTRAINT admin_products_indicacao_tem_link
  CHECK ((modo_de_venda = 'indicacao') = (link_externo IS NOT NULL));

-- ------------------------------------------------------------
-- 2) O link é conferido pelo BANCO, não só por quem digita
-- ------------------------------------------------------------
-- Cadastro é digitado, e digitação erra. Um `http://` vira downgrade de
-- transporte no clique; um `javascript:` guardado aqui viraria execução na
-- página que renderizar o card sem escapar; e `https://user@evil.tld` é a
-- forma clássica de fazer o olho ler um domínio e o navegador ir a outro.
--
-- A função existe para que a Edge Function e o banco recusem pela MESMA regra.
-- Duas cópias da regra divergem, e a que diverge para o lado permissivo é a
-- que fica.
CREATE OR REPLACE FUNCTION public.link_de_indicacao_seguro(link text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT link IS NOT NULL
     AND link ~* '^https://'
     -- Sem credencial embutida: tudo entre o esquema e a primeira barra não
     -- pode conter '@'.
     AND split_part(substring(link from 9), '/', 1) NOT LIKE '%@%'
     -- Sem espaço nem controle, que quebrariam o cabeçalho Location.
     AND link !~ '[[:space:]]';
$$;

COMMENT ON FUNCTION public.link_de_indicacao_seguro(text) IS
  'A mesma regra que a Edge Function aplica antes de redirecionar.';

ALTER TABLE public.admin_products
  DROP CONSTRAINT IF EXISTS admin_products_link_externo_seguro;
ALTER TABLE public.admin_products
  ADD CONSTRAINT admin_products_link_externo_seguro
  CHECK (link_externo IS NULL OR public.link_de_indicacao_seguro(link_externo));

-- ------------------------------------------------------------
-- 3) cliques_de_indicacao — o que torna a comissão cobrável
-- ------------------------------------------------------------
-- Sem medida do que encaminhamos, «quanto você nos deve» vira negociação sobre
-- memória.
--
-- **Não guarda quem clicou.** Nem IP, nem hash de visitante, nem sessão. Para
-- cobrar o parceiro basta VOLUME, e guardar identidade seria coletar dado
-- pessoal para responder uma pergunta que ninguém faz — exatamente o que a
-- LGPD chama de excesso, e o que o nosso próprio consentimento não cobre.
CREATE TABLE IF NOT EXISTS public.cliques_de_indicacao (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id   uuid NOT NULL REFERENCES public.admin_products(id) ON DELETE CASCADE,
  ocorrido_em  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cliques_de_indicacao IS
  'Volume encaminhado ao parceiro. Não identifica o visitante — de propósito.';

CREATE INDEX IF NOT EXISTS cliques_de_indicacao_produto_idx
  ON public.cliques_de_indicacao (produto_id, ocorrido_em DESC);

-- RLS ligada. Quem escreve é a Edge Function do redirecionamento, com
-- service_role, que não passa por RLS. Quem lê é o admin com a capacidade
-- abaixo — e ninguém mais: o volume encaminhado é informação comercial, e é
-- com ele que se confere a fatura de comissão do parceiro.
ALTER TABLE public.cliques_de_indicacao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.cliques_de_indicacao FROM anon, authenticated;

DROP POLICY IF EXISTS "cliques: admin com indicacao:ler lê" ON public.cliques_de_indicacao;
CREATE POLICY "cliques: admin com indicacao:ler lê" ON public.cliques_de_indicacao
  FOR SELECT TO authenticated
  USING (public.tem_capacidade('indicacao:ler'));

GRANT SELECT ON public.cliques_de_indicacao TO authenticated;

-- ------------------------------------------------------------
-- 4) A capacidade nova
-- ------------------------------------------------------------
-- Entra na lista conhecida, senão o CHECK de `user_profiles` recusaria
-- concedê-la e a policy acima ficaria inalcançável: `tem_capacidade` devolveria
-- `false` para todo mundo, para sempre, sem erro nenhum. É o modo de falha
-- mais chato de diagnosticar — nada quebra, a tela só fica vazia.
CREATE OR REPLACE FUNCTION public.capacidades_conhecidas()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'catalogo:escrever',      -- ervas, produtos, blends, fichas, chazerias
    'pedidos:ler',
    'pedidos:escrever',       -- mover no fluxo, cancelar
    'devolucoes:escrever',
    'avaliacoes:moderar',
    'usuarios:ler',
    'usuarios:excluir',       -- apaga conta: a mais destrutiva da lista
    'privilegio:conceder',    -- torna outro alguém admin
    'configuracoes:escrever', -- site_settings, inclusive ligar pagamentos
    'auditoria:ler',
    'newsletter:escrever',
    'indicacao:ler'           -- volume encaminhado ao parceiro (comissão)
  ]::text[];
$$;

-- Quem já é admin recebe a capacidade nova, na mesma lógica da compatibilidade
-- de 20260815220000: aquela migration deu a cada admin o conjunto conhecido
-- NAQUELE momento, e uma capacidade acrescentada depois não chega sozinha.
-- Sem isto, o painel nasce com uma aba que ninguém abre.
--
-- É seguro porque `indicacao:ler` é somente leitura e não alcança dado pessoal
-- — a tabela não guarda nenhum. Capacidade que ESCREVE não deve ser concedida
-- assim; ali o silêncio é a resposta certa.
UPDATE public.user_profiles
   SET admin_capabilities = array_append(admin_capabilities, 'indicacao:ler')
 WHERE is_admin = TRUE
   AND NOT ('indicacao:ler' = ANY(admin_capabilities));
