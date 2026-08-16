// ============================================================
// Edge Function: create-payment-preference
// ============================================================
// Cria uma preferência de pagamento no Mercado Pago a partir de
// um order_id já existente (criado por create-order).
//
// Fluxo no frontend:
//   1) POST /create-order  → devolve order_id (status: 'pending')
//   2) POST /create-payment-preference { order_id }
//        → devolve init_point (URL do checkout MP)
//   3) window.location = init_point
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { exigirLigado } from '../_shared/interruptores.ts';
import { getUserFromRequest, adminClient } from '../_shared/auth.ts';
import { createPreference, getMode } from '../_shared/mercadopago.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Pagamentos desligados recusam AQUI, no servidor.
  // A tela lê `window.SITE_SETTINGS` e esconde o botão; isso é UX. Quem
  // virasse a variável no devtools chegava até esta função sem barreira.
  const desligado = await exigirLigado('pagamentos');
  if (desligado) return desligado;

  // Onda 6.3: usuário logado OU convidado (dono do pedido guest).
  const caller = await getUserFromRequest(req);

  let body: { order_id?: string; guest_email?: string };
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  // Anti-abuso: 10 preferências/min por usuário; convidado por IP.
  const rlKey = caller ? `create-pref:${caller.id}` : `create-pref:ip:${clientIp(req)}`;
  if (!(await rateLimitAllow(rlKey, { windowSeconds: 60, max: 10 }))) {
    return tooManyRequests();
  }

  const orderId = body.order_id;
  if (!orderId) return jsonResponse({ error: 'order_id obrigatório' }, 400);

  const db = adminClient();

  // Carrega o pedido + itens. Confirma propriedade.
  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, user_id, guest_email, status, total_cents, currency, shipping_address, order_number')
    .eq('id', orderId)
    .maybeSingle();
  if (oErr) return jsonResponse({ error: oErr.message }, 500);
  if (!order) return jsonResponse({ error: 'Pedido não encontrado' }, 404);
  if (order.user_id) {
    // Pedido de conta: só o dono autenticado inicia o pagamento.
    if (!caller || order.user_id !== caller.id) return jsonResponse({ error: 'Forbidden' }, 403);
  } else {
    // Pedido guest: exige o mesmo e-mail informado na criação
    // (o order_id UUID aleatório + e-mail funcionam como portador).
    const ge = String(body.guest_email || '').trim().toLowerCase();
    if (!ge || ge !== (order.guest_email || '').toLowerCase()) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }
  if (order.status !== 'pending') {
    return jsonResponse({ error: `Pedido já está em status "${order.status}"` }, 400);
  }

  const { data: items, error: iErr } = await db
    .from('order_items')
    .select('product_id, product_name, product_unit, qty, unit_price_cents')
    .eq('order_id', orderId);
  if (iErr) return jsonResponse({ error: iErr.message }, 500);
  if (!items || items.length === 0) return jsonResponse({ error: 'Pedido sem itens' }, 400);

  const returnBase = Deno.env.get('MP_RETURN_URL_BASE') || 'https://ervatorio.com.br';
  const notifyUrl = Deno.env.get('MP_NOTIFICATION_URL')
    || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`;

  try {
    // NÃO enviamos `payer` para o MP. Quando `payer.email` difere do email
    // do usuário logado no checkout (ex.: TESTUSER em sandbox), o MP
    // desabilita o botão Pagar exigindo "Alterar conta" — deadlock.
    // O endereço de entrega já fica persistido em orders.shipping_address.
    const pref = await createPreference({
      external_reference: order.id,
      items: items.map((it) => ({
        id: it.product_id || undefined,
        title: it.product_name,
        description: it.product_unit || undefined,
        category_id: 'food',
        quantity: it.qty,
        unit_price: it.unit_price_cents / 100,   // MP usa reais, não centavos
        currency_id: order.currency || 'BRL',
      })),
      auto_return: 'approved',
      back_urls: {
        success: `${returnBase}/?checkout=success&order=${order.order_number}`,
        failure: `${returnBase}/?checkout=failure&order=${order.order_number}`,
        pending: `${returnBase}/?checkout=pending&order=${order.order_number}`,
      },
      notification_url: notifyUrl,
      statement_descriptor: 'ERVATORIO',
      metadata: { order_id: order.id, order_number: order.order_number },
    });

    // Salva o preference_id no pedido para auditoria/rastreio.
    await db
      .from('orders')
      .update({
        payment_provider: 'mercadopago',
        payment_external_id: pref.id,
      })
      .eq('id', order.id);

    const mode = getMode();
    const initPoint = mode === 'production' ? pref.init_point : pref.sandbox_init_point;

    return jsonResponse({
      ok: true,
      preference_id: pref.id,
      init_point: initPoint,
      mode,
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
