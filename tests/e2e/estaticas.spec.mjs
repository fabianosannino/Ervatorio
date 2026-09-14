// ============================================================
// Cabeçalho único nas páginas estáticas (handoff, PR 03b)
// ============================================================
// O que não pode regredir: /erva, /lexico, /como-se-faz, /biblioteca,
// pausa.html e as legais têm o mesmo cabeçalho do app (três grupos, busca,
// estante, Meu Ervatório), com o grupo e a seção da página marcados por
// aria-current; sem Loja nem Diário (dependem de interruptor que a página
// estática não conhece — D23); a folha do celular abre, prende o foco,
// fecha no Esc e devolve o foco ao ☰; o rodapé é o comum; nenhum link
// morto (#page=search) e nenhum emoji nos CTAs.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
});

const PAGINAS = [
  { url: '/erva/guarana/', grupo: 'descobrir', secao: '/erva/' },
  { url: '/erva/', grupo: 'descobrir', secao: '/erva/' },
  { url: '/lexico/', grupo: 'preparar', secao: '/lexico/' },
  { url: '/como-se-faz/', grupo: 'preparar', secao: '/como-se-faz/' },
  { url: '/biblioteca/', grupo: 'preparar', secao: '/biblioteca/' },
  // PR 10: receitas, blends prontos e tipos de chá também têm gêmea estática.
  { url: '/receitas/', grupo: 'preparar', secao: '/receitas/' },
  { url: '/receitas/chai-brasileiro/', grupo: 'preparar', secao: '/receitas/' },
  { url: '/blends/', grupo: 'preparar', secao: '/blends/' },
  { url: '/blends/infusao-do-silencio/', grupo: 'preparar', secao: '/blends/' },
  { url: '/chas/', grupo: 'descobrir', secao: '/chas/' },
  { url: '/chas/preto/', grupo: 'descobrir', secao: '/chas/' },
];

test.describe('Cabeçalho único nas páginas estáticas (03b)', () => {
  for (const p of PAGINAS) {
    test(`${p.url} tem o cabeçalho, com «${p.grupo}» e ${p.secao} marcados`, async ({ page }) => {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      const nav = page.locator('nav.erv-nav');
      await expect(nav).toHaveCount(1);
      // Três grupos, sem Loja (D23).
      await expect(nav.locator('.erv-nav-groups .erv-nav-item')).toHaveCount(3);
      expect(await nav.locator('.erv-nav-item[data-group="loja"]').count()).toBe(0);
      await expect(nav.locator(`.erv-nav-item[data-group="${p.grupo}"]`)).toHaveAttribute('aria-current', 'page');
      await expect(nav.locator(`.erv-subnav-item[href="${p.secao}"]`)).toHaveAttribute('aria-current', 'page');
      // Busca, estante e Meu Ervatório apontam para o app.
      await expect(nav.locator('a[href="/#encontrar"]').first()).toBeVisible();
      await expect(nav.locator('a[href="/#estante"]')).toHaveCount(1);
      await expect(nav.locator('a[href="/#perfil"]')).toHaveCount(1);
      // Rodapé comum.
      await expect(page.locator('footer.erv-footer')).toHaveCount(1);
      await expect(page.locator('footer.erv-footer')).toContainText(/não substitui orientação médica/);
    });
  }

  test('a ficha aponta para rotas que existem e não usa emoji nos CTAs', async ({ page }) => {
    await page.goto('/erva/guarana/', { waitUntil: 'domcontentloaded' });
    expect(await page.locator('a[href="/#page=search"]').count()).toBe(0);
    await expect(page.locator('a.cta[href="/#ervas"]')).toHaveCount(1);
    const ctas = await page.locator('a.cta').allTextContents();
    for (const c of ctas) expect(c).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    // A sub-navegação de «Descobrir» leva à gêmea estática do Guia de Ervas.
    await expect(page.locator('.erv-subnav-item[href="/erva/"]')).toHaveText('Guia de Ervas');
  });

  test('«Preparar & criar» lista as páginas estáticas antes órfãs', async ({ page }) => {
    await page.goto('/lexico/', { waitUntil: 'domcontentloaded' });
    const sub = page.locator('.erv-subnav-item');
    await expect(sub.filter({ hasText: 'Como se faz' })).toHaveAttribute('href', '/como-se-faz/');
    await expect(sub.filter({ hasText: 'Léxico' })).toHaveAttribute('href', '/lexico/');
    await expect(sub.filter({ hasText: 'Biblioteca' })).toHaveAttribute('href', '/biblioteca/');
    await expect(sub.filter({ hasText: 'Receitas' })).toHaveAttribute('href', '/receitas/');
    await expect(sub.filter({ hasText: 'Blends prontos' })).toHaveAttribute('href', '/blends/');
  });

  for (const url of ['/pausa.html', '/privacidade.html', '/termos.html']) {
    test(`${url} (escrita à mão) recebe o mesmo cabeçalho pelos marcadores`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('nav.erv-nav')).toHaveCount(1);
      await expect(page.locator('nav.erv-nav .erv-nav-groups .erv-nav-item')).toHaveCount(3);
      expect(await page.locator('nav.erv-nav [aria-current="page"]').count()).toBe(0);
      await expect(page.locator('footer.erv-footer')).toHaveCount(1);
      expect(await page.locator('.topbar').count()).toBe(0);
    });
  }

  test('celular: ☰ abre a folha, Esc fecha e devolve o foco; sem Loja nem Diário', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/erva/guarana/', { waitUntil: 'domcontentloaded' });
    const burger = page.locator('.erv-nav-burger');
    await expect(burger).toBeVisible();
    const sheet = page.locator('#ervMenuSheet');
    await expect(sheet).toBeHidden();
    await burger.click();
    await expect(sheet).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet.locator('.erv-sheet-close')).toBeFocused();
    await expect(sheet.locator('.erv-sheet-group')).toHaveCount(3);
    expect(await sheet.locator('a[href*="loja"], a[href="/#diario"]').count()).toBe(0);
    await expect(sheet.locator('.erv-sheet-cell[href="/#estante"]')).toBeVisible();
    // Tab preso: do último link volta ao ✕.
    const links = sheet.locator('a[href]');
    await links.last().focus();
    await page.keyboard.press('Tab');
    await expect(sheet.locator('.erv-sheet-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(burger).toBeFocused();
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
  });
});
