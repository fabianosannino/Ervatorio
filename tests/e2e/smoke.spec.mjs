// ============================================================
// Smoke E2E — Onda 12 (backlog #98 parcial)
// ============================================================
// Cobre o que NÃO pode quebrar em nenhum deploy: shell do app,
// banner de consentimento (LGPD), páginas legais, Ervopédia
// estática (SEO da Onda 5) e sitemap/robots. Testes de checkout
// com pagamento ficam para quando houver sandbox no CI (segredos).
// Rodar: npm run test:e2e
// ============================================================
import { test, expect } from '@playwright/test';

test.describe('shell do app', () => {
  test('home carrega com título e hero', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ervatório/);
    // O documento contém o hero do app (imagem com data-responsive/alt).
    await expect(page.locator('#appHero img').first()).toBeAttached();
  });

  test('service worker manifest e config são válidos', async ({ page }) => {
    const manifest = await page.request.get('/manifest.json');
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).name).toContain('Ervatório');
  });
});

test.describe('consentimento (LGPD)', () => {
  test('banner aparece na primeira visita e a escolha persiste', async ({ page }) => {
    await page.goto('/');
    const banner = page.locator('#ervConsent');
    await expect(banner).toBeVisible();
    // Sem escolha: nada de consentimento salvo.
    expect(await page.evaluate(() => localStorage.getItem('erv_consent_v1'))).toBeNull();

    await page.locator('#ervCAccept').click();
    await expect(banner).toBeHidden();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('erv_consent_v1')));
    expect(saved.analytics).toBe(true);
    expect(saved.marketing).toBe(true);

    // Recarrega: banner não volta.
    await page.reload();
    await expect(page.locator('#ervConsent')).toBeHidden();
  });

  test('recusar não essenciais persiste negado', async ({ page }) => {
    await page.goto('/');
    await page.locator('#ervCReject').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('erv_consent_v1')));
    expect(saved.analytics).toBe(false);
    expect(saved.marketing).toBe(false);
  });
});

test.describe('páginas legais', () => {
  test('privacidade e termos acessíveis e completas', async ({ page }) => {
    await page.goto('/privacidade.html');
    await expect(page).toHaveTitle(/Privacidade/);
    await expect(page.getByRole('heading', { name: /direitos/i })).toBeVisible();

    await page.goto('/termos.html');
    await expect(page).toHaveTitle(/Termos/);
    await expect(page.getByText(/arrependimento/i).first()).toBeVisible();
  });
});

test.describe('SEO estático (Onda 5)', () => {
  test('hub Ervopédia lista as ervas', async ({ page }) => {
    await page.goto('/erva/');
    await expect(page).toHaveTitle(/Ervopédia/);
    // O seletor era `ul.hub`, e `class="hub"` não existe em HTML nenhum do
    // repositório — a lista virou `ul.ervo-grid#ervoGrid` e o teste ficou
    // para trás. Contava zero e falhava desde então, em `main` inclusive.
    const links = page.locator('ul.ervo-grid a');
    expect(await links.count()).toBeGreaterThanOrEqual(90);
  });

  test('página de erva tem conteúdo real e JSON-LD válido', async ({ page }) => {
    await page.goto('/erva/guarana/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Guaraná/);
    await expect(page.getByText(/Como preparar/)).toBeVisible();
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    const parsed = JSON.parse(ld);
    expect(JSON.stringify(parsed)).toContain('BreadcrumbList');
  });

  test('sitemap e robots publicados', async ({ page }) => {
    const sitemap = await page.request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('/erva/guarana/');

    const robots = await page.request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('Sitemap:');
  });
});

test.describe('acessibilidade básica (Onda 9)', () => {
  test('viewport permite zoom (sem maximum-scale)', async ({ page }) => {
    await page.goto('/');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).not.toContain('maximum-scale');
  });

  test('banner de consentimento é operável por teclado (foco + Enter)', async ({ page }) => {
    await page.goto('/');
    const accept = page.locator('#ervCAccept');
    await accept.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#ervConsent')).toBeHidden();
  });
});
