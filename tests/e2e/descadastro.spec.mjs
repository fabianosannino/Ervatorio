// ============================================================
// Descadastro da newsletter (link do e-mail)
// ============================================================
// O que não pode regredir: abrir a página NÃO descadastra ninguém — só
// o clique no botão chama a função, porque cliente de e-mail e antivírus
// abrem links sozinhos para varrer; o token vai no corpo de um POST;
// link ausente, truncado ou desconhecido dá aviso e o canal do
// encarregado, nunca um falso «pronto, você saiu»; quem já saiu vê texto
// diferente; a página não é indexável e traz o mesmo cabeçalho estático.
// ============================================================
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// Sorteado a cada execução, de propósito: a página não pode depender de
// um valor específico, e um UUID escrito à mão aqui é indistinguível de
// um segredo vazado — o `secret-scan` do CI (gitleaks, regra
// `generic-api-key`) reprovou exatamente isso. Segredo de verdade não
// entra no repositório; segredo de mentira também não, porque ensina a
// silenciar a varredura.
const TOKEN = randomUUID();

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net/, (r) => r.abort());
});

// Intercepta a função e devolve o que o teste pedir, contando chamadas.
async function interceptar(page, { status = 200, corpo = { ok: true, ja_estava_fora: false }, falhar = false } = {}) {
  const chamadas = [];
  await page.route('**/newsletter-unsubscribe', async (route) => {
    chamadas.push(route.request().postDataJSON());
    if (falhar) return route.abort();
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(corpo) });
  });
  return chamadas;
}

test.describe('Descadastro da newsletter', () => {
  test('abrir a página com token não descadastra: só o clique chama a função', async ({ page }) => {
    const chamadas = await interceptar(page);
    await page.goto('/descadastro.html?t=' + TOKEN, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#confirmar')).toBeVisible();
    for (const id of ['#pronto', '#semToken', '#falhou']) await expect(page.locator(id)).toBeHidden();
    // O varredor de link do e-mail abre a página: nada pode acontecer.
    await page.waitForTimeout(400);
    expect(chamadas).toEqual([]);

    await page.click('#btnSair');
    await expect(page.locator('#pronto')).toBeVisible();
    await expect(page.locator('#confirmar')).toBeHidden();
    expect(chamadas).toEqual([{ token: TOKEN }]);
    await expect(page.locator('#prontoTexto')).toHaveText('Pronto. Você saiu da lista.');
    await expect(page.locator('#pronto a[href="/pausa.html"]')).toBeVisible();
  });

  test('quem já tinha saído vê que nada mudou', async ({ page }) => {
    await interceptar(page, { corpo: { ok: true, ja_estava_fora: true } });
    await page.goto('/descadastro.html?t=' + TOKEN, { waitUntil: 'domcontentloaded' });
    await page.click('#btnSair');
    await expect(page.locator('#prontoTexto')).toHaveText(/já não estava na lista/);
  });

  test('sem token, token torto ou token desconhecido: aviso e canal do encarregado', async ({ page }) => {
    const chamadas = await interceptar(page, { status: 404, corpo: { error: 'Link de descadastro inválido.' } });
    // Sem token: nem chega a chamar.
    await page.goto('/descadastro.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#semToken')).toBeVisible();
    await expect(page.locator('#semToken a[href^="mailto:"]')).toBeVisible();
    expect(chamadas).toEqual([]);
    // Token torto: idem, o formato é conferido no cliente antes de sair.
    await page.goto('/descadastro.html?t=nao-e-uuid', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#semToken')).toBeVisible();
    expect(chamadas).toEqual([]);
    // Token bem formado mas desconhecido: a função responde 404 e a
    // página diz isso — em vez de mentir que a pessoa saiu.
    await page.goto('/descadastro.html?t=' + TOKEN, { waitUntil: 'domcontentloaded' });
    await page.click('#btnSair');
    await expect(page.locator('#semTokenTexto')).toHaveText(/não é válido ou já não existe/);
    await expect(page.locator('#pronto')).toBeHidden();
    expect(chamadas.length).toBe(1);
  });

  test('falha de rede: avisa, devolve o botão e oferece o canal', async ({ page }) => {
    await interceptar(page, { falhar: true });
    await page.goto('/descadastro.html?t=' + TOKEN, { waitUntil: 'domcontentloaded' });
    await page.click('#btnSair');
    await expect(page.locator('#falhou')).toBeVisible();
    await expect(page.locator('#falhou a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('#btnSair')).toBeEnabled();
    await expect(page.locator('#btnSair')).toHaveText('Confirmar minha saída');
  });

  test('não é indexável, não está no sitemap e tem o cabeçalho das estáticas', async ({ page }) => {
    await page.goto('/descadastro.html?t=' + TOKEN, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('nav.erv-nav')).toHaveCount(1);
    await expect(page.locator('footer.erv-footer')).toHaveCount(1);
    expect(await page.locator('main [style]').count()).toBe(0);
    const xml = await (await page.request.get('/sitemap.xml')).text();
    expect(xml).not.toContain('descadastro');
  });
});
