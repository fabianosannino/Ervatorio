// ============================================================
// Receitas, blends prontos e tipos de chá como páginas estáticas (PR 10)
// ============================================================
// O que não pode regredir: /receitas/<id>/, /blends/<slug>/ e /chas/<id>/
// renderizam sem JavaScript, com o conteúdo real (ingredientes, passos,
// ervas ligadas às fichas), JSON-LD válido (Recipe/Article + Breadcrumb),
// CTA para o mesmo lugar no app e o aviso de saúde; os hubs listam tudo;
// o sitemap traz as URLs; no app, #chas/<id> abre o tipo pedido e trocar
// a aba troca o hash.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
});

async function jsonld(page) {
  const txt = await page.locator('script[type="application/ld+json"]').first().textContent();
  return JSON.parse(txt);
}

test.describe('Páginas estáticas de conteúdo (PR 10)', () => {
  test('/receitas/chai-brasileiro/: ingredientes, passos, ervas ligadas, Recipe JSON-LD e CTA', async ({ page }) => {
    await page.goto('/receitas/chai-brasileiro/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chai Brasileiro');
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Ingredientes' }) }).locator('li')).toHaveCount(7);
    await expect(page.locator('ol.passos li')).toHaveCount(5);
    // Gengibre e capim-limão têm ficha: viram links para /erva/.
    await expect(page.locator('a[href="/erva/gengibre/"]')).toHaveCount(1);
    await expect(page.locator('a[href="/erva/capim-limao/"]')).toHaveCount(1);
    await expect(page.locator('a.cta[href="/#receitas/chai-brasileiro"]')).toHaveCount(1);
    await expect(page.locator('.health')).toBeVisible();
    const ld = await jsonld(page);
    const recipe = ld['@graph'].find((x) => x['@type'] === 'Recipe');
    expect(recipe.name).toBe('Chai Brasileiro');
    expect(recipe.recipeIngredient.length).toBe(7);
    expect(recipe.recipeInstructions.length).toBe(5);
    expect(recipe.totalTime).toBe('PT15M');
    expect(ld['@graph'].some((x) => x['@type'] === 'BreadcrumbList')).toBe(true);
    // Nenhum emoji no conteúdo e nada de estilo inline.
    expect(await page.locator('main').textContent()).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(await page.locator('main [style]').count()).toBe(0);
  });

  test('/blends/infusao-do-silencio/: proporção, preparo e CTA para a intenção do «Encontre seu chá»', async ({ page }) => {
    await page.goto('/blends/infusao-do-silencio/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Infusão do Silêncio');
    await expect(page.locator('.tag')).toHaveText('Insônia');
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Ervas e proporção' }) }).locator('li')).toHaveCount(3);
    await expect(page.locator('a[href="/erva/camomila/"], a[href="/erva/maracuja/"], a[href="/erva/melissa/"]').first()).toBeVisible();
    await expect(page.locator('a.cta[href="/#encontrar/sono"]')).toHaveCount(1);
    const ld = await jsonld(page);
    expect(ld['@graph'].find((x) => x['@type'] === 'Recipe').recipeCategory).toBe('Blend de ervas');
    // O blend «default» também existe, com CTA para «Me ajuda a escolher».
    await page.goto('/blends/blend-equilibrante/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('a.cta[href="/#encontrar/explorar"]')).toHaveCount(1);
  });

  test('/chas/preto/: preparo, oxidação sem estilo inline, variedades e Article JSON-LD', async ({ page }) => {
    await page.goto('/chas/preto/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chá Preto');
    await expect(page.locator('meter.barra')).toHaveAttribute('value', /\d+/);
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Como preparar' }) })).toContainText(/Temperatura/);
    await expect(page.locator('section', { has: page.locator('h2', { hasText: 'Variedades' }) }).locator('li').first()).toBeVisible();
    await expect(page.locator('a.cta[href="/#chas/preto"]')).toHaveCount(1);
    expect(await page.locator('main [style]').count()).toBe(0);
    const ld = await jsonld(page);
    expect(ld['@graph'].find((x) => x['@type'] === 'Article').headline).toMatch(/Chá Preto/);
  });

  test('os hubs listam tudo e o sitemap traz as URLs novas', async ({ page }) => {
    await page.goto('/receitas/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('ul.lista a[href^="/receitas/"]')).toHaveCount(23);
    await page.goto('/blends/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('ul.lista a[href^="/blends/"]')).toHaveCount(12);
    await page.goto('/chas/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('ul.lista a[href^="/chas/"]')).toHaveCount(6);
    const xml = await (await page.request.get('/sitemap.xml')).text();
    for (const u of ['/receitas/', '/receitas/chai-brasileiro/', '/blends/', '/blends/infusao-do-silencio/', '/chas/', '/chas/preto/']) {
      expect(xml).toContain('https://ervatorio.com.br' + u + '<');
    }
  });

  test('no app, #chas/<id> abre o tipo pedido e trocar a aba troca o hash', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('erb_entered', '1'); localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false })); } catch (_) {} });
    await page.goto('/#chas/preto', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#page-chas')).toHaveClass(/\bon\b/, { timeout: 5000 });
    await expect(page.locator('#chaTabs .cha-tab.on')).toContainText('Chá Preto');
    await expect(page.locator('#chaDetail .cha-header-name')).toHaveText('Chá Preto');
    await page.locator('#chaTabs .cha-tab', { hasText: 'Chá Branco' }).click();
    await expect(page.locator('#chaDetail .cha-header-name')).toHaveText('Chá Branco');
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#chas/branco');
  });
});
