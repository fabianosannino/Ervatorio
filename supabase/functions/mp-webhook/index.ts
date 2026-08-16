// ============================================================
// Edge Function: mp-webhook
// ============================================================
// Recebe notificações do Mercado Pago e atualiza o status do
// pedido no banco. Princípios:
//
//   1) Valida assinatura HMAC antes de qualquer ação (anti-spoofing).
//      O body é capturado BRUTO (await req.text()) antes de qualquer
//      parse, para que a verificação possa testar a hipótese de
//      assinatura sobre os bytes exatos (WEBHOOK_SIGNATURE_DEBT.md).
//      Modo estrito (padrão em produção, ou MP_WEBHOOK_STRICT=true):
//      assinatura inválida → 401 e nada é processado.
//   2) NUNCA confia no payload do webhook como "verdade" — sempre
//      busca o pagamento na API do MP usando o id recebido.
//   3) Salva o payload bruto em orders.payment_payload para auditoria.
//   4) Idempotente: receber a mesma notificação duas vezes não
//      duplica nada.
//
// Diagnóstico de assinatura: via logs estruturados da função
// (console). A antiga tabela de debug mp_webhook_log foi removida
// (Onda 1.4) — ela gravava headers/body de requisições NÃO
// autenticadas no banco (vetor de write-amplification).
//
// Tipos de notificação suportados:
//   • payment        (mais comum, dispara em cada mudança de status)
//   • merchant_order (resumo agregado de uma preferência)
// ============================================================
import { dataDoGateway, estadoDoPedido, fatoAvanca } from '../_shared/estado-do-pedido.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import {
  fetchPayment,
  isStrictSignatureMode,
  mapPaymentStatus,
  verifyWebhookSignature,
} from '../_shared/mercadopago.ts';
import { sendOrderPaidEmail } from '../_shared/email.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // MP às vezes faz GET de health check; responder 200 evita retries.
  if (req.method === 'GET') return jsonResponse({ ok: true });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Anti-abuso volumétrico: endpoint é público (verify_jwt=false).
  // Limite folgado para não derrubar rajadas legítimas de retry do MP.
  if (!(await rateLimitAllow(`mp-webhook:${clientIp(req)}`, { windowSeconds: 60, max: 120 }))) {
    return tooManyRequests();
  }

  const url = new URL(req.url);
  const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');

  // Body BRUTO primeiro (bytes exatos para o HMAC), parse depois.
  let rawBody = '';
  try { rawBody = await req.text(); } catch { /* body opcional */ }

  let bodyJson: Record<string, unknown> = {};
  if (rawBody) {
    try { bodyJson = JSON.parse(rawBody); } catch { /* body não-JSON */ }
  }

  const type = (bodyJson.type as string) || queryType;
  const bodyDataId = ((bodyJson.data as { id?: string } | undefined)?.id);
  const dataId = bodyDataId || queryDataId;
  const dataIdForSignature = queryDataId || bodyDataId;

  console.log('[mp-webhook] recebido', {
    method: req.method, url: url.pathname + url.search,
    queryType, queryDataId, bodyType: bodyJson.type, bodyDataId,
    rawBodyLen: rawBody.length,
  });

  if (!dataId) return jsonResponse({ error: 'data.id ausente' }, 400);

  // Ignora tipos que não processamos (merchant_order usa IPN legado sem
  // assinatura). Retorna 200 para o MP não retentar.
  if (type !== 'payment') {
    console.log('[mp-webhook] type ignorado', { type, dataId });
    return jsonResponse({ ok: true, ignored: true, type });
  }

  // ── Validação de assinatura ─────────────────────────────────
  const sigResult = await verifyWebhookSignature(req, String(dataIdForSignature), rawBody);

  if (!sigResult.valid) {
    if (isStrictSignatureMode()) {
      console.warn('[mp-webhook] assinatura invalida em modo estrito → 401', {
        secret_configured: sigResult.secret_configured,
        request_id: sigResult.request_id,
      });
      return jsonResponse({ error: 'Assinatura inválida' }, 401);
    }
    // Modo relaxado (test): prossegue, protegido pelas camadas 2–4
    // (fetchPayment autenticado, external_reference, sanity de valor,
    // idempotência). Ver WEBHOOK_SIGNATURE_DEBT.md.
    console.warn('[mp-webhook] assinatura invalida em modo relaxado — prosseguindo');
  }

  let payment;
  try {
    payment = await fetchPayment(String(dataId));
  } catch (e) {
    const msg = (e as Error).message || '';
    if (msg.includes('(404)') || msg.toLowerCase().includes('not found')) {
      console.log('[mp-webhook] payment nao encontrado, ignorando', { dataId, msg });
      return jsonResponse({ ok: true, ignored: true, reason: 'payment_not_found', dataId });
    }
    console.error('[mp-webhook] falha ao buscar pagamento', e);
    return jsonResponse({ error: msg }, 500);
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    console.warn('[mp-webhook] payment sem external_reference', { payment_id: dataId });
    return jsonResponse({ ok: true, warning: 'sem external_reference' });
  }

  const db = adminClient();

  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, status, total_cents, pedido_eventos(estado)')
    .eq('id', orderId)
    .maybeSingle();
  if (oErr) return jsonResponse({ error: oErr.message }, 500);
  if (!order) return jsonResponse({ error: 'order não encontrado' }, 404);

  const newStatus = mapPaymentStatus(payment.status);

  // O estado vem dos FATOS, não da coluna. A diferença aparece na reentrega:
  // antes, a comparação era `order.status === newStatus`, e um `paid` atrasado
  // que chegasse depois de um `refunded` passava por ela — os dois valores são
  // diferentes — e sobrescrevia o reembolso.
  //
  // Agora o fato é sempre gravado (a precedência o ignora se for menor) e o
  // que se decide aqui é só o que NÃO é idempotente: e-mail e estoque.
  const eventos = Array.isArray(order.pedido_eventos) ? order.pedido_eventos : [];
  const estadoAtual = estadoDoPedido(eventos);
  const avanca = fatoAvanca(estadoAtual, newStatus);

  const expectedReais = order.total_cents / 100;
  if (Math.abs(payment.transaction_amount - expectedReais) > 0.01 && newStatus === 'paid') {
    console.error(`[mp-webhook] VALOR DIVERGENTE — esperado ${expectedReais} recebido ${payment.transaction_amount}`);
    await db
      .from('orders')
      .update({
        admin_notes: `[ALERTA] valor divergente: esperado R$${expectedReais.toFixed(2)}, recebido R$${payment.transaction_amount.toFixed(2)}, payment_id=${payment.id}`,
        payment_payload: payment,
      })
      .eq('id', orderId);
    return jsonResponse({ ok: false, error: 'valor divergente' }, 400);
  }

  // `status` NÃO entra aqui: é projeção do fato registrado abaixo, e o
  // privilégio de coluna já recusaria a escrita.
  const update: Record<string, unknown> = {
    payment_provider: 'mercadopago',
    payment_external_id: String(payment.id),
    payment_method: payment.payment_type_id,
    payment_payload: payment,
  };

  const { error: uErr } = await db.from('orders').update(update).eq('id', orderId);
  if (uErr) return jsonResponse({ error: uErr.message }, 500);

  // O fato. `ocorrido_em` sai da data do GATEWAY quando ela existe: o
  // pagamento aconteceu lá, e a linha nasce aqui — às vezes minutos depois.
  const { error: fErr } = await db.from('pedido_eventos').insert({
    order_id: orderId,
    estado: newStatus,
    origem: 'webhook',
    referencia: String(payment.id),
    ocorrido_em: dataDoGateway(payment.date_approved ?? payment.date_created),
    motivo: `Mercado Pago: ${payment.status}`,
  });
  if (fErr) return jsonResponse({ error: fErr.message }, 500);

  if (newStatus === 'paid' && avanca) {
    sendPaidEmailFor(db, orderId).catch((e) => {
      console.error('[mp-webhook] email falhou (nao-fatal)', e);
    });
  }

  // O estoque foi reservado na criação do pedido (create-order chama
  // reserve_stock). Pagamento recusado não é venda, então as unidades
  // voltam para a vitrine.
  //
  // Só `failed`. mapPaymentStatus() devolve quatro valores — paid,
  // pending, failed e refunded — e `refunded` fica DE FORA de propósito:
  // um reembolso pode ser de pedido já enviado, e nesse caso a mercadoria
  // não está de volta na prateleira. Reposição após devolução é decisão
  // de quem recebe o produto, e passa pelo fluxo de create-return.
  //
  // A guarda `order.status === 'pending'` importa: só devolve estoque de
  // pedido que ainda estava segurando reserva. O noop acima já barra
  // notificação repetida do mesmo estado — comum no Mercado Pago — mas
  // sem esta condição um pedido que fosse de failed para failed por outro
  // caminho devolveria unidades duas vezes.
  if (newStatus === 'failed' && estadoAtual === 'pending') {
    const { error: relErr } = await db.rpc('release_stock', { p_order_id: orderId });
    if (relErr) {
      // Não derruba o webhook: o status do pedido já está correto, e o
      // estoque preso é problema de reconciliação, não de pagamento.
      console.error('[mp-webhook] release_stock falhou', {
        orderId, newStatus, error: relErr.message,
      });
    }
  }

  return jsonResponse({ ok: true, order_id: orderId, new_status: newStatus, payment_id: payment.id });
});

