// ============================================================
// ADMIN — Gestão de pedidos
// ============================================================
// Lista pedidos (todos usuários), filtra por status, mostra
// resumo de receita, abre detalhes com endereço/itens, permite
// marcar como processando/enviado/entregue e anexar rastreio.
//
// Depende de admin.js já ter populado `sb` (Supabase client) e
// `admUser` / `admToast` / `esc`. Carrega quando showSection
// chama loadOrders().
// ============================================================

let allOrders = [];

async function loadOrders() {
  const statusFilter = document.getElementById('ordStatusFilter')?.value || '';
  let q = sb.from('orders_with_items').select('*').order('created_at', { ascending: false }).limit(500);
  if (statusFilter) q = q.eq('status', statusFilter);
  const { data, error } = await q;
  if (error) { admToast('Erro: ' + error.message); return; }
  allOrders = data || [];
  renderOrdersSummary(allOrders);
  renderOrders(allOrders);
}

function filterOrders() {
  const term = (document.getElementById('ordSearch')?.value || '').toLowerCase().trim();
  if (!term) return renderOrders(allOrders);
  const filtered = allOrders.filter((o) =>
    (o.order_number || '').toLowerCase().includes(term) ||
    (o.customer_name || '').toLowerCase().includes(term) ||
    (o.customer_email || '').toLowerCase().includes(term)
  );
  renderOrders(filtered);
}

function renderOrdersSummary(orders) {
  const byStatus = {};
  let totalPaidCents = 0;
  let count = 0;
  orders.forEach((o) => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    if (['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) {
      totalPaidCents += Number(o.total_cents || 0);
      count++;
    }
  });

  const card = (label, value, color = 'gold') => `
    <div style="background:var(--adm-bg2);border:1px solid var(--adm-faint);border-radius:8px;padding:12px">
      <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px">${label}</div>
      <div style="font-size:1.1rem;color:var(--adm-${color});margin-top:4px;font-weight:500">${value}</div>
    </div>`;

  const el = document.getElementById('ordSummary');
  if (!el) return;
  el.innerHTML = [
    card('Pedidos totais', orders.length, 'gold'),
    card('Receita confirmada', formatBRL(totalPaidCents), 'green'),
    card('Ticket médio', count > 0 ? formatBRL(Math.round(totalPaidCents / count)) : '—', 'gold'),
    card('Aguardando pagto', byStatus.pending || 0, 'gold'),
    card('Prontos p/ enviar', byStatus.paid || 0, 'green'),
    card('Em trânsito', (byStatus.shipped || 0) + (byStatus.processing || 0), 'blue'),
  ].join('');
}

function renderOrders(list) {
  const tbody = document.getElementById('ordersBody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--adm-muted)">Nenhum pedido encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = list.map((o) => {
    const badge = statusBadge(o.status);
    const date = formatDate(o.created_at);
    const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
    const tracking = o.shipping_tracking_code
      ? `<code style="font-size:.72rem;color:var(--adm-gold)">${esc(o.shipping_tracking_code)}</code>`
      : '—';
    return `<tr>
      <td>
        <code style="font-size:.82rem;color:var(--adm-gold2)">${esc(o.order_number || o.id.slice(0, 8))}</code>
        <div style="font-size:.7rem;color:var(--adm-muted);margin-top:2px">${itemsCount} item(ns)</div>
      </td>
      <td>
        <strong style="font-size:.82rem">${esc(o.customer_name || '—')}</strong>
        <div style="font-size:.7rem;color:var(--adm-muted)">${esc(o.customer_email || '')}</div>
      </td>
      <td style="font-size:.78rem;color:var(--adm-muted)">${date}</td>
      <td>${badge}</td>
      <td style="color:var(--adm-gold2);font-weight:500">${formatBRL(o.total_cents)}</td>
      <td style="font-size:.78rem">${mapPayMethod(o.payment_method) || '—'}</td>
      <td>${tracking}</td>
      <td style="white-space:nowrap">
        <button class="adm-btn" onclick="openOrderDetail('${esc(o.id)}')">Ver</button>
      </td>
    </tr>`;
  }).join('');
}

