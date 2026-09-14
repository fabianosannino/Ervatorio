// ============================================================
// Edge Function: user-data-rights (Onda 2.3 · backlog #75)
// ============================================================
// Direitos do titular (LGPD art. 18) em autoatendimento:
//
//   POST { action: 'export' }
//     → devolve JSON com todos os dados pessoais do PRÓPRIO
//       usuário autenticado (portabilidade/acesso).
//
//   POST { action: 'delete', confirm: 'EXCLUIR' }
//     → exclusão da própria conta:
//       1. anonimiza os pedidos (obrigação fiscal: mantém valores
//          e status, remove nome/telefone/endereço do snapshot);
//       2. deleta o usuário no Auth — as tabelas com ON DELETE
//          CASCADE (perfil, preferências, favoritos, diário,
//          receitas, endereços) caem junto; orders.user_id vira
//          NULL (migration 20260716120500).
//
// Segurança: opera SEMPRE sobre caller.id (nunca aceita userId no
// body) — um usuário só exporta/exclui a si mesmo. Rate-limited.
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest, adminClient } from '../_shared/auth.ts';
import { rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

const OWNED_TABLES: Array<{ table: string; key: string }> = [
  { table: 'user_profiles', key: 'id' },
  { table: 'user_preferences', key: 'user_id' },
  { table: 'user_favorites', key: 'user_id' },
  { table: 'user_inventory', key: 'user_id' },
  { table: 'tea_wheel_history', key: 'user_id' },
  { table: 'tasting_journal', key: 'user_id' },
  { table: 'saved_recipes', key: 'user_id' },
  { table: 'user_addresses', key: 'user_id' },
  // Dado sensível (migration 20260915120000): sai no export como todo o
  // resto e cai com a conta por CASCADE. Retirar só o consentimento é
  // DELETE na linha, feito pela própria tela (RLS do dono).
  { table: 'perfil_saude', key: 'user_id' },
];

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const caller = await getUserFromRequest(req);
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

  if (!(await rateLimitAllow(`data-rights:${caller.id}`, { windowSeconds: 3600, max: 10 }))) {
    return tooManyRequests();
  }

  let body: { action?: string; confirm?: string };
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  const db = adminClient();

  // ── EXPORT ───────────────────────────────────────────────────
  if (body.action === 'export') {
    const dump: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user: { id: caller.id, email: caller.email },
    };
    for (const { table, key } of OWNED_TABLES) {
      const { data, error } = await db.from(table).select('*').eq(key, caller.id);
      dump[table] = error ? { error: error.message } : data;
    }
    // Pedidos + itens (histórico de compras do titular).
    const { data: orders } = await db
      .from('orders').select('*, order_items:order_items(*)')
      .eq('user_id', caller.id);
    dump.orders = orders || [];
    return jsonResponse({ ok: true, data: dump });
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (body.action === 'delete') {
    if (body.confirm !== 'EXCLUIR') {
      return jsonResponse({ error: 'Confirmação inválida — envie confirm: "EXCLUIR"' }, 400);
    }

    // 1) Anonimiza snapshots de pedido (retenção fiscal sem PII).
    const { data: userOrders, error: ordErr } = await db
      .from('orders').select('id, shipping_address').eq('user_id', caller.id);
    if (ordErr) return jsonResponse({ error: ordErr.message }, 500);

    for (const o of userOrders || []) {
      const addr = (o.shipping_address || {}) as Record<string, unknown>;
      const anon = {
        name: '[excluído a pedido do titular]',
        city: addr.city || null,
        state: addr.state || null,
        country: addr.country || null,
      };
      const { error: upErr } = await db
        .from('orders')
        .update({ shipping_address: anon })
        .eq('id', o.id);
      if (upErr) return jsonResponse({ error: `Falha ao anonimizar pedidos: ${upErr.message}` }, 500);
    }

    // 2) Exclui o usuário no Auth (CASCADE limpa as tabelas de
    //    perfil; orders.user_id → NULL via FK SET NULL).
    const { error: delErr } = await db.auth.admin.deleteUser(caller.id);
    if (delErr) return jsonResponse({ error: delErr.message }, 500);

    console.log('[user-data-rights] conta excluída a pedido do titular', {
      user_id: caller.id, orders_anonimizados: (userOrders || []).length,
    });
    return jsonResponse({ ok: true, deleted: caller.id, orders_anonymized: (userOrders || []).length });
  }

  return jsonResponse({ error: 'action deve ser "export" ou "delete"' }, 400);
});
