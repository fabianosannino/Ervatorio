// ============================================================
// Edge Function: newsletter-unsubscribe
// ============================================================
// O outro lado da `newsletter-subscribe`. Até agora sair da lista era
// pedido manual ao encarregado, com prazo de 15 dias — a Política de
// Privacidade (v1.2, seção 7) diz isso em público porque prometer um
// link que não existia seria pior. Este é o link.
//
// ── Por que POST, e não GET ──
// O link vai dentro de um e-mail. Cliente de e-mail e antivírus
// corporativo abrem links sozinhos para varrer: Outlook Safe Links,
// Gmail, Proofpoint. Se GET descadastrasse, metade da lista sairia sem
// nunca ter clicado, e ninguém entenderia por quê. Então o link do
// e-mail abre `/descadastro.html?t=<token>`, que é só HTML, e o
// descadastro acontece quando a pessoa aperta o botão. Um GET aqui é
// 405 de propósito — não é limitação, é a proteção.
//
// ── Por que o token não vira oráculo ──
// O token é UUID v4 (122 bits de entropia): não se adivinha. Ainda
// assim esta função **nunca devolve o e-mail** da linha — quem tem o
// token já recebeu o e-mail, e quem não tem não descobre um endereço
// sorteando UUID. Dizer "link inválido" para um token inexistente não
// abre nada e evita a mentira oposta: mandar "pronto, você saiu" para
// quem colou um link truncado e continua na lista.
//
// ── O que grava ──
// Só `descadastrado_em`. O `active` é projeção mantida por gatilho
// (migration 20260917120000) — escrever o booleano aqui seria a forma
// de perder a data, e a data é a prova de quando o titular saiu.
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // 10 por minuto por IP. Sair da lista é ação de uma vez; o que isto
  // corta é varredura de token. Fail-open, como o resto: a proteção
  // real contra adivinhação é a entropia do UUID.
  if (!(await rateLimitAllow(`newsletter-out:${clientIp(req)}`, { windowSeconds: 60, max: 10 }))) {
    return tooManyRequests();
  }

  let body: { token?: unknown };
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  const token = String(body.token ?? '').trim();
  if (!UUID_RE.test(token)) {
    return jsonResponse({ error: 'Link de descadastro inválido.' }, 400);
  }

  const db = adminClient();

  // Uma leitura antes de escrever, para separar três situações que o
  // UPDATE sozinho confunde: token que não existe, token de quem já
  // saiu, e token de quem está saindo agora. A pessoa merece saber em
  // qual delas está.
  const { data: linha, error: erroLeitura } = await db
    .from('newsletter_subscribers')
    .select('id, descadastrado_em')
    .eq('token_descadastro', token)
    .maybeSingle();

  if (erroLeitura) {
    console.error('[newsletter-unsubscribe] falha ao ler', {
      code: erroLeitura.code, message: erroLeitura.message,
    });
    return jsonResponse({ error: 'Não foi possível concluir agora. Tente novamente em instantes.' }, 500);
  }

  if (!linha) {
    return jsonResponse({ error: 'Link de descadastro inválido.' }, 404);
  }

  // Já tinha saído: idempotente, e sem reescrever a data original —
  // ela é a prova de quando o titular pediu, não de quando clicou de novo.
  if (linha.descadastrado_em) {
    return jsonResponse({ ok: true, ja_estava_fora: true });
  }

  const { error: erroEscrita } = await db
    .from('newsletter_subscribers')
    .update({ descadastrado_em: new Date().toISOString() })
    .eq('id', linha.id)
    .is('descadastrado_em', null);

  if (erroEscrita) {
    console.error('[newsletter-unsubscribe] falha ao gravar', {
      code: erroEscrita.code, message: erroEscrita.message,
    });
    return jsonResponse({ error: 'Não foi possível concluir agora. Tente novamente em instantes.' }, 500);
  }

  // Sem o e-mail na resposta, de propósito.
  console.log('[newsletter-unsubscribe] descadastro concluído', { id: linha.id });
  return jsonResponse({ ok: true, ja_estava_fora: false });
});
