// ============================================================
// Meu Ervatório — consentimento para dado de saúde (handoff, PR 08)
// ============================================================
// O que não pode regredir: saúde nunca em localStorage; sem conta o bloco
// explica e não coleta; com conta, chips desabilitados até o consentimento;
// salvar grava em perfil_saude e retirar apaga; o assistente de blends não
// tem mais campo livre; o cadastro pede só nome.
//
// Não há Supabase aqui: `ervaria.client` é substituído por um stub que
// registra as chamadas. O que a RLS garante está em
// supabase/tests/20260915_perfil_saude_test.sql.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem('erb_entered', '1');
      localStorage.setItem('erb_lang', 'pt');
      localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false }));
      // Aparelho com o formato antigo: saúde e texto livre no localStorage.
      localStorage.setItem('erb_perfil', JSON.stringify({ nome: 'Ana', saude: ['Grávida'], restricoes: 'alergia', objetivos: ['Melhorar sono'], sabores: [], momentos: [] }));
    } catch (_) {}
  });
});

// Conta falsa + cliente falso: registra o que o app tentaria gravar.
async function logar(page, saudeRow) {
  await page.evaluate((row) => {
    window.__calls = [];
    const from = (table) => {
      let op = null;
      const chain = new Proxy({}, { get(_, k) {
        if (k === 'then') return undefined;
        return (...args) => {
          if (['select', 'upsert', 'delete', 'update', 'insert'].includes(k)) op = k;
          if (k === 'upsert') { window.__calls.push({ table, op, payload: args[0] }); return Promise.resolve({ error: null }); }
          if (k === 'maybeSingle') { window.__calls.push({ table, op }); return Promise.resolve({ data: table === 'perfil_saude' ? (row || null) : null, error: null }); }
          if (k === 'eq' && op === 'delete') { window.__calls.push({ table, op }); return Promise.resolve({ error: null }); }
          return chain;
        };
      } });
      return chain;
    };
    ervaria.user = { id: 'u1', email: 'ana@x.co' };
    ervaria.isOnline = true;
    ervaria.client = { from, auth: { getSession: async () => ({ data: { session: null } }) } };
    renderPerfil();
  }, saudeRow || null);
}

