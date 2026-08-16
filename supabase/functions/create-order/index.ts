// Cria um pedido a partir do carrinho do cliente.
// O SERVIDOR é a autoridade de preço: nunca confiar no total enviado pelo
// cliente. Esta função recalcula tudo olhando admin_products, aplica regras
// de estoque e retorna o pedido com status 'pending'. O pagamento é iniciado
// em um segundo passo (ex.: função separada que chama Mercado Pago).
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { exigirLigado } from '../_shared/interruptores.ts';
import { getUserFromRequest, adminClient } from '../_shared/auth.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';
import { resolveChosenOption, type ShipmentItem } from '../_shared/shipping.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CartItem { product_id: string; qty: number; }
interface OrderPayload {
  items: CartItem[];
  guest_email?: string;
  shipping_address: {
    name: string;
    phone?: string;
    zip: string;
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    country?: string;
  };
  notes?: string;
  // Onda 6.4: chave da opção de frete que o cliente escolheu na
  // cotação. O servidor revalida e recalcula o preço — nunca confia
  // no valor do cliente. Ausente quando SHIPPING_ENABLED != true.
  shipping_service?: string;
}

// Resolve o frete no servidor. Fonte da verdade do preço.
// - SHIPPING_ENABLED != true → frete 0 (comportamento legado).
// - Ligado sem opção escolhida ou com chave inválida → erro 400.
async function resolveShipping(
  zip: string,
  items: ShipmentItem[],
  chosenKey: string | undefined,
): Promise<{ cents: number; carrier: string | null; error?: string }> {
  if ((Deno.env.get('SHIPPING_ENABLED') || 'false').toLowerCase() !== 'true') {
    return { cents: 0, carrier: null };
  }
  if (!chosenKey) return { cents: 0, carrier: null, error: 'Selecione uma opção de frete.' };
  const option = await resolveChosenOption(
    zip, items, chosenKey,
    (k) => Deno.env.get(k),
    (e) => console.warn('[create-order] shipping provider fallback:', String(e)),
  );
  if (!option) {
    return { cents: 0, carrier: null, error: 'Opção de frete inválida — recalcule o frete e tente novamente.' };
  }
  return { cents: option.priceCents, carrier: `${option.carrier} · ${option.service}` };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Pagamentos desligados recusam AQUI, no servidor.
  // A tela lê `window.SITE_SETTINGS` e esconde o botão; isso é UX. Quem
  // virasse a variável no devtools chegava até esta função sem barreira.
  const desligado = await exigirLigado('pagamentos');
  if (desligado) return desligado;

  // Onda 6.3 (guest checkout): usuário logado OU convidado com
  // e-mail válido. Kill-switch do modo convidado: GUEST_CHECKOUT=false.
  const caller = await getUserFromRequest(req);

  let body: OrderPayload;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  let guestEmail: string | null = null;
  if (!caller) {
    if ((Deno.env.get('GUEST_CHECKOUT') || 'true').toLowerCase() === 'false') {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    guestEmail = String(body.guest_email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(guestEmail)) {
      return jsonResponse({ error: 'Informe um e-mail válido para comprar sem conta' }, 400);
    }
  }

  // Anti-abuso: 10 criações de pedido/min por usuário; convidado por IP.
  const rlKey = caller ? `create-order:${caller.id}` : `create-order:ip:${clientIp(req)}`;
  if (!(await rateLimitAllow(rlKey, { windowSeconds: 60, max: 10 }))) {
    return tooManyRequests();
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonResponse({ error: 'Carrinho vazio' }, 400);
  }
  const addr = body.shipping_address;
  if (!addr?.name || !addr?.zip || !addr?.street || !addr?.city || !addr?.state) {
    return jsonResponse({ error: 'Endereço de entrega incompleto' }, 400);
  }

  // Valida que todo product_id é UUID. Produtos do catálogo hardcoded
  // em app.js têm id numérico — eles precisam estar em admin_products
  // para serem vendáveis (rode ervaria-seed-data.sql).
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalidIds = body.items
    .map((i) => String(i.product_id ?? ''))
    .filter((id) => !UUID_RE.test(id));
  if (invalidIds.length > 0) {
    return jsonResponse({
      error: 'Alguns produtos do carrinho não estão disponíveis para compra. Esvazie o carrinho e tente adicionar os itens novamente.',
      invalid_ids: invalidIds,
    }, 400);
  }

  const db = adminClient();

  const productIds = [...new Set(body.items.map((i) => i.product_id))];
  const { data: products, error: pErr } = await db
    .from('admin_products')
    .select('id, name, price, unit, stock, active, weight_grams, modo_de_venda')
    .in('id', productIds);
  if (pErr) return jsonResponse({ error: pErr.message }, 500);

  const byId = new Map((products || []).map((p) => [p.id, p]));
  const lines: Array<Record<string, unknown>> = [];
  const shipItems: ShipmentItem[] = [];
  let subtotalCents = 0;

  for (const item of body.items) {
    const p = byId.get(item.product_id);
    if (!p || !p.active) {
      return jsonResponse({ error: `Produto indisponível: ${item.product_id}` }, 400);
    }
    if (p.stock === 'out') {
      return jsonResponse({ error: `Produto esgotado: ${p.name}` }, 400);
    }
    // Produto de indicação NÃO se vende aqui: quem vende é o parceiro, na loja
    // dele. A vitrine mostra «ver na loja do parceiro» em vez do botão de
    // comprar, mas isso é UX — o carrinho mora no localStorage e é editável,
    // e esta função é alcançável direto por qualquer cliente HTTP.
    //
    // Aceitar seria cobrar por algo que não temos, não despachamos e não
    // podemos cancelar: o pedido nasceria válido, o estoque seria reservado
    // sobre um `stock_qty` que nem existe, e a devolução seria um problema
    // jurídico em vez de um bug. É a mesma razão de o preço nunca vir do
    // cliente — só que aqui o que não pode vir de fora é a própria decisão de
    // que aquele item é vendável.
    if (p.modo_de_venda === 'indicacao') {
      return jsonResponse({
        error: `${p.name} é vendido pelo parceiro e não pode ser comprado por aqui.`,
      }, 400);
    }
    const qty = Math.max(1, Math.min(999, Math.floor(Number(item.qty) || 0)));
    const unitCents = Math.round(Number(p.price) * 100);
    const lineTotal = unitCents * qty;
    subtotalCents += lineTotal;
    lines.push({
      product_id: p.id,
      product_name: p.name,
      product_unit: p.unit,
      qty,
      unit_price_cents: unitCents,
      line_total_cents: lineTotal,
    });
    shipItems.push({ weightGrams: Number(p.weight_grams) || 100, qty, priceCents: unitCents });
  }

  // Frete: o servidor revalida a opção escolhida e recalcula o preço.
  // Com SHIPPING_ENABLED != true mantemos o comportamento anterior (0).
  const { cents: shippingCents, carrier: shippingCarrier, error: shipErr } =
    await resolveShipping(addr.zip, shipItems, body.shipping_service);
  if (shipErr) return jsonResponse({ error: shipErr }, 400);
  const totalCents = subtotalCents + shippingCents;

  // Reserva o estoque ANTES de criar o pedido. reserve_stock()
  // decrementa todas as linhas ou nenhuma, com FOR UPDATE, então dois
  // pedidos simultâneos pela última unidade não passam os dois.
  // Produto com stock_qty NULL é ignorado (estoque não controlado) —
  // ver a migration 20260730060000_stock_control.sql.
  //
  // Se falhar aqui, nenhum pedido foi criado e nada precisa desfazer.
  // Se falhar DEPOIS daqui, o release abaixo devolve as unidades.
  const { error: rErr } = await db.rpc('reserve_stock', {
    p_items: body.items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
  });
  if (rErr) {
    // check_violation = estoque insuficiente: é erro do cliente (400),
    // com a mensagem do banco, que já nomeia o produto e as quantidades.
    const insuficiente = rErr.code === '23514' || /insuficiente/i.test(rErr.message || '');
    return jsonResponse(
      { error: insuficiente ? rErr.message : 'Não foi possível reservar o estoque.' },
      insuficiente ? 400 : 500,
    );
  }

  const { data: order, error: oErr } = await db
    .from('orders')
    .insert({
      user_id: caller ? caller.id : null,
      guest_email: guestEmail,
      status: 'pending',
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: 'BRL',
      shipping_address: addr,
      shipping_carrier: shippingCarrier,
      notes: body.notes || null,
    })
    .select('id')
    .single();
  if (oErr) {
    // Estoque já foi reservado e não há pedido para segurá-lo. Devolve
    // item por item, porque release_stock() depende de order_items, que
    // ainda não existe.
    await devolveReserva(db, body.items);
    return jsonResponse({ error: oErr.message }, 500);
  }

  const itemsWithOrderId = lines.map((l) => ({ ...l, order_id: order.id }));
  const { error: iErr } = await db.from('order_items').insert(itemsWithOrderId);
  if (iErr) {
    // Pedido sem itens é inútil e ainda segura estoque: apaga os dois.
    await devolveReserva(db, body.items);
    await db.from('orders').delete().eq('id', order.id);
    return jsonResponse({ error: iErr.message }, 500);
  }

  return jsonResponse({
    ok: true,
    order_id: order.id,
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    total_cents: totalCents,
    currency: 'BRL',
  });
});

// ------------------------------------------------------------
// Devolve unidades reservadas quando o pedido não chegou a existir.
// reserve_stock() com qty negativa faria o caminho inverso, mas a
// função valida `qty >= 1`; então some 1 unidade de cada vez seria
// errado. Aqui incrementa direto, só nos produtos controlados.
// ------------------------------------------------------------
async function devolveReserva(
  db: ReturnType<typeof adminClient>,
  items: CartItem[],
): Promise<void> {
  for (const it of items) {
    const { data: p } = await db
      .from('admin_products')
      .select('stock_qty')
      .eq('id', it.product_id)
      .maybeSingle();
    if (!p || p.stock_qty === null) continue;
    const qty = Math.max(1, Math.min(999, Math.floor(Number(it.qty) || 0)));
    await db
      .from('admin_products')
      .update({ stock_qty: p.stock_qty + qty })
      .eq('id', it.product_id);
  }
}
