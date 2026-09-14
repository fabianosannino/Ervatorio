// ============================================================
// Diário de infusões (handoff, PR 08b)
// ============================================================
// O que não pode regredir: sem o interruptor `diario` a tela avisa e o
// menu não a oferece; ligado e sem conta, explica e oferece entrar; ligado
// e com conta, registra erva + horário + sensação (lista fechada), lista,
// corrige a sensação e apaga; nada do diário vai para o localStorage; não
// existe campo de texto livre.
//
// Não há Supabase aqui: `ervaria.client` é substituído por um stub que
// registra as chamadas. O que a RLS e o interruptor garantem no banco está
// em supabase/tests/20260916_diario_infusoes_test.sql.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem('erb_entered', '1');
      localStorage.setItem('erb_lang', 'pt');
      localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false }));
    } catch (_) {}
  });
});

// Liga (ou desliga) o interruptor como se o banco tivesse respondido.
async function interruptor(page, ligado) {
  await page.evaluate((on) => {
    window.ERV_INTERRUPTORES = Object.assign(window.ERV_INTERRUPTORES || {}, { diario: on });
    if (typeof renderNav === 'function') renderNav();
    if (window._currentPage === 'diario' && typeof renderDiario === 'function') renderDiario();
  }, ligado);
}

// Conta falsa + cliente falso: registra o que o app tentaria gravar e
// devolve linhas plausíveis. Cada cadeia é "thenable": `await` funciona em
// qualquer ponto (.limit(), .single(), .eq().eq()).
async function logar(page, linhas) {
  await page.evaluate((rows) => {
    window.__calls = [];
    let seq = 0;
    const from = (table) => {
      let op = null, payload = null;
      const result = { data: null, error: null };
      const chain = new Proxy({}, { get(_, k) {
        if (k === 'then') return (res) => res(result);
        return (...args) => {
          if (['select', 'insert', 'update', 'delete'].includes(k) && !op) { op = k; if (k !== 'select') payload = args[0]; }
          if (k === 'limit') { result.data = rows || []; window.__calls.push({ table, op: 'select' }); }
          if (k === 'single') { result.data = Object.assign({ id: 'd' + (++seq) }, payload); window.__calls.push({ table, op, payload }); }
          if (k === 'eq' && (op === 'update' || op === 'delete') && args[0] === 'id') window.__calls.push({ table, op, id: args[1], payload });
          return chain;
        };
      } });
      return chain;
    };
    ervaria.user = { id: 'u1', email: 'ana@x.co' };
    ervaria.isOnline = true;
    ervaria.client = { from, auth: { getSession: async () => ({ data: { session: null } }) } };
    if (typeof resetDiarioState === 'function') resetDiarioState();
    if (window._currentPage === 'diario' && typeof renderDiario === 'function') renderDiario();
  }, linhas || []);
}

const ONTEM = new Date(Date.now() - 26 * 3600 * 1000).toISOString();

