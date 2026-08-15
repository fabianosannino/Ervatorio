// Retorna métricas agregadas do dashboard admin em UMA chamada,
// evitando 5+ roundtrips feitos pelo cliente e reduzindo leitura
// desnecessária de linhas (usa count:exact com head:true).
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest, adminClient, temCapacidade } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const caller = await getUserFromRequest(req);
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
  // O painel conta pedidos e usuários: quem lê isto precisa das duas leituras.
  if (!temCapacidade(caller, 'pedidos:ler') || !temCapacidade(caller, 'usuarios:ler')) {
    return jsonResponse({ error: 'Forbidden — requer pedidos:ler e usuarios:ler' }, 403);
  }

  const db = adminClient();

  const [users, herbs, products, suppliers, news, fichas, orders] = await Promise.all([
    db.from('user_profiles').select('id', { count: 'exact', head: true }),
    db.from('admin_herbs').select('id', { count: 'exact', head: true }),
    db.from('admin_products').select('id', { count: 'exact', head: true }),
    db.from('admin_suppliers').select('id', { count: 'exact', head: true }),
    db.from('admin_news').select('id', { count: 'exact', head: true }),
    db.from('admin_herb_fichas').select('id', { count: 'exact', head: true }),
    db.from('orders').select('id, total_cents, status', { count: 'exact' }).limit(1000),
  ]);

  // Some total vendido dos pedidos pagos — tolera tabela orders ainda inexistente.
  let revenueCents = 0;
  let paidOrders = 0;
  if (!orders.error && Array.isArray(orders.data)) {
    for (const row of orders.data) {
      if (row.status === 'paid' || row.status === 'shipped' || row.status === 'delivered') {
        revenueCents += Number(row.total_cents || 0);
        paidOrders += 1;
      }
    }
  }

  return jsonResponse({
    counts: {
      users: users.count ?? 0,
      herbs: herbs.count ?? 0,
      products: products.count ?? 0,
      suppliers: suppliers.count ?? 0,
      news: news.count ?? 0,
      fichas: fichas.count ?? 0,
      orders: orders.count ?? 0,
    },
    revenue: { paidOrders, revenueCents },
  });
});
