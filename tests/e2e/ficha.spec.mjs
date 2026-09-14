// ============================================================
// Ficha: leigo primeiro, técnico depois (handoff, PR 06)
// ============================================================
// O que não pode regredir: a ficha do app abre sem Supabase (FICHAS_ANCORA
// primeiro); o bloco-resumo traz «para que serve · como preparar · quem
// deve evitar» e as contraindicações NÃO aparecem mais como «ações
// principais»; «Iniciar preparo · N min» abre o timer no lugar e avisa ao
// terminar; Salvar e Adicionar ao blend funcionam da ficha; «Onde
// encontrar» só oferece parceiro com o interruptor `indicacao` ligado,
// pela rota /indicacao?produto=<id>, sem preço; o e-mail vai para
// newsletter-subscribe com source «ficha»; o overlay antigo não existe
// mais; a página estática /erva/<slug>/ tem o mesmo resumo e as mesmas
// seções separadas.
// ============================================================
import { test, expect } from '@playwright/test';

const FUNCTIONS_URL = 'https://ejarqinmjlgbqzurctsf.supabase.co/functions/v1';

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

async function abrirFicha(page, slug) {
  await page.goto('/#ficha/' + slug, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#page-ficha')).toHaveClass(/\bon\b/, { timeout: 5000 });
  await expect(page.locator('#page-ficha .ficha-title')).toBeVisible();
}

test.describe('Ficha do app', () => {
  test('abre sem banco, com o resumo no topo e as contraindicações fora das ações', async ({ page }) => {
    await abrirFicha(page, 'guarana');
    await expect(page.locator('.ficha-title')).toHaveText('Guaraná');
    await expect(page.locator('a.ficha-back[href="#ervas"]')).toBeVisible();
    await expect(page.locator('.ficha-resumo .ficha-resumo-cell')).toHaveCount(3);
    const evitar = page.locator('.ficha-resumo .ficha-resumo-cell').nth(2);
    await expect(evitar).toContainText(/Quem deve evitar/i);
    await expect(evitar).toContainText(/Hipertens/);
    await expect(evitar).toContainText(/Gravidez/);
    await expect(page.locator('.ficha-resumo .ficha-resumo-cell').nth(1)).toContainText(/85°C · 5 min/);
    // O detalhe técnico começa recolhido; dentro dele, as ações não trazem
    // nenhuma linha-marcador nem contraindicação; a lista própria traz.
    expect(await page.locator('#fichaTecnico').evaluate((d) => d.open)).toBe(false);
    await page.click('#fichaTecnico summary');
    const acoes = await page.locator('.ficha-acoes-lista li').allTextContents();
    expect(acoes.length).toBeGreaterThan(3);
    for (const a of acoes) { expect(a).not.toMatch(/:$/); expect(a).not.toMatch(/Hipertensão|Gravidez|Interações/); }
    await expect(page.locator('.ficha-contra-lista')).toContainText('Hipertensão arterial não controlada');
    await expect(page.locator('#fichaSeguranca')).toContainText('ANTICOAGULANTES');
    await expect(page.locator('#fichaSeguranca')).toContainText(/Dose máxima/);
    // Aviso de saúde antes do técnico; fontes sempre presentes.
    const ordem = await page.evaluate(() => {
      const a = document.querySelector('.ficha-aviso'), d = document.querySelector('#fichaTecnico');
      return !!(a.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(ordem).toBe(true);
    await expect(page.locator('.ficha-fontes li')).toHaveCount(5);
    // HTML nascido em JavaScript: nada clicável que não seja botão ou link.
    expect(await page.locator('#page-ficha div[onclick], #page-ficha span[onclick]').count()).toBe(0);
    // Nenhum resto do overlay antigo.
    expect(await page.locator('#fichaOverlay, .ficha-overlay').count()).toBe(0);
  });

  test('ficha sem fontes diz «em revisão» e sem tempo oferece o timer como sugestão', async ({ page }) => {
    await abrirFicha(page, 'andiroba');
    await expect(page.locator('.ficha-fontes')).toContainText(/Fontes em revisão/);
    await expect(page.locator('.ficha-btn-preparo')).toHaveText('Iniciar preparo');
    await page.click('.ficha-btn-preparo');
    await expect(page.locator('#fichaTimerDisplay')).toHaveText('08:00');
    await expect(page.locator('.ficha-timer-hint')).toBeVisible();
    await page.click('.ficha-timer-ctl button:has-text("+1 min")');
    await expect(page.locator('#fichaTimerDisplay')).toHaveText('09:00');
  });

  test('«Iniciar preparo · 5 min» conta no lugar e avisa ao terminar', async ({ page }) => {
    await page.clock.install();
    await abrirFicha(page, 'guarana');
    const btn = page.locator('.ficha-btn-preparo');
    await expect(btn).toHaveText('Iniciar preparo · 5 min');
    await expect(page.locator('#fichaTimer')).toBeHidden();
    await btn.click();
    await expect(page.locator('#fichaTimer')).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#fichaTimerDisplay')).toHaveText('05:00');
    await page.click('#fichaTimerPlay');
    await page.clock.runFor(2000);
    await expect(page.locator('#fichaTimerDisplay')).toHaveText(/04:5\d/);
    await page.clock.runFor(5 * 60 * 1000);
    await expect(page.locator('#fichaTimerDisplay')).toHaveText('00:00');
    await expect(page.locator('#fichaTimerLabel')).toHaveText(/sua pausa está servida/);
    await expect(page.locator('#toast')).toHaveText(/sua pausa está servida/);
    // O mesmo botão fecha o timer.
    await btn.click();
    await expect(page.locator('#fichaTimer')).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Salvar e Adicionar ao meu blend funcionam da ficha', async ({ page }) => {
    await abrirFicha(page, 'guarana');
    const salvar = page.locator('.ficha-btn-salvar');
    await expect(salvar).toHaveText('♡ Salvar');
    await salvar.click();
    await expect(salvar).toHaveText('♥ Salvo');
    await expect(salvar).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('erb_favs') || '[]'))).toContain(27);
    await salvar.click();
    await expect(salvar).toHaveText('♡ Salvar');
    const blend = page.locator('.ficha-btn-blend');
    await blend.click();
    await expect(blend).toHaveText('✓ No meu blend');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('erb_tray') || '[]'))).toContain(27);
  });

  test('«Onde encontrar»: sem parceiro diz isso; com o interruptor e produto de indicação, link pela nossa rota e sem preço', async ({ page }) => {
    await abrirFicha(page, 'guarana');
    const onde = page.locator('#fichaOnde');
    await expect(onde).toContainText(/Ainda não temos parceiro/);
    await expect(onde.locator('a[href="#onde-beber"]')).toHaveCount(1);
    expect(await onde.locator('[data-loja], .ficha-parceiro').count()).toBe(0);
    // Produto de indicação no catálogo, mas interruptor desligado: nada.
    await page.evaluate(() => {
      MKT_PRODUCTS.push({ id: 9001, dbId: 'p-uuid-1', cat: 'Ervas & Acessórios', name: 'Guaraná em pó', seller: 'Amazon', parceiro: 'Amazon', icon: '', price: 39.9, modo_de_venda: 'indicacao', link_externo: 'https://www.amazon.com.br/dp/x', is_test: false });
      renderFichaPage('guarana');
    });
    await expect(onde).toContainText(/Ainda não temos parceiro/);
    expect(await onde.locator('.ficha-parceiro').count()).toBe(0);
    // Interruptor ligado: o link passa pela rota com o id do produto.
    await page.evaluate(() => { window.ERV_INTERRUPTORES = Object.assign(window.ERV_INTERRUPTORES || {}, { indicacao: true }); renderFichaPage('guarana'); });
    const link = onde.locator('a.ficha-parceiro');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', FUNCTIONS_URL + '/indicacao?produto=p-uuid-1');
    await expect(link).toHaveAttribute('rel', /sponsored/);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toContainText('Amazon');
    await expect(onde).not.toContainText('R$');
    await expect(onde).not.toContainText('amazon.com.br');
    await expect(onde).toContainText(/o preço é o do parceiro/);
  });

  test('o e-mail da ficha vai para newsletter-subscribe com source «ficha»', async ({ page }) => {
    let corpo = null;
    await page.route('**/newsletter-subscribe', async (route) => {
      corpo = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await abrirFicha(page, 'guarana');
    await page.fill('#fichaEmail', 'ana@exemplo.com');
    await page.click('.ficha-email-form button[type="submit"]');
    await expect(page.locator('.ficha-email [data-email-msg]')).toHaveText(/Anotado/);
    expect(corpo).toEqual({ email: 'ana@exemplo.com', source: 'ficha', locale: 'pt' });
    await expect(page.locator('.ficha-email-form')).toBeHidden();
  });

  test('a ficha tem uma tela só: o modal da erva leva a #ficha/<slug>; id numérico antigo também', async ({ page }) => {
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-ervatorio')).toHaveClass(/\bon\b/, { timeout: 5000 });
    await page.evaluate(() => openHerbModal(27));
    await expect(page.locator('#herbModal')).toHaveClass(/\bon\b/);
    await page.click('#modalFichaSlot .ficha-cta');
    await expect(page.locator('#page-ficha')).toHaveClass(/\bon\b/);
    await expect(page.locator('#herbModal')).not.toHaveClass(/\bon\b/);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#ficha/guarana');
    expect(await page.locator('#fichaOverlay').count()).toBe(0);
    // Receitas chamavam goPage('ficha', null, <id da erva>): resolve pelo catálogo.
    await abrirFicha(page, '27');
    await expect(page.locator('.ficha-title')).toHaveText('Guaraná');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#ficha/guarana');
  });

  test('«Receitas com esta erva» lista e abre a receita por hash', async ({ page }) => {
    await abrirFicha(page, 'gengibre');
    const rec = page.locator('#fichaReceitas');
    await expect(rec).toContainText(/Receitas com Gengibre/);
    const link = rec.locator('a[href="#receitas/chai-brasileiro"]');
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page.locator('#page-receitas')).toHaveClass(/\bon\b/);
    await expect(page.locator('.rec-detail-title')).toHaveText('Chai Brasileiro');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#receitas/chai-brasileiro');
  });
});