// ------------------------------------------------------------
// Email de confirmação após status=paid.
// Busca pedido completo + user email e dispara via Resend.
// ------------------------------------------------------------
async function sendPaidEmailFor(
  db: ReturnType<typeof adminClient>,
  orderId: string,
): Promise<void> {
  const { data: full, error } = await db
    .from('orders')
    .select('id, order_number, user_id, guest_email, total_cents, currency, payment_method, paid_at, shipping_address')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !full) {
    console.warn('[mp-webhook email] pedido nao encontrado', { orderId, error });
    return;
  }

  const { data: items } = await db
    .from('order_items')
    .select('product_name, product_unit, qty, unit_price_cents, line_total_cents')
    .eq('order_id', orderId);

  const addr = full.shipping_address as Record<string, string> | null;
  let toEmail: string | null = null;
  let customerName: string | null = addr?.name || null;

  if (full.user_id) {
    // Pedido de conta: email vem de auth.users via admin SDK.
    const { data: userRes, error: userErr } = await db.auth.admin.getUserById(full.user_id);
    if (userErr || !userRes?.user?.email) {
      console.warn('[mp-webhook email] user sem email', { userId: full.user_id, userErr });
      return;
    }
    toEmail = userRes.user.email;
    const { data: profile } = await db
      .from('user_profiles')
      .select('display_name')
      .eq('id', full.user_id)
      .maybeSingle();
    customerName = profile?.display_name || customerName;
  } else {
    // Pedido guest (Onda 6.3): email informado no checkout.
    toEmail = full.guest_email || null;
  }
  if (!toEmail) {
    console.warn('[mp-webhook email] pedido sem destinatario', { orderId });
    return;
  }

  await sendOrderPaidEmail({
    to: toEmail,
    order_number: full.order_number || full.id,
    customer_name: customerName,
    total_cents: full.total_cents,
    currency: full.currency || 'BRL',
    payment_method: full.payment_method,
    paid_at: full.paid_at,
    items: items || [],
    shipping_address: addr,
  });
}
