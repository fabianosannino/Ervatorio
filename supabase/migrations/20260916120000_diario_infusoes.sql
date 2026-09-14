-- ============================================================
-- Diário de infusões: tabela própria, atrás de interruptor (handoff 14/09, PR 08b)
-- ============================================================
-- A landing promete um «Diário de Infusões» desde o começo e a tabela
-- `tasting_journal` existe em produção com zero linhas e nenhum código que
-- a escreva — a promessa e o esquema nunca se encontraram. Este PR entrega
-- o que o handoff pede: registro de erva + horário + sensação, na conta do
-- usuário, e nada mais.
--
-- O que a tabela É e o que NÃO é:
--
--   • `erva_id` é a chave que o app já usa em `user_favorites.tea_id` (o id
--     numérico de HERBS, como texto) ou o slug da ficha editorial. É texto
--     porque o catálogo de ervas mora em js/, não numa tabela — e o nome
--     vai junto (`erva_nome`) para o export ser legível sem o app.
--   • `sensacao` é lista FECHADA (`sensacoes_conhecidas`), como as condições
--     de saúde: chips, nunca texto livre. Um campo «notas» aberto viraria o
--     lugar onde o dado de saúde entra sem consentimento («tomei porque
--     estou grávida») — e o CLAUDE.md diz que texto livre de saúde não entra
--     em lugar nenhum. Sensação percebida de um chá não é condição de saúde.
--   • Sem dado de saúde, sem foto, sem localização. Se um dia houver notas
--     livres, é outra decisão, com a minimização pensada.
--
-- O interruptor `diario` decide se a tela existe E se o banco aceita
-- registro novo: a policy de INSERT/UPDATE confere `interruptor_ligado`.
-- Desligar não apaga nada — o dono continua lendo e apagando o que é dele,
-- e o export continua trazendo. É a régua do CLAUDE.md: o servidor é quem
-- recusa; a lista em js/admin.js só esconde o que não adianta clicar.
--
-- Privilégios: o projeto tem ALTER DEFAULT PRIVILEGES concedendo ALL a
-- anon/authenticated em tabela nova (ver 20260915130000). REVOKE ALL antes
-- dos GRANT, sempre. UPDATE só na coluna `sensacao`: horário e erva de um
-- registro errado se corrigem apagando e registrando de novo.
--
-- ── Como testar ─────────────────────────────────────────────
--   supabase/tests/20260916_diario_infusoes_test.sql
--
-- ── ROLLBACK (documentado) ──────────────────────────────────
--   DROP TABLE IF EXISTS public.diario_infusoes;
--   DROP FUNCTION IF EXISTS public.sensacoes_conhecidas();
--   DELETE FROM public.interruptores WHERE chave = 'diario';
--   (e devolver `interruptores_conhecidos()` à lista de 20260815230000)
--   Apagar a tabela apaga registros de usuário: só com backup verificado.
-- ============================================================

-- ------------------------------------------------------------
-- 1) O interruptor `diario` — nasce DESLIGADO
-- ------------------------------------------------------------
-- A lista é decisão de código (20260815230000). Ligar é decisão comercial,
-- pelo painel, por quem tem `configuracoes:escrever`.
CREATE OR REPLACE FUNCTION public.interruptores_conhecidos()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'pagamentos',   -- checkout aceita pedido e cria preferencia no Mercado Pago
    'assinatura',   -- acesso exclusivo por assinatura (2o momento — nasce off)
    'indicacao',    -- vitrine de produto de terceiro por link de afiliado
    'newsletter',   -- captacao de e-mail no rodape e no modal
    'diario'        -- diário de infusões: tela no menu e INSERT em diario_infusoes
  ]::text[];
$$;

INSERT INTO public.interruptores (chave, ligado) VALUES ('diario', FALSE)
ON CONFLICT (chave) DO NOTHING;

-- ------------------------------------------------------------
-- 2) A lista fechada de sensações
-- ------------------------------------------------------------
-- Espelho em js/app.js (DIARIO_SENSACOES). Entrada nova entra nos dois.
CREATE OR REPLACE FUNCTION public.sensacoes_conhecidas()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'relaxei',
    'dormi_bem',
    'energia',
    'foco',
    'digestao',
    'sem_efeito',
    'nao_gostei'
  ]::text[];
$$;

-- ------------------------------------------------------------
-- 3) A tabela
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diario_infusoes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  erva_id    text NOT NULL CHECK (erva_id ~ '^[a-z0-9_-]{1,64}$'),
  erva_nome  text NOT NULL CHECK (char_length(erva_nome) BETWEEN 1 AND 80),
  tomado_em  timestamptz NOT NULL DEFAULT now(),
  sensacao   text CHECK (sensacao IS NULL OR sensacao = ANY (public.sensacoes_conhecidas())),
  criado_em  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.diario_infusoes IS
  'Diário de infusões: erva + horário + sensação (lista fechada). Sem dado de saúde, sem texto livre. RLS do dono; INSERT/UPDATE só com o interruptor diario ligado.';

CREATE INDEX IF NOT EXISTS diario_infusoes_user_tomado_idx
  ON public.diario_infusoes (user_id, tomado_em DESC);

-- ------------------------------------------------------------
-- 4) RLS — só o dono; registro novo só com o interruptor ligado
-- ------------------------------------------------------------
ALTER TABLE public.diario_infusoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS diario_dono_le ON public.diario_infusoes;
CREATE POLICY diario_dono_le ON public.diario_infusoes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Ler e apagar não dependem do interruptor: desligar a funcionalidade não
-- pode sequestrar o que o usuário já registrou.
DROP POLICY IF EXISTS diario_dono_insere ON public.diario_infusoes;
CREATE POLICY diario_dono_insere ON public.diario_infusoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.interruptor_ligado('diario'));

DROP POLICY IF EXISTS diario_dono_altera ON public.diario_infusoes;
CREATE POLICY diario_dono_altera ON public.diario_infusoes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.interruptor_ligado('diario'));

DROP POLICY IF EXISTS diario_dono_apaga ON public.diario_infusoes;
CREATE POLICY diario_dono_apaga ON public.diario_infusoes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5) Privilégios — REVOKE antes do GRANT (default privileges dão ALL)
-- ------------------------------------------------------------
REVOKE ALL ON public.diario_infusoes FROM PUBLIC;
REVOKE ALL ON public.diario_infusoes FROM anon;
REVOKE ALL ON public.diario_infusoes FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.diario_infusoes TO authenticated;
GRANT UPDATE (sensacao) ON public.diario_infusoes TO authenticated;
