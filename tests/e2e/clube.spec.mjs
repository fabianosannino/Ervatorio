// ============================================================
// Clube Ervatório — lista de espera (handoff, PR 11)
// ============================================================
// O que não pode regredir: #clube é tela do app (não o atalho para a
// seção da landing, que continua em #lp-clube); a tela é pública; os três
// planos aparecem sem preço enquanto não houver preço, e ligar o
// interruptor `assinatura` sozinho NÃO abre cobrança nenhuma; a captura
// manda o e-mail para newsletter-subscribe com source «clube»; nada de
// preço inventado, de emoji, de `style` inline ou de div clicável.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
  await page.addInitScript(() => {
    try {
      localStorage.setItem('erb_lang', 'pt');
      localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false }));
    } catch (_) {}
  });
});

async function abrirClube(page) {
  await page.goto('/#clube', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#page-clube')).toHaveClass(/\bon\b/, { timeout: 5000 });
  await expect(page.locator('.clube-h1')).toBeVisible();
}

test.describe('Clube — lista de espera', () => {
  test('#clube abre a tela, sem conta, e a seção da landing continua em #lp-clube', async ({ page }) => {
    // Sem `erb_entered`: a tela é pública, como o Guia e as fichas.
    await abrirClube(page);
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#clube');
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('landingPage')).display)).toBe('none');
    // O alias que sequestrava #clube saiu; a seção da landing segue existindo.
    expect(await page.evaluate(() => typeof LANDING_ANCHORS.clube)).toBe('undefined');
    await expect(page.locator('#lp-clube')).toHaveCount(1);
    // Rodapé do app leva à tela.
    await expect(page.locator('.erv-footer a[href="#clube"]')).toBeVisible();
  });

  test('estado «lista de espera»: três planos sem preço, captura presente, nada inventado', async ({ page }) => {
    await abrirClube(page);
    expect(await page.evaluate(() => clubeEstado())).toBe('espera');
    await expect(page.locator('.clube-badge')).toHaveText('Lista de espera');
    const planos = page.locator('.clube-plano');
    await expect(planos).toHaveCount(3);
    await expect(planos.locator('.clube-plano-preco')).toHaveText(['Preço em definição', 'Preço em definição', 'Preço em definição']);
    await expect(page.locator('.clube-plano.on .clube-plano-badge')).toHaveText('Mais escolhido');
    await expect(page.locator('.clube-tempo')).toHaveCount(5);
    await expect(page.locator('.clube-onde li')).toHaveCount(6);
    await expect(page.locator('.clube-faq-item')).toHaveCount(6);
    await expect(page.locator('#clubeCaptura')).toBeVisible();
    // Nenhum preço, nenhuma promessa de data, nenhum emoji.
    const texto = await page.locator('#page-clube').textContent();
    expect(texto).not.toMatch(/R\$/);
    expect(texto).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    // HTML nascido em JavaScript: sem div clicável e sem estilo inline.
    expect(await page.locator('#page-clube div[onclick], #page-clube span[onclick]').count()).toBe(0);
    expect(await page.locator('#page-clube [style]').count()).toBe(0);
  });

  test('ligar o interruptor `assinatura` sozinho não abre cobrança nenhuma', async ({ page }) => {
    await abrirClube(page);
    await page.evaluate(() => {
      window.ERV_INTERRUPTORES = Object.assign(window.ERV_INTERRUPTORES || {}, { assinatura: true, clube_pre_venda: true });
      renderClube();
    });
    // Sem preço em CLUBE_PLANOS, o estado continua «espera» — um botão de
    // assinar sem valor e sem cobrança seria o CTA morto que o PR 02 tirou.
    expect(await page.evaluate(() => clubeEstado())).toBe('espera');
    await expect(page.locator('.clube-badge')).toHaveText('Lista de espera');
    await expect(page.locator('#clubeCaptura')).toBeVisible();
    expect(await page.locator('#page-clube').textContent()).not.toMatch(/R\$/);
  });

  test('a captura manda o e-mail com source «clube» e o CTA do topo leva até ela', async ({ page }) => {
    let corpo = null;
    await page.route('**/newsletter-subscribe', async (route) => {
      corpo = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await abrirClube(page);
    // O CTA do hero é botão de verdade e devolve o foco ao campo.
    await page.click('.clube-hero-txt button');
    await expect(page.locator('#clubeEmail')).toBeFocused();
    await page.fill('#clubeEmail', 'ana@exemplo.com');
    await page.click('.clube-form button[type="submit"]');
    await expect(page.locator('#clubeCaptura [data-email-msg]')).toHaveText(/Anotado/);
    expect(corpo).toEqual({ email: 'ana@exemplo.com', source: 'clube', locale: 'pt' });
    await expect(page.locator('.clube-form')).toBeHidden();
  });
});
