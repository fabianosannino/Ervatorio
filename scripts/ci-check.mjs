#!/usr/bin/env node
// ============================================================
// CI build-check — valida que os arquivos essenciais do site
// existem e que os JSON do projeto são parseáveis.
// Falha (exit 1) em qualquer problema: é um check bloqueante.
// ============================================================
import { readFileSync, existsSync } from 'node:fs';

const errors = [];

// Arquivos sem os quais o site não funciona.
const essentialFiles = [
  'index.html',
  'admin.html',
  'manifest.json',
  'sw.js',
  'js/nav-data.js',
  'js/herbs-data.js',
  'js/blends-data.js',
  'js/chas-data.js',
  'js/clube-data.js',
  'js/receitas-data.js',
  'js/ficha-resumo.js',
  'js/app.js',
  'js/config.js',
  'js/ervaria.js',
  'js/checkout.js',
  'js/fichas-data.js',
  'css/nav.css',
  'css/main.css',
  // SEO (Onda 5) — gerados por npm run prerender e commitados
  'robots.txt',
  'sitemap.xml',
  'erva/index.html',
  'lexico/index.html',
  'como-se-faz/index.html',
  'biblioteca/index.html',
];

for (const f of essentialFiles) {
  if (!existsSync(f)) errors.push(`arquivo essencial ausente: ${f}`);
}

// Todo JSON do repositório precisa ser válido.
const jsonFiles = [
  'manifest.json',
  'package.json',
  'supabase/fichas-ancora-import.json',
];

for (const f of jsonFiles) {
  if (!existsSync(f)) continue;
  try {
    JSON.parse(readFileSync(f, 'utf8'));
  } catch (e) {
    errors.push(`JSON inválido: ${f} — ${e.message}`);
  }
}

// vercel.json, se existir, precisa ser válido (headers/rewrites).
if (existsSync('vercel.json')) {
  try {
    JSON.parse(readFileSync('vercel.json', 'utf8'));
  } catch (e) {
    errors.push(`JSON inválido: vercel.json — ${e.message}`);
  }
}

// Guarda-corpo de segredos além do gitleaks: padrões que jamais
// podem aparecer em arquivos servidos ao navegador.
const forbiddenPatterns = [
  { re: /service_role['"]?\s*[:=]\s*['"]ey/i, desc: 'service_role key hardcoded' },
  { re: /sb_secret_[A-Za-z0-9]/, desc: 'Supabase secret key' },
  { re: /APP_USR-\d{6,}/, desc: 'Mercado Pago access token (produção)' },
];
const clientFiles = ['index.html', 'admin.html', 'ervaria-app.html', 'sw.js'];
import { readdirSync } from 'node:fs';
for (const f of [...clientFiles, ...readdirSync('js').map((n) => `js/${n}`)]) {
  if (!existsSync(f) || !/\.(html|js)$/.test(f)) continue;
  const content = readFileSync(f, 'utf8');
  for (const { re, desc } of forbiddenPatterns) {
    if (re.test(content)) errors.push(`segredo proibido em arquivo de cliente: ${f} (${desc})`);
  }
}

if (errors.length) {
  console.error('build-check FALHOU:');
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`build-check OK — ${essentialFiles.length} essenciais, JSON válidos, sem segredos em arquivos de cliente.`);
