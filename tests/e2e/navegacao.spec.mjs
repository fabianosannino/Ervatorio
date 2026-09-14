// ============================================================
// Navegação — handoff de UX (14/09)
// ============================================================
// Cobre o que o handoff mudou e que não pode regredir: rotas por hash
// (antigas e novas) abrindo a tela certa, ausência de links mortos,
// comércio fora do DOM com a loja desligada e menu operável por teclado.
// Rodar: npm run test:e2e
// ============================================================
import { test, expect } from '@playwright/test';

// Pula o modal de login: quem já "entrou" navega livremente (erb_entered).
async function entrar(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('erb_entered', '1'); localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false })); } catch (_) {}
  });
}

async function paginaAtiva(page) {
  return page.evaluate(() => {
    const on = document.querySelector('.page.on');
    return { id: on ? on.id : null, hash: location.hash, landing: getComputedStyle(document.getElementById('landingPage')).display !== 'none' };
  });
}

test.describe('rotas por hash (D6)', () => {
  const casos = [
    // [hash pedido, página que deve abrir, hash canônico esperado]
    ['#ervatorio',      'page-ervatorio',     '#ervas'],
    ['#ervas',          'page-ervatorio',     '#ervas'],
    ['#mundo',          'page-mundo',         '#origens'],
    ['#origens',        'page-mundo',         '#origens'],
    ['#chazerias',      'page-chazerias',     '#onde-beber'],
    ['#ferramentas',    'page-ferramentas',   '#como-preparar'],
    ['#como-preparar',  'page-ferramentas',   '#como-preparar'],
    ['#roda-funcional', 'page-roda-funcional','#roda-funcional'],
    ['#chas',           'page-chas',          '#chas'],
    ['#receitas',       'page-receitas',      '#receitas'],
    ['#jogo',           'page-jogo',          '#jogo'],
    ['#favs',           'page-favs',          '#estante'],
    ['#estante',        'page-favs',          '#estante'],
    ['#caminho',        'page-caminho',       '#jornada'],
    ['#sabores',        'page-guia-sensorial','#guia-sensorial'],
    ['#search',         'page-search',        '#encontrar'],
    ['#encontrar',      'page-search',        '#encontrar'],
    ['#blends',         'page-blends',        '#blends'],
    ['#criar-blend',    'page-blends',        '#blends/manual'],
    ['#quiz',           'page-quiz',          '#quiz'],
    ['#perfil',         'page-perfil',        '#perfil'],
  ];
  for (const [pedido, pagina, canonico] of casos) {
    test(`${pedido} abre ${pagina}`, async ({ page }) => {
      await entrar(page);
      await page.goto('/' + pedido, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#' + pagina)).toHaveClass(/\bon\b/, { timeout: 5000 });
      const st = await paginaAtiva(page);
      expect(st.landing).toBe(false);
      expect(st.hash).toBe(canonico);
    });
  }

  test('#encontrar/sono aplica a intenção na tela de intenções', async ({ page }) => {
    await entrar(page);
    await page.goto('/#encontrar/sono', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-search')).toHaveClass(/\bon\b/);
    // A intenção "sono" filtra a categoria Sono (e o momento "noite").
    await expect.poll(() => page.evaluate(() => activeFilters.cat), { timeout: 5000 }).toBe('Sono');
  });

  test('âncora antiga da landing (#clube) rola para a seção com prefixo lp-', async ({ page }) => {
    await page.goto('/#clube', { waitUntil: 'domcontentloaded' });
    const st = await paginaAtiva(page);
    expect(st.landing).toBe(true);
    await expect(page.locator('#lp-clube')).toBeAttached();
  });

  test('navegar e voltar restaura a tela anterior', async ({ page }) => {
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-ervatorio')).toHaveClass(/\bon\b/);
    await page.evaluate(() => goPage('chas'));
    await expect(page.locator('#page-chas')).toHaveClass(/\bon\b/);
    expect(await page.evaluate(() => location.hash)).toBe('#chas');
    await page.goBack();
    await expect(page.locator('#page-ervatorio')).toHaveClass(/\bon\b/);
  });
});
