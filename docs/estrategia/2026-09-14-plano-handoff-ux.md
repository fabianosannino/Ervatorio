# Handoff de UX (Claude Design, 14/09) — avaliação e plano de implementação

**Fonte:** pacote `Avaliação Ervatório — UX e processos` (README + 6 protótipos
`.dc.html` + capturas). **Repositório-alvo:** este. **Branch desta rodada:**
`claude/awesome-ride-gugauv`.

Este documento diz **o que o handoff acertou, o que já estava feito, o que
decidimos diferente e em que ordem o resto entra**. As decisões estão
numeradas (D1…) para que um PR futuro possa citá-las em vez de reabri-las.

---

## 1. Avaliação do handoff

### O que ele acerta (e por que vale implementar)

| Achado | Confere no código? | Consequência |
|---|---|---|
| **18 itens de menu no mesmo nível** | Sim — `index.html` tem 18 `.nav-tab`, e a landing tem um segundo menu com outro vocabulário (`lp.nav.*`). | O menu descreve a arquitetura do `app.js`, não a pergunta de quem chega. |
| **Sete portas para «qual chá para mim?»** | Sim — Busca por intenção, hub Sabores, Roda dos Chás, Roda Funcional, Guia Sensorial, Quiz e Assistente de Blends, cada um com regra própria (`aplicarIntencao`, `buildWizard`, `renderRodaFuncional`, `initQuiz`). | Respostas inconsistentes; a restrição de segurança (gestante, hipertenso) é filtro opcional da Roda, não barreira de todo resultado. |
| **20 `href="#"` na landing** | Sim — contados hoje. Os dois CTAs do hero, «Entrar para o Clube», três «Ler história →», cinco links do rodapé. | Para quem chega, o site parece quebrado. Maior retorno pelo menor custo. |
| **Comércio meio-construído em produção** | Sim — Loja «em manutenção», Fornecedores «em desenvolvimento», carrinho e Meus pedidos no DOM com `payments_enabled = false`. | Duas vezes seguidas o site diz «ainda não». Gasta a confiança que as fichas constroem. |
| **Dado de saúde sem consentimento próprio** | Sim — `renderPerfil` grava «Condições de saúde» e «Restrições e alergias» (texto livre) no mesmo perfil, e `blend.wizard_obs_ph` convida a digitar «estou grávida» num campo livre. | LGPD art. 5º II / art. 11 I: consentimento específico, tabela isolada, fora do `localStorage` e do cache do SW. |
| **Vocabulário interno na interface** | Sim — «Vetor terapêutico», «Roda Funcional», «Ervopedia», «Caminho», «Ferramentas», «⚷ Entrar». | Rótulos que só quem construiu entende. |
| **Emoji como rótulo** | Sim — `rec.filter_*` (🍵 🧊 🍹…), níveis do Caminho (🌱 👑). | Fora da identidade (serifada, sóbria) e ruim para leitor de tela. |
| **Mapa Mundi com imagem inline** | Sim, e pior do que o handoff viu: é um PNG de **1,09 MB em base64 dentro do `index.html`** (linha 2284), o que faz o documento pesar 1,5 MB e entrar assim no precache do Service Worker. | Todo primeiro acesso baixa um mapa que só a aba Origens usa. |

### O que o handoff manda fazer e **já estava feito**

- **PR 01 («aplicar migrações pendentes»)**: conferido hoje na produção via
  Supabase. As quatro migrações (`rbac_por_capacidade`, `interruptores`,
  `indicacao_de_terceiro`, `pedido_por_eventos`) foram aplicadas em
  **17/08/2026** (versões `20260817155329`–`20260817155744`), e as Edge
  Functions `create-order`, `indicacao`, `admin-delete-user` e `admin-metrics`
  foram reimplantadas na mesma data. O trecho «A produção está atrás do
  repositório» do `CLAUDE.md` estava desatualizado e foi corrigido neste PR.
  - Fica um resto: `create-payment-preference` no ar ainda é a versão de
    27/07, sem `exigirLigado`. Não é bloqueio — o MP está congelado e
    `pagamentos` está desligado —, mas entra no reimplante da próxima função
    que tocar pagamento.