function openOrderDetail(orderId) {
  const o = allOrders.find((x) => x.id === orderId);
  if (!o) return;

  document.getElementById('orderModalTitle').textContent = `Pedido ${o.order_number || o.id.slice(0, 8)}`;

  const items = Array.isArray(o.items) ? o.items : [];
  const addr = o.shipping_address || {};

  const statusOptions = ['pending','paid','processing','shipped','delivered','cancelled','refunded','failed']
    .map((s) => `<option value="${s}"${s === o.status ? ' selected' : ''}>${statusLabel(s)}</option>`).join('');

  document.getElementById('orderModalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
      <div>
        <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px">Status</div>
        <select id="ordDetStatus" class="adm-form-input" style="margin-top:4px">${statusOptions}</select>
      </div>
      <div>
        <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px">Total</div>
        <div style="font-size:1.1rem;color:var(--adm-gold2);margin-top:6px">${formatBRL(o.total_cents)}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
      <div>
        <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px">Transportadora</div>
        <input type="text" id="ordDetCarrier" class="adm-form-input" style="margin-top:4px" value="${esc(o.shipping_carrier || '')}" placeholder="Correios, Melhor Envio...">
      </div>
      <div>
        <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px">Código de rastreio</div>
        <input type="text" id="ordDetTracking" class="adm-form-input" style="margin-top:4px" value="${esc(o.shipping_tracking_code || '')}" placeholder="AA123456789BR">
      </div>
    </div>

    <div style="margin-bottom:1rem">
      <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Notas internas (admin)</div>
      <textarea id="ordDetNotes" class="adm-form-input" style="min-height:60px" placeholder="Visível apenas ao admin">${esc(o.admin_notes || '')}</textarea>
    </div>

    <div style="margin-bottom:1rem;padding:12px;background:rgba(200,168,75,.05);border:1px solid var(--adm-faint);border-radius:8px">
      <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Cliente</div>
      <strong>${esc(o.customer_name || '—')}</strong><br>
      <span style="font-size:.8rem;color:var(--adm-muted)">${esc(o.customer_email || '')}</span>
    </div>

    ${addr && Object.keys(addr).length ? `
    <div style="margin-bottom:1rem;padding:12px;background:rgba(200,168,75,.05);border:1px solid var(--adm-faint);border-radius:8px">
      <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Endereço de entrega</div>
      <div style="font-size:.85rem;line-height:1.5">
        ${esc(addr.name || '')}${addr.phone ? ' · ' + esc(addr.phone) : ''}<br>
        ${esc(addr.street || '')}${addr.number ? ', ' + esc(addr.number) : ''}${addr.complement ? ' — ' + esc(addr.complement) : ''}<br>
        ${addr.neighborhood ? esc(addr.neighborhood) + '<br>' : ''}
        ${esc(addr.city || '')} - ${esc(addr.state || '')} · CEP ${esc(addr.zip || '')}
      </div>
    </div>` : ''}

    <div style="margin-bottom:1rem">
      <div style="font-size:.68rem;color:var(--adm-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Itens (${items.length})</div>
      <table style="width:100%;font-size:.82rem">
        ${items.map((it) => `
          <tr style="border-bottom:1px solid var(--adm-faint)">
            <td style="padding:6px 0">
              <div>${esc(it.product_name)}</div>
              <div style="color:var(--adm-muted);font-size:.72rem">${it.qty} × ${esc(it.product_unit || '')} · ${formatBRL(it.unit_price_cents)}</div>
            </td>
            <td style="text-align:right;color:var(--adm-gold2);white-space:nowrap">${formatBRL(it.line_total_cents)}</td>
          </tr>`).join('')}
      </table>
    </div>

    <div style="font-size:.78rem;color:var(--adm-muted);line-height:1.7">
      <div><strong>Pagamento:</strong> ${mapPayMethod(o.payment_method) || '—'}${o.payment_external_id ? ' <code style="font-size:.7rem">#' + esc(o.payment_external_id) + '</code>' : ''}</div>
      <div><strong>Pago em:</strong> ${o.paid_at ? new Date(o.paid_at).toLocaleString('pt-BR') : '—'}</div>
      <div><strong>Enviado em:</strong> ${o.shipped_at ? new Date(o.shipped_at).toLocaleString('pt-BR') : '—'}</div>
      <div><strong>Entregue em:</strong> ${o.delivered_at ? new Date(o.delivered_at).toLocaleString('pt-BR') : '—'}</div>
      ${o.notes ? `<div><strong>Observação do cliente:</strong> ${esc(o.notes)}</div>` : ''}
    </div>

    <div style="margin-top:1rem;display:flex;gap:8px;flex-wrap:wrap">
      <button class="adm-btn primary" onclick="saveOrderDetail('${esc(o.id)}')">Salvar alterações</button>
      ${o.status === 'paid' ? `<button class="adm-btn" onclick="updateOrderStatus('${esc(o.id)}','processing')">→ Preparando</button>` : ''}
      ${o.status === 'processing' ? `<button class="adm-btn" onclick="updateOrderStatus('${esc(o.id)}','shipped')">→ Enviado</button>` : ''}
      ${o.status === 'shipped' ? `<button class="adm-btn" onclick="updateOrderStatus('${esc(o.id)}','delivered')">→ Entregue</button>` : ''}
    </div>
  `;

  document.getElementById('orderModal').classList.add('on');
}

function closeOrderDetail() {
  document.getElementById('orderModal').classList.remove('on');
}

// O status saiu do `patch`: `orders.status` e PROJEÇÃO de `pedido_eventos`
// (migration 20260816140000), e o privilégio de coluna recusa a escrita direta
// daqui. Transportadora, rastreio e observação continuam colunas — sao dados do
// pedido, nao estado.
async function saveOrderDetail(orderId) {
  const patch = {
    shipping_carrier: document.getElementById('ordDetCarrier').value.trim() || null,
    shipping_tracking_code: document.getElementById('ordDetTracking').value.trim() || null,
    admin_notes: document.getElementById('ordDetNotes').value.trim() || null,
  };
  const { error } = await sb.from('orders').update(patch).eq('id', orderId);
  if (error) { admToast('Erro: ' + error.message); return; }

  // O estado, se mudou, vai pelo caminho do fato.
  const escolhido = document.getElementById('ordDetStatus').value;
  const atual = (allOrders.find((o) => o.id === orderId) || {}).status;
  if (escolhido && escolhido !== atual) {
    const { error: fErr } = await registrarFatoDoPedido(orderId, escolhido);
    if (fErr) { admToast('Erro no status: ' + fErr.message); return; }
  }

  admToast('Pedido atualizado');
  closeOrderDetail();
  loadOrders();
}

/**
 * Move o pedido acrescentando um fato.
 *
 * A funcao no banco confere `pedidos:escrever` por dentro — nao basta alcancar
 * esta linha de JavaScript, que roda no navegador de quem estiver logado.
 *
 * Um fato que NAO avanca na regua e aceito e ignorado pela precedencia. E de
 * proposito: recusar aqui transformaria uma reentrega de webhook em erro, e a
 * tela ja evita oferecer o que nao muda.
 */
async function registrarFatoDoPedido(orderId, estado, motivo) {
  return await sb.rpc('registrar_fato_do_pedido', {
    p_order_id: orderId,
    p_estado: estado,
    p_motivo: motivo || null,
  });
}

async function updateOrderStatus(orderId, newStatus) {
  if (!confirm(`Mudar status para "${statusLabel(newStatus)}"?`)) return;
  const { error } = await registrarFatoDoPedido(orderId, newStatus);
  if (error) { admToast('Erro: ' + error.message); return; }
  admToast('Status atualizado');
  closeOrderDetail();
  loadOrders();
}

function exportOrdersCsv() {
  if (!allOrders.length) { admToast('Nada a exportar'); return; }
  const cols = ['order_number', 'status', 'customer_name', 'customer_email', 'total_cents', 'payment_method', 'payment_external_id', 'shipping_carrier', 'shipping_tracking_code', 'created_at', 'paid_at', 'shipped_at', 'delivered_at'];
  const header = cols.join(',');
  const rows = allOrders.map((o) => cols.map((c) => csvCell(o[c])).join(','));
  const csv = header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  admToast(`Exportado ${allOrders.length} pedido(s)`);
}

function csvCell(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

function statusLabel(s) {
  const map = {
    pending: 'Aguardando pgto',
    paid: 'Pago',
    processing: 'Preparando',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    failed: 'Falhou',
  };
  return map[s] || s;
}

function statusBadge(status) {
  const colors = {
    pending:    'gold',
    paid:       'green',
    processing: 'blue',
    shipped:    'blue',
    delivered:  'green',
    cancelled:  'red',
    refunded:   'red',
    failed:     'red',
  };
  const c = colors[status] || 'gold';
  return `<span class="adm-badge ${c}">${statusLabel(status)}</span>`;
}

function formatBRL(cents) {
  const n = Number(cents || 0) / 100;
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mapPayMethod(m) {
  if (!m) return '';
  const map = {
    account_money: 'Saldo MP',
    credit_card: 'Crédito',
    debit_card: 'Débito',
    ticket: 'Boleto',
    bank_transfer: 'PIX',
    pix: 'PIX',
  };
  return map[m] || m;
}
