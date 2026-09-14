-- ============================================================
-- Dado de saúde: tabela própria, consentimento próprio (handoff 14/09, PR 08)
-- ============================================================
-- Até aqui «Condições de saúde» e «Restrições e alergias» do Perfil moravam
-- no `localStorage` (`erb_perfil`) e, na sincronização, a primeira condição
-- ia parar em `user_preferences.caffeine_pref` — uma coluna de preferência de
-- cafeína guardando «Grávida» ou «Hipertensão». Sem consentimento próprio,
-- sem finalidade declarada, num campo com outro nome.
--
-- Condição de saúde é dado pessoal SENSÍVEL (LGPD art. 5º II). Tratar exige
-- consentimento específico e destacado para finalidade específica (art. 11 I).
-- Esta migration dá ao dado um lugar com essas propriedades:
--
--   • tabela SÓ para isso, uma linha por usuário;
--   • `consentimento_em` NOT NULL: não existe linha sem consentimento.
--     Retirar o consentimento é APAGAR a linha — não há «desligado».
--   • condições numa lista fechada (`condicoes_de_saude_conhecidas`): o
--     que a recomendação consegue usar para ESCONDER ervas contraindicadas.
--     Texto livre («tenho X») não entra: não filtra nada e é impossível de
--     minimizar.
--   • RLS do dono, sem acesso a `anon`, sem SECURITY DEFINER que leia por
--     fora. Admin nenhum lê isto pelo painel — e não precisa.
--   • cai junto com a conta (ON DELETE CASCADE) e sai no export de
--     `user-data-rights` (OWNED_TABLES).
--
-- A finalidade é UMA: filtrar recomendações. Nada aqui alimenta métrica,
-- marketing ou segmentação. Se um dia precisar de outra finalidade, é outro
-- consentimento — e outra migration que diga isso.
--
-- ── Limpeza ─────────────────────────────────────────────────
-- `user_preferences.caffeine_pref` recebe NULL onde o valor é uma das
-- condições antigas do Perfil. É destrutivo de propósito: o dado está lá sem
-- base legal, e mantê-lo é a violação. Não há rollback para isso — não se
-- «restaura» um dado sensível guardado indevidamente. Valores que sejam
-- preferência de cafeína de verdade não estão na lista e ficam.
--
-- ── Como testar ─────────────────────────────────────────────
--   supabase/tests/20260915_perfil_saude_test.sql
--
-- ── ROLLBACK (documentado — NÃO aplicar salvo emergência) ────
--   DROP TRIGGER IF EXISTS trg_perfil_saude_touch ON public.perfil_saude;
--   DROP FUNCTION IF EXISTS public.perfil_saude_touch();
--   DROP TABLE IF EXISTS public.perfil_saude;
--   DROP FUNCTION IF EXISTS public.condicoes_de_saude_conhecidas();
--   (a limpeza de caffeine_pref não se desfaz — ver acima)
-- ============================================================

-- ------------------------------------------------------------
-- 1) A lista fechada
-- ------------------------------------------------------------
-- Cada entrada corresponde a valores de `avoid` das fichas (js/app.js HERBS)
-- que a recomendação usa como barreira. Acrescentar uma aqui sem mapear no
-- cliente cria um consentimento para um filtro que não existe.
CREATE OR REPLACE FUNCTION public.condicoes_de_saude_conhecidas()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT ARRAY[
    'gestante',       -- avoid: gestantes, gestantes (doses altas)
    'amamentando',    -- avoid: amamentação, lactantes
    'hipertensao',    -- avoid: hipertensos, hipertensos sensíveis
    'anticoagulante', -- avoid: anticoagulantes
    'crianca',        -- avoid: crianças (é para criança)
    'diabetes',       -- sem avoid direto; aviso de açúcar/glicemia
    'asteraceas'      -- avoid: alergia a asteráceas
  ]::text[];
$$;

-- ------------------------------------------------------------
-- 2) A tabela
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfil_saude (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condicoes            TEXT[] NOT NULL DEFAULT '{}',
  consentimento_em     TIMESTAMPTZ NOT NULL,
  consentimento_versao TEXT NOT NULL DEFAULT '2026-09-15',
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.perfil_saude IS
  'Dado sensível (LGPD art. 5º II). Uma finalidade: filtrar recomendacoes. '
  'Nao existe linha sem consentimento; retirar consentimento = DELETE.';
COMMENT ON COLUMN public.perfil_saude.consentimento_versao IS
  'Data do texto de consentimento aceito (js/i18n.js perfil.consent). Mudou o texto, muda a versao.';

ALTER TABLE public.perfil_saude
  DROP CONSTRAINT IF EXISTS perfil_saude_condicoes_check;
ALTER TABLE public.perfil_saude
  ADD CONSTRAINT perfil_saude_condicoes_check
  CHECK (condicoes <@ public.condicoes_de_saude_conhecidas());

-- ------------------------------------------------------------
-- 3) atualizado_em
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.perfil_saude_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.atualizado_em := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfil_saude_touch ON public.perfil_saude;
CREATE TRIGGER trg_perfil_saude_touch
  BEFORE UPDATE ON public.perfil_saude
  FOR EACH ROW EXECUTE FUNCTION public.perfil_saude_touch();

-- ------------------------------------------------------------
-- 4) RLS — só o dono, só autenticado
-- ------------------------------------------------------------
ALTER TABLE public.perfil_saude ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS perfil_saude_dono_le ON public.perfil_saude;
CREATE POLICY perfil_saude_dono_le ON public.perfil_saude
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS perfil_saude_dono_insere ON public.perfil_saude;
CREATE POLICY perfil_saude_dono_insere ON public.perfil_saude
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS perfil_saude_dono_altera ON public.perfil_saude;
CREATE POLICY perfil_saude_dono_altera ON public.perfil_saude
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS perfil_saude_dono_apaga ON public.perfil_saude;
CREATE POLICY perfil_saude_dono_apaga ON public.perfil_saude
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- `anon` não tem nem SELECT: sem conta não há consentimento registrável, e um
-- visitante anônimo não tem linha para ler. Nenhuma policy para anon, e o
-- privilégio de tabela também não — RLS sem GRANT ainda dá «permission denied»
-- antes de avaliar policy nenhuma.
REVOKE ALL ON public.perfil_saude FROM PUBLIC;
REVOKE ALL ON public.perfil_saude FROM anon;
GRANT SELECT, INSERT, DELETE ON public.perfil_saude TO authenticated;
GRANT UPDATE (condicoes, consentimento_em, consentimento_versao, atualizado_em) ON public.perfil_saude TO authenticated;

-- ------------------------------------------------------------
-- 5) Limpeza do lugar errado (ver cabeçalho)
-- ------------------------------------------------------------
UPDATE public.user_preferences
   SET caffeine_pref = NULL
 WHERE caffeine_pref = ANY (ARRAY[
   'Hipertensão','Diabetes','Ansiedade','Insônia','Gastrite',
   'Grávida','Amamentando','Criança','Sem restrições'
 ]);
