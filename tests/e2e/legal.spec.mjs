// ============================================================
// Páginas legais (handoff, PR 09)
// ============================================================
// O que não pode regredir: privacidade.html descreve o sistema de hoje —
// dado de saúde com art. 11 I, diário, indicação, cadastro só com nome e
// e-mail, medição nomeada — sem Mercado Pago e **sem nenhum [DEFINIR]**:
// controlador e encarregado foram preenchidos em 14/09 (v1.2), e um
// placeholder de volta numa página legal publicada é regressão; o botão
// de cookies abre o banner na própria página; termos.html identifica o
// operador, o regime fiscal, o canal de atendimento e o foro, e não
// contradiz a política sobre pagamento.
// ============================================================
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|supabase\.co/, (r) => r.abort());
});

test.describe('Política de Privacidade', () => {
  test('v1.2 descreve o sistema de hoje, sem Mercado Pago e sem nenhum [DEFINIR]', async ({ page }) => {
    await page.goto('/privacidade.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.updated')).toContainText('Versão 1.2');
    const main = page.locator('main');
    const texto = await main.textContent();
    expect(texto).not.toMatch(/Mercado ?Pago/i);
    // Controlador e encarregado identificados; nenhum campo pendente.
    expect(texto).not.toMatch(/\[DEFINIR/);
    await expect(page.locator('#controlador + p')).toContainText('CNPJ 20.507.723/0001-99');
    await expect(page.locator('#encarregado + p a[href="mailto:fsannino@collabz.com.br"]')).toHaveCount(1);
    // O que o código faz, nomeado.
    for (const re of [/art\. 11, I/, /Saúde e restrições/, /Diário de infusões/, /Restrições informadas sem conta/, /Indicação de parceiros/, /Google Tag Manager/, /Microsoft Clarity/, /Meta Pixel/, /Baixar meus dados/, /Excluir meus dados/, /24 meses/, /A loja está fechada/]) {
      expect(texto).toMatch(re);
    }
    // Cadastro pede nome e e-mail — telefone e cidade só como legado.
    expect(texto).not.toMatch(/telefone, cidade\/estado\/país/);
    expect(texto).toMatch(/Contas criadas antes de 15 de setembro de 2026/);
    // Mesmo cabeçalho estático das demais páginas (03b) continua.
    await expect(page.locator('nav.erv-nav')).toHaveCount(1);
  });

  test('«Abrir preferências de cookies» abre o banner na própria página', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('erv_consent_v1', JSON.stringify({ analytics: false, marketing: false, ts: '2026-09-01T00:00:00Z' })); } catch (_) {}
    });
    await page.goto('/privacidade.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#ervConsent')).toHaveCount(0);
    await page.click('#cookies ~ p button.cta');
    const banner = page.locator('#ervConsent');
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/prefs/);
    await expect(banner.locator('#ervCatMarketing')).toBeVisible();
  });
});

test.describe('Termos de Uso', () => {
  test('identifica operador, regime fiscal, atendimento e foro; aponta para a política no pagamento', async ({ page }) => {
    await page.goto('/termos.html', { waitUntil: 'domcontentloaded' });
    const texto = await page.locator('main').textContent();
    expect(texto).not.toMatch(/Mercado ?Pago/i);
    expect(texto).not.toMatch(/\[DEFINIR/);
    await expect(page.locator('main a[href="/privacidade.html#compartilhamento"]')).toHaveCount(1);
    await expect(page.locator('.updated')).toContainText('Versão 1.2');
    expect(texto).toMatch(/CNPJ 20\.507\.723\/0001-99/);
    expect(texto).toMatch(/regime normal/);
    expect(texto).toMatch(/comarca de São Paulo\/SP/);
    await expect(page.locator('main a[href="https://wa.me/5511989991358"]')).toHaveCount(1);
  });
});
