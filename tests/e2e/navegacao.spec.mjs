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
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co|unpkg\.com|cartocdn\.com/, (r) => r.abort());
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
    ['#chazerias',      'page-mundo',         '#onde-beber'],
    ['#onde-beber',     'page-mundo',         '#onde-beber'],
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
    ['#criarblend',     'page-search',        '#encontrar'],
    ['#quiz',           'page-quiz',          '#quiz'],
    ['#perfil',         'page-perfil',        '#perfil'],
    ['#ficha/guarana',  'page-ficha',         '#ficha/guarana'],
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

  // PR 07: «Onde beber» é a 4ª visão de Origens; o hash e a sub-navegação
  // acompanham a visão nos dois sentidos.
  test('#onde-beber abre Origens na visão «Onde beber»; trocar a visão troca o hash', async ({ page }) => {
    await entrar(page);
    await page.goto('/#onde-beber', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-mundo')).toHaveClass(/\bon\b/);
    await expect(page.locator('#mundoBeberView')).toBeVisible();
    await expect(page.locator('#mundoMapView')).toBeHidden();
    await expect(page.locator('#btnBeber')).toHaveClass(/\bon\b/);
    await expect(page.locator('#ervSubnav a[href="#onde-beber"]')).toHaveAttribute('aria-current', 'page');
    expect(await page.locator('#ervSubnav a[href="#origens"][aria-current]').count()).toBe(0);
    expect(await page.locator('#page-chazerias').count()).toBe(0);
    await page.click('#btnMapa');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#origens');
    await expect(page.locator('#ervSubnav a[href="#origens"]')).toHaveAttribute('aria-current', 'page');
    await page.click('#btnBeber');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#onde-beber');
  });

  // PR 07: o hub «Como preparar» tem seis cards, todos links de verdade.
  test('#como-preparar mostra seis cards <a>, sem emoji, com as páginas estáticas', async ({ page }) => {
    await entrar(page);
    await page.goto('/#como-preparar', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-ferramentas')).toHaveClass(/\bon\b/);
    const cards = page.locator('#page-ferramentas a.ferr-hub-card');
    await expect(cards).toHaveCount(6);
    expect(await page.locator('#page-ferramentas .ferr-hub-card:not(a)').count()).toBe(0);
    expect(await page.locator('#page-ferramentas [onclick]').count()).toBe(0);
    for (const txt of await cards.allTextContents()) expect(txt).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    await expect(page.locator('#page-ferramentas a[href="/como-se-faz/"]')).toHaveCount(1);
    await expect(page.locator('#page-ferramentas a[href="/lexico/"]')).toHaveCount(1);
    await expect(page.locator('#page-ferramentas a[href="/biblioteca/"]')).toHaveCount(1);
    // O aviso de que o monitor fica no aparelho (o idioma segue o navegador:
    // aqui pode ser EN, por isso não se compara o texto).
    await expect(page.locator('#page-ferramentas a[href="#ferramenta/cafeina"] .ferr-hub-nota')).toHaveCount(1);
    expect(await page.locator('#page-ferramentas a[href="#familias"]').count()).toBe(0);
    // O card da calculadora abre a ferramenta.
    await page.click('#page-ferramentas a[href="#ferramenta/infusao"]');
    await expect(page.locator('#page-ferramenta')).toHaveClass(/\bon\b/);
  });

  test('#encontrar/sono aplica a intenção na tela de intenções', async ({ page }) => {
    await entrar(page);
    await page.goto('/#encontrar/sono', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-search')).toHaveClass(/\bon\b/);
    // A intenção "sono" abre o fluxo já no passo 2 (PR 05).
    await expect(page.locator('#encPasso2')).toBeVisible({ timeout: 5000 });
    await expect.poll(() => page.evaluate(() => encState.intencao), { timeout: 5000 }).toBe('sono');
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

test.describe('cabeçalho único (PR 03 do handoff)', () => {
  test('desktop: três grupos, Loja ausente com a loja desligada, ícones com rótulo', async ({ page }) => {
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    const grupos = page.locator('#ervNavGroups .erv-nav-item');
    await expect(grupos).toHaveCount(3);
    await expect(grupos.nth(0)).toHaveText(/Encontre seu chá|Find your tea/);
    await expect(grupos.nth(1)).toHaveText(/Descobrir|Discover/);
    await expect(grupos.nth(2)).toHaveText(/Preparar|Brew/);
    // Grupo ativo anuncia aria-current junto com a classe.
    await expect(grupos.nth(1)).toHaveClass(/\bon\b/);
    await expect(grupos.nth(1)).toHaveAttribute('aria-current', 'page');
    // Sub-navegação do grupo Descobrir, com a página atual marcada.
    const sub = page.locator('#ervSubnav .erv-subnav-item');
    expect(await sub.count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator('#ervSubnav .erv-subnav-item[aria-current="page"]')).toHaveText(/Guia de Ervas|Herb Guide/);
    // Todo ícone tem rótulo acessível.
    for (const el of await page.locator('.erv-nav-icon, .erv-nav-burger').all()) {
      const label = (await el.getAttribute('aria-label')) || (await el.innerText());
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  test('loja ligada: o grupo Loja entra no menu', async ({ page }) => {
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.ERV_INTERRUPTORES = { pagamentos: true }; applyLojaState(true); });
    await expect(page.locator('#ervNavGroups .erv-nav-item')).toHaveCount(4);
    await expect(page.locator('#ervNavGroups .erv-nav-item[data-group="loja"]')).toBeVisible();
  });

  test('teclado: Tab chega ao menu e Enter navega', async ({ page }) => {
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await page.locator('#ervNavGroups .erv-nav-item[data-group="preparar"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#page-receitas')).toHaveClass(/\bon\b/);
    await expect(page.locator('#ervNavGroups .erv-nav-item[data-group="preparar"]')).toHaveAttribute('aria-current', 'page');
  });

  test('mobile: ☰ abre a folha, Esc fecha e devolve o foco', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-ervatorio')).toHaveClass(/\bon\b/);
    const burger = page.locator('.erv-nav-burger');
    await expect(burger).toBeVisible();
    await expect(page.locator('#ervNavGroups')).toBeHidden();
    await burger.focus();
    await page.keyboard.press('Enter');
    const sheet = page.locator('#ervMenuSheet');
    await expect(sheet).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    expect(await sheet.locator('.erv-sheet-group').count()).toBe(3);
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.className)).toContain('erv-nav-burger');
  });

  test('mobile: link da folha navega e fecha a folha', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 780 });
    await entrar(page);
    await page.goto('/#ervas', { waitUntil: 'domcontentloaded' });
    // O roteador inicial (300 ms após o load) chama goPage, que fecha a folha:
    // espera a tela abrir antes de mexer no menu.
    await expect(page.locator('#page-ervatorio')).toHaveClass(/\bon\b/);
    await page.locator('.erv-nav-burger').click();
    await page.locator('#ervMenuSheet .erv-sheet-cell', { hasText: /jornada|journey/i }).click();
    await expect(page.locator('#page-caminho')).toHaveClass(/\bon\b/);
    await expect(page.locator('#ervMenuSheet')).toHaveCount(0);
  });

  test('landing: cabeçalho com o mesmo vocabulário e chips de intenção', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const nav = page.locator('#landingPage nav.main-nav a');
    await expect(nav.nth(0)).toHaveAttribute('href', '#encontrar');
    await expect(nav.nth(1)).toHaveAttribute('href', '#ervas');
    await expect(nav.nth(2)).toHaveAttribute('href', '#receitas');
    expect(await page.locator('.hero-chips .hero-chip').count()).toBe(6);
    await page.locator('.hero-chips .hero-chip').first().click();
    await expect(page.locator('#page-search')).toHaveClass(/\bon\b/);
    await expect(page.locator('#encPasso2')).toBeVisible({ timeout: 5000 });
    await expect.poll(() => page.evaluate(() => encState.intencao)).toBe('sono');
  });
});