- **Interruptor de loja**: já existe. Chama-se `pagamentos` e **já projeta**
  `site_settings.payments_enabled` por trigger. Ver D3.

### Onde decidimos diferente do handoff

Ver §3. Em resumo: não criamos interruptor novo, não migramos para
`history.pushState` nesta rodada, e a «Roda Funcional» continua como página
própria até o fluxo «Encontre seu chá» existir de verdade (PR 05).

---

## 2. Ordem de implementação

O handoff propõe 11 PRs. A ordem é boa e a mantemos, com dois ajustes:
o PR 01 sai (já feito) e os PRs 02–04 entram **nesta rodada, num só PR com
três commits** (D2).

| # | Escopo | Estado | Onde |
|---|---|---|---|
| 01 | Migrações pendentes + redeploy | **Feito em 17/08** | — |
| 02 | CTAs mortos; flag única de comércio; mapa mundi em arquivo | **Nesta rodada** | commit «Etapa 1» |
| 04 | Renomeações `nav.*`; redirects de hash; `SEO_META`; copy sem emoji | **Nesta rodada** | commit «Etapa 2» |
| 03 | Cabeçalho único: 3 grupos + Loja condicional + ícones; menu mobile; sub-navegação por grupo; landing com o mesmo vocabulário e hero por intenção | **Nesta rodada (parcial)** — o app e a landing. As páginas estáticas (`/erva/*`, `/como-se-faz/*`, `/biblioteca/*`, `/lexico/*`, `pausa.html`, legais) ficam para o 03b, porque exigem mexer no gerador `scripts/prerender.mjs` e regenerar ~100 arquivos. | commit «Etapa 3» |
| 03b | Mesmo cabeçalho nas páginas estáticas (via `prerender.mjs`) | Próximo | `feat/unified-nav-static` |
| 05 | «Encontre seu chá» em 3 passos, motor único de recomendação, restrição como barreira | Aguarda o roteiro de teste com usuários (README §Fase 2 §04) | `feat/encontrar` |
| 06 | Ficha: resumo leigo, timer embutido, «Onde encontrar» (indicação), e-mail | Depois do 05 | `feat/ficha-actions` |
| 07 | Descobrir e Preparar como abas de verdade (fusão de renderizadores) | Parte já entra no 03 como sub-navegação; a fusão fica aqui | `feat/descobrir-preparar` |
| 08 | Meu Ervatório + `perfil_saude` (tabela própria, RLS, consentimento com timestamp) + Diário | Prioridade alta por LGPD; não depende do 05 | `feat/conta-e-consentimento` |
| 09 | `privacidade.html`: CNPJ/DPO, dado de saúde, base legal, retenção | Depende de decisão do dono (CNPJ/DPO) | `docs/privacy-update` |
| 10 | Páginas estáticas para receitas, blends, tipos de chá | Mês 2–3 | `feat/static-pages-recipes-blends` |
| 11 | Clube (lista de espera → pré-venda → Stripe) | Depois | `feat/clube-waitlist` → `feat/stripe-checkout` |

**Recomendação de ordem depois desta rodada:** 08 antes de 05. O dado de
saúde já está sendo coletado hoje sem consentimento próprio; o fluxo novo é
melhoria, o consentimento é obrigação.

---

## 3. Decisões registradas

**D1 — PR 01 não existe mais.** Verificado em produção em 14/09 (lista de
migrações e de funções do projeto `ejarqinmjlgbqzurctsf`). O `CLAUDE.md` foi
corrigido para não mandar ninguém procurar por uma pendência que fechou.

**D2 — Um PR, três commits.** A branch desta sessão é única e pré-definida
(`claude/awesome-ride-gugauv`). A regra «um PR = uma mudança» continua valendo
como norma; aqui a concessão é explícita: cada etapa é um commit com escopo
fechado e mensagem própria, revisável em separado. Reverter uma etapa é
reverter um commit.