test.describe('Perfil — dado de saúde', () => {
  test('o formato antigo do localStorage perde saúde e texto livre na primeira carga', async ({ page }) => {
    await page.goto('/#perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-perfil')).toHaveClass(/\bon\b/);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('erb_perfil')));
    expect(stored.nome).toBe('Ana');
    expect(stored).not.toHaveProperty('saude');
    expect(stored).not.toHaveProperty('restricoes');
    // E não há campo de texto livre de saúde na tela.
    expect(await page.locator('#perfilRestricoes').count()).toBe(0);
  });

  test('sem conta: o bloco explica, não coleta, e o app segue funcional', async ({ page }) => {
    await page.goto('/#perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-perfil')).toHaveClass(/\bon\b/);
    await expect(page.locator('#perfilSaudeGuest')).toBeVisible();
    await expect(page.locator('#perfilSaudeForm')).toBeHidden();
    await expect(page.locator('#perfilSaude')).toContainText(/Por que perguntamos/);
    await expect(page.locator('#perfilSaude')).toContainText(/nunca neste aparelho/);
    // Salvar sem conta funciona e não escreve saúde em lugar nenhum.
    await page.fill('#perfilNome', 'Ana Maria');
    await page.click('.perfil-save-btn');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('erb_perfil')));
    expect(stored.nome).toBe('Ana Maria');
    expect(Object.keys(stored).sort()).toEqual(['momentos', 'nome', 'objetivos', 'sabores']);
  });

  test('com conta: chips desabilitados até o consentimento; salvar grava só no servidor', async ({ page }) => {
    await page.goto('/#perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-perfil')).toHaveClass(/\bon\b/);
    await logar(page, null);
    await expect(page.locator('#perfilSaudeForm')).toBeVisible();
    const chips = page.locator('#perfilCondicoes button');
    await expect(chips).toHaveCount(7);
    for (const c of await chips.all()) await expect(c).toBeDisabled();
    await expect(page.locator('#perfilSaudeWithdraw')).toBeHidden();

    await page.check('#perfilConsent');
    for (const c of await chips.all()) await expect(c).toBeEnabled();
    await page.click('#perfilCondicoes button[data-condicao="gestante"]');
    await page.click('#perfilCondicoes button[data-condicao="hipertensao"]');
    await page.click('.perfil-save-btn');

    await expect.poll(() => page.evaluate(() => window.__calls.filter((c) => c.table === 'perfil_saude' && c.op === 'upsert').length)).toBe(1);
    const call = await page.evaluate(() => window.__calls.find((c) => c.table === 'perfil_saude' && c.op === 'upsert'));
    expect(call.payload.user_id).toBe('u1');
    expect(call.payload.condicoes.sort()).toEqual(['gestante', 'hipertensao']);
    expect(call.payload.consentimento_em).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // Nada de saúde no aparelho — nem no perfil nem em outra chave.
    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    expect(ls).not.toMatch(/gestante|hipertensao|consentimento|perfil_saude/);
    // user_preferences não recebe mais caffeine_pref.
    const pref = await page.evaluate(() => window.__calls.find((c) => c.table === 'user_preferences' && c.op === 'upsert'));
    expect(pref && pref.payload).not.toHaveProperty('caffeine_pref');
    // A recomendação aplica a barreira: nenhum blend com erva de `avoid: gestantes`.
    await expect(page.locator('#perfilRecomendacoes')).toContainText(/Gestante/);
    await expect(page.locator('#perfilRecomendacoes')).not.toContainText(/Blend do Foco/);
  });

  test('com linha existente: retirar o consentimento apaga no servidor', async ({ page }) => {
    await page.goto('/#perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-perfil')).toHaveClass(/\bon\b/);
    await logar(page, { condicoes: ['asteraceas'], consentimento_em: '2026-09-15T10:00:00Z' });
    await expect(page.locator('#perfilConsent')).toBeChecked();
    await expect(page.locator('#perfilCondicoes button[data-condicao="asteraceas"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#perfilSaudeWithdraw')).toBeVisible();
    await page.click('#perfilSaudeWithdraw');
    await expect.poll(() => page.evaluate(() => window.__calls.filter((c) => c.table === 'perfil_saude' && c.op === 'delete').length)).toBe(1);
    await expect(page.locator('#perfilConsent')).not.toBeChecked();
    await expect(page.locator('#perfilSaudeWithdraw')).toBeHidden();
  });

  test('«Seus dados»: baixar, excluir e sair só com conta', async ({ page }) => {
    await page.goto('/#perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#perfilDadosGuest')).toBeVisible();
    await expect(page.locator('#perfilDadosActions')).toBeHidden();
    await logar(page, null);
    await expect(page.locator('#perfilDadosActions')).toBeVisible();
    await expect(page.locator('#perfilDadosActions button')).toHaveCount(3);
  });
});

test.describe('assistente de blends — restrição por chips', () => {
  test('não há campo de texto livre; a restrição é nomeada no resultado', async ({ page }) => {
    await page.goto('/#blends/assistente', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-blends')).toHaveClass(/\bon\b/);
    expect(await page.locator('#wizObs').count()).toBe(0);
    await expect(page.locator('#wizRestr button')).toHaveCount(8); // Nenhuma + 7
    await page.click('#wizSintomas .wizard-chip >> nth=0');
    await page.click('#wizRestr button[data-condicao="gestante"]');
    await page.click('.gen-btn');
    await expect(page.locator('#blendResult')).toContainText(/Gestante/);
    // A restrição não persiste no aparelho.
    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    expect(ls).not.toMatch(/gestante/);
  });
});

test.describe('cadastro reduzido', () => {
  test('o overlay pede só o nome; sem telefone, cidade ou interesse', async ({ page }) => {
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.getElementById('profileCompleteOverlay').classList.add('on'));
    const ov = page.locator('#profileCompleteOverlay');
    await expect(ov.locator('#pcName')).toBeVisible();
    for (const id of ['pcPhone', 'pcExtraEmails', 'pcCountry', 'pcState', 'pcCity', 'pcInterests', 'pcReferral', 'pcStep2']) {
      expect(await ov.locator('#' + id).count()).toBe(0);
    }
    await expect(ov.locator('.pc-skip')).toHaveText(/Pular por agora/);
    await expect(ov.locator('.pc-skip')).not.toHaveText(/limitado/);
  });
});
