// ============================================================
// Edge Function: newsletter-subscribe
// ============================================================
// Substitui o INSERT direto no PostgREST que /pausa.html fazia.
// Três problemas motivaram a troca, todos documentados como
// "limitações conhecidas" na migration 20260726120000:
//
//   1) ORÁCULO DE ENUMERAÇÃO. Com INSERT direto e UNIQUE(email),
//      o erro 23505 respondia "este e-mail já está inscrito" para
//      quem perguntasse. Um bit por tentativa, sem limite de
//      tentativas. Aqui o servidor devolve SEMPRE a mesma resposta
//      para e-mail válido, inscrito ou não.
//
//   2) SEM RATE LIMIT. O INSERT ia direto ao PostgREST, que não
//      passa por rate_limit_hit(). Agora passa.
//
//   3) `WITH CHECK (true)` DEIXAVA O CLIENTE ESCREVER QUALQUER
//      COLUNA. Um inscrito anônimo podia forjar `consent_at` — que
//      é justamente a evidência de consentimento que a LGPD pede —
//      ou `active`, `created_at`, `id`. Aqui o cliente manda só
//      e-mail, origem e idioma; o resto é o servidor que define.
//
// A policy de INSERT público é removida na migration que acompanha
// esta função. Depois dela, só service_role escreve na tabela, e
// service_role só existe dentro daqui.
//
// ── O que esta função NÃO resolve ──
// Continua sem double opt-in: qualquer um inscreve o e-mail de
// outra pessoa, e consent_at marca o envio do formulário, não a
// confirmação do titular. E sem link de descadastro — a coluna
// `active` existe, mas o inscrito é anônimo e não tem como virá-la
// sozinho. Exclusão a pedido (LGPD art. 18) segue manual, pelo
// runbook. Isso é escopo deixado de fora conscientemente, não
// esquecimento: os dois exigem envio de e-mail transacional e uma
// página pública de confirmação.
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

// Espelha newsletter_source_check / newsletter_locale_check da
// migration. Validar aqui em vez de deixar o CHECK estourar troca um
// erro 23514 cru por uma recusa limpa — e evita que uma origem
// inválida vire 500 na cara do visitante.
// As cinco ultimas vieram com o handoff de UX (migration 20260914120000):
// captura contextual na home (loja), no Clube, na ficha, na receita e no
// resultado de "Encontre seu chá".
const SOURCES = ['pausa', 'rodape', 'blog', 'checkout', 'admin', 'loja', 'clube', 'ficha', 'receita', 'encontrar'];
const LOCALES = ['pt', 'en', 'es'];

// Mesmo formato que o cliente usa em pausa.html, com teto de
// tamanho: 254 é o limite prático de endereço de e-mail (RFC 5321).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // 5 inscrições por minuto por IP. Folgado para uso humano (uma
  // pessoa se inscreve uma vez), apertado para varredura: sondar uma
  // lista de e-mails vira trabalho de horas em vez de segundos.
  // Fail-open por design do helper — rate limit é anti-abuso, não
  // controle de acesso, e a resposta indistinguível abaixo é que
  // carrega a proteção contra enumeração.
  if (!(await rateLimitAllow(`newsletter:${clientIp(req)}`, { windowSeconds: 60, max: 5 }))) {
    return tooManyRequests();
  }

  let body: { email?: unknown; source?: unknown; locale?: unknown };
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  const email = String(body.email ?? '').trim().toLowerCase();
  if (email.length < 6 || email.length > 254 || !EMAIL_RE.test(email)) {
    // Recusar formato inválido não é oráculo: não depende do que
    // existe no banco, só do que veio na requisição.
    return jsonResponse({ error: 'Informe um e-mail válido.' }, 400);
  }

  const source = SOURCES.includes(String(body.source)) ? String(body.source) : 'pausa';
  const locale = LOCALES.includes(String(body.locale)) ? String(body.locale) : 'pt';

  const db = adminClient();

  // ignoreDuplicates: e-mail já inscrito não gera erro e NÃO
  // sobrescreve a linha existente. Isso importa além do oráculo: se
  // alguém já se descadastrou (active = false), reenviar o formulário
  // não pode ressuscitar a inscrição pelas costas do titular.
  //
  // consent_at, active, created_at e id ficam de fora do payload de
  // propósito — vêm dos DEFAULTs da tabela, onde o cliente não
  // alcança.
  const { error } = await db
    .from('newsletter_subscribers')
    .upsert({ email, source, locale, consent: true }, {
      onConflict: 'email',
      ignoreDuplicates: true,
    });

  if (error) {
    // Erro real de banco. Não vaza detalhe ao cliente, mas registra
    // para diagnóstico.
    console.error('[newsletter-subscribe] falha ao gravar', {
      code: error.code, message: error.message,
    });
    return jsonResponse({ error: 'Não foi possível salvar agora. Tente novamente em instantes.' }, 500);
  }

  // Resposta idêntica para inscrição nova e para e-mail já existente.
  // É esta indistinguibilidade que fecha o oráculo — não o rate limit.
  return jsonResponse({ ok: true });
});