**D3 — `loja_ativa` do handoff = interruptor `pagamentos` que já existe.**
O handoff pede um interruptor `loja_ativa` «que projeta `payments_enabled`».
É exatamente o que `pagamentos` já faz (migration `20260815230000`). Criar
outro seria ter duas verdades. No cliente há **uma** função, `lojaAtiva()`
(`js/app.js`), que lê `ERV_INTERRUPTORES.pagamentos` e cai para
`SITE_SETTINGS.payments_enabled`; **falha para desligado** — sem resposta do
banco, nada de compra aparece.

**D4 — «Nenhum elemento de compra no DOM» é feito em dois tempos.** O HTML
nasce com os blocos de comércio marcados `data-loja` e escondidos por CSS
(`html:not(.loja-on) [data-loja]{display:none}`). Quando o interruptor
responde: ligado → a classe `loja-on` entra e tudo aparece; desligado (ou
sem resposta) → os nós são **removidos** do DOM. O critério de aceite do
handoff («com flag OFF nenhum elemento de compra no DOM») vale depois do
boot; antes dele, nada é visível. Deep link para `#loja` com a flag
desligada cai na home com um aviso — o servidor já recusava (`exigirLigado`);
agora a tela não oferece o que ele recusa.

**D5 — O mapa mundi vira arquivo.** `images/editorial/mapa-mundi.png`
(2000×1208, 1,09 MB), referenciado por `src`, carregado com `loading="lazy"`.
O `index.html` cai de 1,5 MB para ~130 KB. Não entra no precache do SW; é
cacheado em runtime na primeira visita a Origens, como as demais imagens.

**D6 — Rotas continuam por hash nesta rodada; paths reais ficam para o 05.**
Migrar para `history.pushState` + rewrites no `vercel.json` muda o
comportamento do Service Worker (`OFFLINE_URL`, precache), do servidor de
testes e de todo link já compartilhado. O ganho de SEO é real mas só para
as telas que não têm página estática — e o PR 10 resolve isso pelo gerador,
que é o caminho já validado para `/erva/`. O que entra agora:
- hashes **canônicos novos** com o vocabulário do handoff (`#encontrar`,
  `#ervas`, `#origens`, `#onde-beber`, `#como-preparar`, `#criar-blend`,
  `#loja`, `#produtores`, `#estante`, `#jornada`, `#conta`);
- **mapa de aliases** dos hashes antigos para os novos (`#roda-funcional`
  fica, ver D8; `#ervatorio`, `#mundo`, `#chazerias`, `#ferramentas`,
  `#blends`, `#marketplace`, `#suppliers`, `#favs`, `#caminho`, `#search`,
  `#sabores`);
- `handleHash` **genérico**: qualquer `#<pagina>[/<slug>]` cujo
  `#page-<pagina>` exista abre a tela. Antes, `#chas`, `#mundo`, `#receitas`
  e `#jogo` escondiam a landing mas **não** abriam a página — bug latente que
  o mapa antigo mascarava.

**D7 — As âncoras da landing ganham prefixo `lp-`.** `#roda` e `#sabores`
eram ao mesmo tempo seção da landing e página do app; com o roteador
genérico a colisão viraria bug. `#lp-roda`, `#lp-sabores`, `#lp-clube`,
`#lp-mapa`, `#lp-colecoes`, `#lp-diario`. Os hashes antigos sem prefixo
continuam funcionando por alias (rolagem). Nenhum link externo aponta para
eles (conferido em `pausa.html`, legais, `/erva/`, `prerender.mjs`).

**D8 — A Roda Funcional continua página própria até o PR 05.** O handoff
funde Roda Funcional, Busca, Quiz e Assistente num fluxo de 3 passos com um
motor só. Isso é o PR 05 e depende do teste com usuários. Nesta rodada:
`#encontrar` abre a tela de intenções (a antiga Busca, que é o embrião do
passo 1), com `#encontrar/<intencao>` já aplicando a intenção — é o que os
chips do hero da landing chamam. A Roda Funcional fica no mesmo grupo,
rotulada «Roda funcional · modo avançado». Quando o 05 entrar, os dois
hashes convergem sem quebrar link.

