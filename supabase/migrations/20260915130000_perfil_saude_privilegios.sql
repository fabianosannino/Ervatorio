-- ============================================================
-- perfil_saude: os privilégios de tabela que a migration anterior não tirou
-- ============================================================
-- Conferido em produção em 14/09, depois de aplicar 20260915120000: o role
-- `authenticated` tinha TODOS os privilégios em perfil_saude — SELECT, INSERT,
-- UPDATE (a tabela inteira), DELETE, TRUNCATE, REFERENCES, TRIGGER.
--
-- A causa é a mesma armadilha já anotada no CLAUDE.md para `orders`: o
-- projeto Supabase tem ALTER DEFAULT PRIVILEGES que concede ALL a
-- `authenticated` (e `anon`) em toda tabela nova do schema public. A
-- migration anterior fez `REVOKE ALL ... FROM anon` (funcionou) e depois
-- `GRANT SELECT, INSERT, DELETE` + `GRANT UPDATE (colunas)` para
-- `authenticated` — mas GRANT soma; não subtrai o ALL que já estava lá. O
-- UPDATE por coluna virou letra morta e TRUNCATE/TRIGGER/REFERENCES ficaram.
--
-- O que isso expõe: pouco, hoje. RLS continua valendo para SELECT/INSERT/
-- UPDATE/DELETE, e o PostgREST não expõe TRUNCATE nem TRIGGER. Mas TRUNCATE
-- ignora RLS por definição, e um privilégio que "não faz mal hoje" é
-- exatamente o que alguém explora amanhã por outro caminho. A regra é ter só
-- o necessário, nominalmente.
--
-- O teste supabase/tests/20260915_perfil_saude_test.sql não pegou porque o
-- Postgres descartável não tem os DEFAULT PRIVILEGES do Supabase. O bloco 11
-- (novo) simula-os antes de aplicar as migrations e confere o resultado.
--
-- ── ROLLBACK (documentado — não há motivo para aplicar) ──────
--   GRANT ALL ON public.perfil_saude TO authenticated;
-- ============================================================
REVOKE ALL ON public.perfil_saude FROM PUBLIC;
REVOKE ALL ON public.perfil_saude FROM anon;
REVOKE ALL ON public.perfil_saude FROM authenticated;

GRANT SELECT, INSERT, DELETE ON public.perfil_saude TO authenticated;
GRANT UPDATE (condicoes, consentimento_em, consentimento_versao, atualizado_em)
  ON public.perfil_saude TO authenticated;

-- `service_role` e `postgres` mantêm o que o Supabase lhes dá (a Edge Function
-- user-data-rights lê pelo service_role para o export).
