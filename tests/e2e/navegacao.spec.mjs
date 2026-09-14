// ============================================================
// Navegação — handoff de UX (14/09)
// ============================================================
// Cobre o que o handoff mudou e que não pode regredir: rotas por hash
// (antigas e novas) abrindo a tela certa, ausência de links mortos,
// comércio fora do DOM com a loja desligada e menu operável por teclado.
// Rodar: npm run test:e2e
// ============================================================
import { test, expect } from '@playwright/test';

// Sem rede externa: fontes e o CDN do Supabase são abortados. O app já trata
// a ausência do cliente (ervaria.init em try/catch) e, sem resposta do banco,
// a loja é considerada desligada — exatamente o cenário que estes testes
// cobrem. Também evita ~12 s de reset de conexão por página em ambiente
// sem saída para a internet.
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
  await page.addInitScript(() => {
    try { localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false })); } catch (_) {}
  });
});

// Pula o modal de login: quem já "entrou" navega livremente (erb_entered).
async function entrar(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('erb_entered', '1'); } catch (_) {}
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
      // page-search já nasce `.on`; o roteador roda 300 ms depois do load —
      // por isso o hash canônico é esperado por polling, não lido na hora.
      await expect.poll(() => page.evaluate(() => location.hash), { timeout: 5000 }).toBe(canonico);
      expect((await paginaAtiva(page)).landing).toBe(false);
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

test.describe('CTAs e comércio (PR 02 do handoff)', () => {
  test('nenhum <a href="#"> no documento', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('a[href="#"]').count()).toBe(0);
  });

  test('loja desligada: nada de compra visível e deep link cai na home', async ({ page }) => {
    await entrar(page);
    await page.goto('/#marketplace', { waitUntil: 'domcontentloaded' });
    // Sem resposta do banco a loja é considerada desligada (falha fechada).
    await expect(page.locator('#page-search')).toHaveClass(/\bon\b/, { timeout: 5000 });
    for (const sel of ['#page-marketplace', '#page-suppliers', '#page-pedidos', '#cartOverlay', '.nav-tab[data-loja]']) {
      const el = page.locator(sel).first();
      if (await el.count()) await expect(el).toBeHidden();
    }
    // Sem "em breve"/"manutenção" visível no app.
    const texto = await page.locator('#appContainer').innerText();
    expect(texto).not.toMatch(/em manutenção|Seção em desenvolvimento/i);
  });

  test('loja ligada (interruptor `pagamentos`): Loja e carrinho voltam', async ({ page }) => {
    await entrar(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.ERV_INTERRUPTORES = { pagamentos: true }; applyLojaState(true); });
    expect(await page.evaluate(() => document.documentElement.classList.contains('loja-on'))).toBe(true);
    await page.evaluate(() => goPage('marketplace'));
    await expect(page.locator('#page-marketplace')).toHaveClass(/\bon\b/);
    await expect(page.locator('#page-marketplace')).toBeVisible();
  });

  test('loja desligada confirmada: blocos de comércio saem do DOM', async ({ page }) => {
    await entrar(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.ERV_INTERRUPTORES = { pagamentos: false }; applyLojaState(true); });
    expect(await page.locator('[data-loja]').count()).toBe(0);
    expect(await page.locator('#cartOverlay').count()).toBe(0);
  });

  test('home tem o bloco "Avise-me" da loja com formulário real', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const form = page.locator('#lp-loja form');
    await expect(form).toBeAttached();
    await expect(form.locator('input[type="email"]')).toBeAttached();
    await expect(form.locator('button[type="submit"]')).toBeAttached();
  });

  test('mapa mundi é um arquivo, não base64 inline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const src = await page.locator('#mundoMapImg').getAttribute('src');
    expect(src).toBe('/images/editorial/mapa-mundi.png');
    const r = await page.request.get(src);
    expect(r.ok()).toBeTruthy();
  });
});