**D9 — `#ficha/<slug>` não vira redirect para `/erva/<slug>/`.** A ficha do
app tem o que a estática não tem (bandeja de blend, favoritos, carrinho
quando houver). As duas coexistem: a estática para o buscador, a do app para
quem já está dentro. Unificar tema e cabeçalho é o 03b; unificar conteúdo é
o 06.

**D10 — Fontes de newsletter.** O bloco «Avise-me» da home manda
`source: "loja"`. O `CHECK` do banco e a Edge Function só aceitavam
`pausa|rodape|blog|checkout|admin`, e a função rebaixava fonte desconhecida
para `pausa` — o e-mail entraria, mas na etiqueta errada. Migration
`20260914120000_newsletter_sources_ux.sql` acrescenta `loja`, `clube`,
`ficha`, `receita`, `encontrar`; a função passa a aceitar as mesmas.
**Até o redeploy da função**, «loja» é gravado como «pausa» — degradação
segura, sem erro para o visitante.

**D11 — `clube_estado` não vira coluna de enum.** `interruptores.ligado` é
booleano de propósito. Quando o PR 11 entrar, os três estados do Clube
(`espera` / `pre` / `ativo`) saem de dois interruptores booleanos:
`assinatura` (já existe = ativo) e um `clube_pre_venda` novo em
`interruptores_conhecidos()`. Nenhum dos dois é criado agora.

**D12 — Idiomas visíveis: PT e EN.** `LANGS` ganha `visible`; o seletor
lista só os visíveis. ES/JA/DE/FR permanecem no código com todas as strings
(zero remoção), e as chaves novas desta rodada foram traduzidas nos seis
idiomas para não deixar buraco em quem já escolheu outro idioma.

**D13 — «Sabores» (hub) sai; `goPage('sabores')` cai em Guia de sabores.**
O hub tinha dois `div role="button"` e conteúdo nenhum. A página é removida
do HTML; o roteador manda `#sabores` para `#guia-sensorial`. A Roda dos Chás
(canvas de 3 anéis) continua acessível pelo grupo «Encontre seu chá».

**D14 — Fornecedores sai do menu e do DOM enquanto a loja está desligada.**
Entra no grupo Loja como «Nossos produtores» (o `renderSuppliers()` é
mantido). O link B2B «Para produtores e casas de chá» fica no rodapé apontando
para `mailto:`, até existir `/parceiros/`.

---

## 4. Como testar esta rodada

```
npm ci
npm run test:e2e            # smoke antigo + tests/e2e/navegacao.spec.mjs
npx html-validate index.html   # ler a saída: prefer-native-element deve sumir do nav
node scripts/ci-check.mjs
```

Manual (preview da Vercel):
1. `/` — nenhum link «morto»: cada CTA do hero e do rodapé leva a uma tela.
2. `/#roda-funcional`, `/#ervatorio`, `/#mundo`, `/#chazerias`,
   `/#ferramentas`, `/#blends`, `/#favs`, `/#caminho`, `/#marketplace` —
   todos abrem a tela certa com o rótulo novo.
3. Com `pagamentos` desligado (estado atual): nenhum «Loja», «Carrinho»,
   «Fornecedores», «Meus pedidos» na tela; o bloco «Avise-me» aparece na home.
4. No painel, ligar `pagamentos` (staging!) e recarregar: Loja entra no menu,
   carrinho e pedidos voltam. Desligar e recarregar: somem.
5. Teclado: Tab percorre o menu; Enter abre; no celular, ☰ abre a folha,
   Esc fecha e devolve o foco.

## 5. Rollback

Cada etapa é um commit; `git revert <sha>` desfaz uma sem tocar nas outras.
A migration `20260914120000` só **amplia** um `CHECK` — reverter é
reaplicar a lista antiga (documentado no próprio arquivo). Nenhuma tabela,
coluna ou policy é criada ou removida.