test.describe('Ficha estática /erva/<slug>/', () => {
  test('tem o mesmo resumo, o aviso antes do técnico e as seções separadas', async ({ page }) => {
    await page.goto('/erva/guarana/', { waitUntil: 'domcontentloaded' });
    const resumo = page.locator('.resumo');
    await expect(resumo.locator('> div')).toHaveCount(3);
    await expect(resumo).toContainText(/Para que serve/);
    await expect(resumo).toContainText(/85°C · 5 min/);
    await expect(resumo).toContainText(/Hipertensão arterial não controlada/);
    const acoes = page.locator('section', { has: page.locator('h2', { hasText: 'Ações principais' }) });
    await expect(acoes).toHaveCount(1);
    await expect(acoes).not.toContainText(/Hipertensão|Contraindicações:|Interações:/);
    const contra = page.locator('section', { has: page.locator('h2', { hasText: 'Contraindicações e cuidados' }) });
    await expect(contra).toContainText('Hipertensão arterial não controlada');
    const ordem = await page.evaluate(() => {
      const a = document.querySelector('.health'), t = document.querySelector('h2.tecnico');
      return !!(a && t && (a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    expect(ordem).toBe(true);
    await page.goto('/erva/copaiba/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Fontes' }) })).toContainText(/Fontes em revisão/);
  });
});
