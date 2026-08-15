-- ============================================================
-- RBAC por capacidade no painel admin
-- ============================================================
-- Hoje `is_admin` é um booleano: quem entra no painel pode tudo.
-- Tudo inclui `admin-delete-user`, que apaga a conta de qualquer
-- pessoa, e virar o privilégio de outro usuário.
--
-- Isso não é hipótese distante: o painel é usado por mais de uma
-- pessoa, e quem só precisa despachar pedido recebe hoje, junto,
-- o poder de apagar a base de usuários. O modo de falha não é
-- alguém mal-intencionado — é o clique errado numa tela que nunca
-- deveria ter sido oferecida.
--
-- ── A decisão ───────────────────────────────────────────────
-- `is_admin` continua sendo "pode abrir o painel". O que se pode
-- FAZER lá dentro passa a sair de `admin_capabilities`.
--
-- São dois eixos, e juntá-los num só foi o erro original: "entra
-- no painel" e "pode apagar usuário" não são graus da mesma
-- coisa. É a mesma separação que o FengShui faz entre papel e
-- plano, e que o Solarisis já tem em lib/rbac.ts.
--
-- ── Compatibilidade ─────────────────────────────────────────
-- Todo admin existente recebe TODAS as capacidades na migration.
-- Ninguém perde acesso ao aplicar; a partir daqui, admin novo
-- nasce com o conjunto que lhe for dado.
--
-- Reduzir o que cada pessoa tem é decisão de operação, feita
-- depois pelo painel — não por esta migration, que não sabe quem
-- é quem.
--
-- ── Como testar ─────────────────────────────────────────────
--   supabase/tests/20260815_rbac_capacidade_test.sql
--
-- ── ROLLBACK (documentado — NÃO aplicar salvo emergência) ────
--   -- 1. Voltar as policies ao predicado antigo:
--   --    troque `public.tem_capacidade('...')` por `public.is_admin()`
--   --    nas policies listadas no fim deste arquivo.
--   -- 2. DROP FUNCTION public.tem_capacidade(text);
--   -- 3. ALTER TABLE public.user_profiles
--   --      DROP COLUMN IF EXISTS admin_capabilities;
--   Atenção: o rollback devolve o poder total a todo admin.
-- ============================================================

-- ------------------------------------------------------------
-- 1) A coluna
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS admin_capabilities text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.user_profiles.admin_capabilities IS
  'O que este admin pode fazer no painel. `is_admin` diz se ele ENTRA; '
  'esta coluna diz o que ele FAZ. Coluna de privilégio: só service_role '
  'escreve (trigger trg_protect_profile_privileges).';

-- A lista fechada mora numa função para não ficar copiada entre o CHECK,
-- as policies e o painel. Acrescentar capacidade é editar aqui.
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
    'newsletter:escrever'
  ]::text[];
$$;

-- Recusa capacidade inventada. Sem isto, um erro de digitação vira uma
-- capacidade que ninguém tem e uma tela que ninguém abre — e o sintoma
-- aparece longe da causa.
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_admin_capabilities_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_admin_capabilities_check
  CHECK (admin_capabilities <@ public.capacidades_conhecidas());

-- ------------------------------------------------------------
-- 2) Compatibilidade: admin de hoje mantém tudo
-- ------------------------------------------------------------
UPDATE public.user_profiles
   SET admin_capabilities = public.capacidades_conhecidas()
 WHERE is_admin = TRUE
   AND admin_capabilities = '{}';

-- ------------------------------------------------------------
-- 3) A coluna é de privilégio — mesma proteção de `is_admin`
-- ------------------------------------------------------------
-- Sem isto, a coluna nova seria o caminho aberto que `is_admin` deixou
-- de ser: o próprio usuário se concederia `usuarios:excluir` por um
-- PATCH no PostgREST. É a falha C-1 de 20260716120000, reencenada numa
-- coluna que ninguém lembrou de proteger.
CREATE OR REPLACE FUNCTION public.protect_user_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'is_admin só pode ser alterado via service_role'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.admin_capabilities IS DISTINCT FROM OLD.admin_capabilities
     AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'admin_capabilities só pode ser alterado via service_role'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.user_profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileges();

-- O GRANT de UPDATE é por coluna (20260716120000) e não inclui as de
-- privilégio. O trigger é defesa em profundidade, não a única.

-- ------------------------------------------------------------
-- 4) O predicado das policies
-- ------------------------------------------------------------
-- SECURITY DEFINER pelo mesmo motivo de `is_admin()`: escapar do RLS de
-- user_profiles e evitar a recursão 42P17 corrigida em 20260727030000.
--
-- Exige `is_admin` TAMBÉM, e não só a capacidade: revogar o acesso ao
-- painel de alguém deve bastar para tirar tudo, sem precisar caçar cada
-- capacidade que essa pessoa acumulou.
CREATE OR REPLACE FUNCTION public.tem_capacidade(capacidade text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT up.is_admin AND capacidade = ANY(up.admin_capabilities)
       FROM public.user_profiles up
      WHERE up.id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.tem_capacidade(text) IS
  'true se o chamador é admin E tem a capacidade. Exige as duas coisas: '
  'tirar is_admin deve bastar para tirar todo o acesso.';

REVOKE ALL ON FUNCTION public.tem_capacidade(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tem_capacidade(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.capacidades_conhecidas() TO authenticated;

-- ------------------------------------------------------------
-- 5) As policies que passam a exigir capacidade
-- ------------------------------------------------------------
-- Só as de ESCRITA e as de leitura de dado sensível. Leitura de catálogo
-- segue como está — ela é pública de qualquer forma.

-- ── Trilha de auditoria: ler é privilégio ───────────────────
DROP POLICY IF EXISTS admin_audit_log_select ON public.admin_audit_log;
CREATE POLICY admin_audit_log_select ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.tem_capacidade('auditoria:ler'));

-- ── Configurações do site (inclusive ligar/desligar pagamento) ──
DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL TO authenticated
  USING (public.tem_capacidade('configuracoes:escrever'))
  WITH CHECK (public.tem_capacidade('configuracoes:escrever'));

-- ── Devoluções ──────────────────────────────────────────────
DROP POLICY IF EXISTS order_returns_admin_all ON public.order_returns;
CREATE POLICY order_returns_admin_all ON public.order_returns
  FOR ALL TO authenticated
  USING (public.tem_capacidade('devolucoes:escrever'))
  WITH CHECK (public.tem_capacidade('devolucoes:escrever'));

-- ── Moderação de avaliações ─────────────────────────────────
DROP POLICY IF EXISTS product_reviews_admin_all ON public.product_reviews;
CREATE POLICY product_reviews_admin_all ON public.product_reviews
  FOR ALL TO authenticated
  USING (public.tem_capacidade('avaliacoes:moderar'))
  WITH CHECK (public.tem_capacidade('avaliacoes:moderar'));

-- ── Catálogo ────────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_herbs', 'admin_products', 'admin_blends',
    'admin_herb_fichas', 'admin_suppliers', 'admin_news', 'chazerias'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_admin_write', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated '
        'USING (public.tem_capacidade(%L)) WITH CHECK (public.tem_capacidade(%L))',
        t || '_admin_write', t, 'catalogo:escrever', 'catalogo:escrever'
      );
    END IF;
  END LOOP;
END $$;
