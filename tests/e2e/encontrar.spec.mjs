// ============================================================
// Encontre seu chá em três passos (handoff, PR 05)
// ============================================================
// O que não pode regredir: os seis chips abrem o passo 2; o passo 2 tem
// momento e restrição em chips, sem texto livre; o passo 3 traz três cards
// e o blend sugerido, remove o que tem contraindicação para a restrição e
// avisa; o hash do resultado é compartilhável (#encontrar/<int>/<momento>/
// <restrição>) e abre direto no passo 3; nada de restrição vai para o
// localStorage; a busca por nome e a roda continuam como modo avançado; o
// Assistente de blends não existe mais e o link antigo cai aqui.
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

// A landing cobre o app até o roteador rodar (~300 ms após o load) e, nesse
// momento, `goPage('search')` volta o fluxo ao passo 1. O usuário real não
// clica antes disso (a landing está por cima); o teste também espera.
async function abrir(page, hash) {
  await page.goto('/' + hash, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#page-search')).toHaveClass(/\bon\b/);
  await expect.poll(() => page.evaluate(() => window._rotaInicialPronta === true), { timeout: 5000 }).toBe(true);
}

test.describe('Encontre seu chá — três passos', () => {
  test('passo 1 → 2 → 3: chips, sem texto livre, três cards, blend e hash compartilhável', async ({ page }) => {
    await abrir(page, '#encontrar');
    await expect(page.locator('#encPasso1')).toBeVisible();
    await expect(page.locator('#encPasso1 .intencao-card')).toHaveCount(6);
    await expect(page.locator('#encEyebrow')).toHaveText(/passo 1 de 3/);
    // O modo avançado (roda + grade) começa escondido.
    await expect(page.locator('#encBusca')).toBeHidden();

    await page.click('#encPasso1 .intencao-card[data-intencao="sono"]');
    await expect(page.locator('#encPasso2')).toBeVisible();
    await expect(page.locator('#encPasso1')).toBeHidden();
    await expect(page.locator('#encEyebrow')).toHaveText(/passo 2 de 3/);
    await expect(page.locator('#encEscolha')).toHaveText(/dormir/);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#encontrar/sono');
    // Sem campo de texto livre no passo 2.
    expect(await page.locator('#encPasso2 textarea, #encPasso2 input[type="text"]').count()).toBe(0);
    await expect(page.locator('#encMomentos .enc-chip')).toHaveCount(4);
    await expect(page.locator('#encRestricoes .enc-chip')).toHaveCount(5);
    await expect(page.locator('#encRestricoes .enc-chip[data-restricao="nenhuma"]')).toHaveAttribute('aria-pressed', 'true');

    await page.click('#encMomentos .enc-chip[data-momento="noite"]');
    await page.click('#encRestricoes .enc-chip[data-restricao="hipertensao"]');
    await expect(page.locator('#encRestricoes .enc-chip[data-restricao="nenhuma"]')).toHaveAttribute('aria-pressed', 'false');
    await page.click('#encVerOpcoes');
    await expect(page.locator('#encPasso3')).toBeVisible();
    await expect(page.locator('#encEyebrow')).toHaveText(/passo 3 de 3/);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#encontrar/sono/noite/hipertensao');
    // Aviso da restrição, três cards, nenhum com contraindicação para hipertensos.
    await expect(page.locator('#encAviso .enc-aviso')).toContainText(/Hipertens/);
    await expect(page.locator('#encCards .enc-card')).toHaveCount(3);
    const contra = await page.evaluate(() => Array.from(document.querySelectorAll('#encCards .enc-card')).map((c) => {
      const h = HERBS.find((x) => x.id === Number(c.dataset.herbId));
      return (h.avoid || []).some((a) => /hipertens/i.test(a)) ? h.n : null;
    }).filter(Boolean));
    expect(contra).toEqual([]);
    await expect(page.locator('#encCards .enc-badge').first()).toBeVisible();
    // Blend sugerido, com o que a intenção pede.
    await expect(page.locator('#encBlend .enc-blend-nome')).toHaveText(/Silêncio/);
    await expect(page.locator('#encBlend button')).toHaveCount(2);
    // A restrição não vai para o aparelho.
    const ls = await page.evaluate(() => JSON.stringify(localStorage));
    expect(ls).not.toMatch(/hipertensao|gestante/);
    // Refazer volta ao passo 1 e limpa o hash.
    await page.click('#encPasso3 .enc-btn:has-text("Refazer")');
    await expect(page.locator('#encPasso1')).toBeVisible();
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#encontrar');
  });

  test('o link compartilhado abre direto no passo 3 e o mesmo motor decide', async ({ page }) => {
    await abrir(page, '#encontrar/ansiedade/qualquer/gestante');
    await expect(page.locator('#encPasso3')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#encAviso .enc-aviso')).toContainText(/Gestante/);
    const naTela = await page.evaluate(() => Array.from(document.querySelectorAll('#encCards .enc-card')).map((c) => Number(c.dataset.herbId)));
    const doMotor = await page.evaluate(() => recomendar({ intencao: 'ansiedade', momento: 'qualquer', restricoes: ['gestante'] }).ervas.map((x) => x.herb.id));
    expect(naTela).toEqual(doMotor);
    expect(naTela.length).toBeGreaterThan(0);
    // O motor de fato removeu ervas contraindicadas para gestantes.
    const removidas = await page.evaluate(() => recomendar({ intencao: 'ansiedade', momento: 'qualquer', restricoes: ['gestante'] }).removidas.length);
    expect(removidas).toBeGreaterThan(0);
  });

  test('«Me ajuda a escolher» também segue o fluxo; intenção desconhecida cai no passo 1', async ({ page }) => {
    await abrir(page, '#encontrar/explorar');
    await expect(page.locator('#encPasso2')).toBeVisible({ timeout: 5000 });
    await page.click('#encVerOpcoes');
    await expect(page.locator('#encCards .enc-card')).toHaveCount(3);
    await abrir(page, '#encontrar/nao-existe');
    await expect(page.locator('#encPasso1')).toBeVisible({ timeout: 5000 });
  });

  test('a busca por nome e a roda continuam, como modo avançado', async ({ page }) => {
    await abrir(page, '#encontrar');
    await expect(page.locator('#encBusca')).toBeHidden();
    await page.fill('#searchInput', 'camomila');
    await expect(page.locator('#encBusca')).toBeVisible();
    await expect(page.locator('#herbGrid .herb-card:visible')).toHaveCount(1);
    await expect(page.locator('#filterWheel')).toBeVisible();
    await expect(page.locator('#encBuscaToggle')).toHaveAttribute('aria-expanded', 'true');
    // O link para a Roda dos Chás (modo avançado) e o teste de 1 minuto.
    await expect(page.locator('#encPasso1 a[href="#roda-funcional"]')).toHaveCount(1);
    await expect(page.locator('#encPasso1 a[href="#quiz"]')).toHaveCount(1);
  });

  test('o Assistente de blends saiu: Blends tem duas abas e o link antigo cai no Encontre seu chá', async ({ page }) => {
    await page.goto('/#blends', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-blends')).toHaveClass(/\bon\b/);
    await expect(page.locator('.blend-tabs .blend-tab')).toHaveCount(2);
    expect(await page.locator('#blendPanelAssist, #wizSintomas, #wizRestr, .gen-btn').count()).toBe(0);
    // A bandeja («＋ Selecionar para blend») mora agora no Manual.
    await page.click('#blendTabManual');
    await expect(page.locator('#blendPanelManual #trayItems')).toBeVisible();
    for (const hash of ['#blends/assistente', '#criarblend']) {
      await page.goto('/' + hash, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#page-search')).toHaveClass(/\bon\b/, { timeout: 5000 });
      await expect.poll(() => page.evaluate(() => location.hash)).toBe('#encontrar');
    }
  });

  test('com conta e consentimento, o passo 2 pré-marca a restrição do perfil', async ({ page }) => {
    await abrir(page, '#encontrar');
    await page.evaluate(() => {
      ervaria.user = { id: 'u1', email: 'ana@x.co' };
      saudeState = { carregado: true, consentido: true, condicoes: ['gestante', 'diabetes'], existente: true };
    });
    await page.click('#encPasso1 .intencao-card[data-intencao="digestao"]');
    await expect(page.locator('#encRestricoes .enc-chip[data-restricao="gestante"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#encRestricoes .enc-chip[data-restricao="nenhuma"]')).toHaveAttribute('aria-pressed', 'false');
    // Sem consentimento, nada é pré-marcado.
    await page.evaluate(() => { saudeState.consentido = false; encReset(); });
    await page.click('#encPasso1 .intencao-card[data-intencao="digestao"]');
    await expect(page.locator('#encRestricoes .enc-chip[data-restricao="nenhuma"]')).toHaveAttribute('aria-pressed', 'true');
  });
});