test.describe('Diário de infusões', () => {
  test('sem o interruptor: a tela avisa e o menu não oferece o Diário', async ({ page }) => {
    await page.goto('/#diario', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-diario')).toHaveClass(/\bon\b/);
    await expect(page.locator('#diarioOff')).toBeVisible();
    await expect(page.locator('#diarioForm')).toBeHidden();
    await expect(page.locator('#diarioGuest')).toBeHidden();
    // Sub-navegação do grupo «conta» sem o item.
    expect(await page.locator('#ervSubnav a[href="#diario"]').count()).toBe(0);
    await page.setViewportSize({ width: 390, height: 800 });
    await page.click('.erv-nav-burger');
    await expect(page.locator('#ervMenuSheet')).toBeVisible();
    expect(await page.locator('#ervMenuSheet a[href="#diario"]').count()).toBe(0);
  });

  test('ligado e sem conta: explica, oferece entrar, não coleta', async ({ page }) => {
    await page.goto('/#diario', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-diario')).toHaveClass(/\bon\b/);
    await interruptor(page, true);
    await expect(page.locator('#diarioOff')).toBeHidden();
    await expect(page.locator('#diarioGuest')).toBeVisible();
    await expect(page.locator('#diarioForm')).toBeHidden();
    // Com o interruptor ligado, o Diário entra na sub-navegação de «conta».
    await expect(page.locator('#ervSubnav a[href="#diario"]')).toHaveCount(1);
    // Desligar de novo tira do menu e volta o aviso.
    await interruptor(page, false);
    await expect(page.locator('#diarioOff')).toBeVisible();
    expect(await page.locator('#ervSubnav a[href="#diario"]').count()).toBe(0);
  });

  test('com conta: registra erva + horário + sensação e nada vai para o aparelho', async ({ page }) => {
    await page.goto('/#diario', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-diario')).toHaveClass(/\bon\b/);
    await interruptor(page, true);
    await logar(page, []);
    await expect(page.locator('#diarioForm')).toBeVisible();
    await expect(page.locator('#diarioVazio')).toBeVisible();
    // Não existe campo de texto livre no diário.
    expect(await page.locator('#page-diario textarea, #page-diario input[type="text"]:not([list])').count()).toBe(0);
    // Os chips são a lista fechada, um por sensação.
    await expect(page.locator('#diarioSensacoes .perfil-chip')).toHaveCount(7);

    // Erva fora do catálogo não registra.
    await page.fill('#diarioErva', 'Chá de bolacha');
    await page.click('#diarioAdd');
    expect((await page.evaluate(() => window.__calls.filter((c) => c.op === 'insert'))).length).toBe(0);
    await expect(page.locator('#diarioErva')).toHaveAttribute('aria-invalid', 'true');

    // Camomila, com a sensação «Relaxei».
    await page.fill('#diarioErva', 'Camomila');
    await page.fill('#diarioQuando', '2026-09-16T21:30');
    await page.click('#diarioSensacoes [data-sensacao="relaxei"]');
    await expect(page.locator('#diarioSensacoes [data-sensacao="relaxei"]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('#diarioAdd');
    const inserts = await page.evaluate(() => window.__calls.filter((c) => c.op === 'insert'));
    expect(inserts.length).toBe(1);
    expect(inserts[0].table).toBe('diario_infusoes');
    expect(inserts[0].payload.user_id).toBe('u1');
    expect(inserts[0].payload.erva_id).toBe('1');
    expect(inserts[0].payload.erva_nome).toBe('Camomila');
    expect(inserts[0].payload.sensacao).toBe('relaxei');
    expect(new Date(inserts[0].payload.tomado_em).getTime()).toBe(new Date('2026-09-16T21:30').getTime());
    expect(Object.keys(inserts[0].payload).sort()).toEqual(['erva_id', 'erva_nome', 'sensacao', 'tomado_em', 'user_id']);

    // A lista mostra o registro; o formulário voltou ao zero.
    await expect(page.locator('#diarioLista .diario-item')).toHaveCount(1);
    await expect(page.locator('#diarioLista .diario-erva')).toHaveText('Camomila');
    await expect(page.locator('#diarioLista .diario-sensacao')).toHaveValue('relaxei');
    await expect(page.locator('#diarioErva')).toHaveValue('');

    // Nada do diário no aparelho.
    const chaves = await page.evaluate(() => Object.keys(localStorage).filter((k) => /diario|infus/i.test(k) || /Camomila/.test(localStorage.getItem(k) || '')));
    expect(chaves).toEqual([]);
  });

  test('com conta: lista o que veio do servidor, corrige a sensação e apaga', async ({ page }) => {
    await page.goto('/#diario', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-diario')).toHaveClass(/\bon\b/);
    await interruptor(page, true);
    await logar(page, [
      { id: 'a1', erva_id: '2', erva_nome: 'Valeriana', tomado_em: new Date().toISOString(), sensacao: 'dormi_bem' },
      { id: 'a2', erva_id: 'guarana', erva_nome: 'Guaraná', tomado_em: ONTEM, sensacao: null },
    ]);
    await expect(page.locator('#diarioLista .diario-item')).toHaveCount(2);
    await expect(page.locator('#diarioLista .diario-dia')).toHaveCount(2);
    await expect(page.locator('.diario-item[data-id="a1"] .diario-sensacao')).toHaveValue('dormi_bem');
    await expect(page.locator('.diario-item[data-id="a2"] .diario-sensacao')).toHaveValue('');

    // Corrigir a sensação grava só a coluna `sensacao`, pelo id.
    await page.selectOption('.diario-item[data-id="a2"] .diario-sensacao', 'energia');
    await expect.poll(async () => page.evaluate(() => window.__calls.filter((c) => c.op === 'update').length)).toBe(1);
    const upd = await page.evaluate(() => window.__calls.filter((c) => c.op === 'update')[0]);
    expect(upd.id).toBe('a2');
    expect(upd.payload).toEqual({ sensacao: 'energia' });

    // Apagar chama delete pelo id e some da lista.
    await page.click('.diario-item[data-id="a1"] .diario-apagar');
    await expect(page.locator('#diarioLista .diario-item')).toHaveCount(1);
    const del = await page.evaluate(() => window.__calls.filter((c) => c.op === 'delete'));
    expect(del.length).toBe(1);
    expect(del[0].id).toBe('a1');

    // Sair limpa o estado em memória.
    await page.evaluate(() => { ervaria.user = null; if (typeof resetDiarioState === 'function') resetDiarioState(); });
    expect(await page.evaluate(() => diarioState.itens.length)).toBe(0);
  });
});
