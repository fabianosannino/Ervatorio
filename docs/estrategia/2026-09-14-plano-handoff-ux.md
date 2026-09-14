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
| 04 | Renomeações `nav.*`; redirects de hash; `SEO_META`; copy sem emoji | **Nesta rodada** | commit `feat(nav): rotas por hash genéricas…` (1º — os CTAs precisam dos hashes novos) |
| 02 | CTAs mortos; flag única de comércio; mapa mundi em arquivo | **Nesta rodada** | commit `fix(landing): CTAs mortos viram rotas…` (2º) |
| 03 | Cabeçalho único: 3 grupos + Loja condicional + ícones; menu mobile; sub-navegação por grupo; landing com o mesmo vocabulário e hero por intenção | **Nesta rodada (parcial)** — o app e a landing. As páginas estáticas (`/erva/*`, `/como-se-faz/*`, `/biblioteca/*`, `/lexico/*`, `pausa.html`, legais) ficam para o 03b, porque exigem mexer no gerador `scripts/prerender.mjs` e regenerar ~100 arquivos. | commit `feat(nav): cabeçalho único…` (3º) |
| 03b | Mesmo cabeçalho nas páginas estáticas (via `prerender.mjs`) | **Quarta rodada (16/09)** — ver D22–D23. | PR `feat/unified-nav-static` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 05 | «Encontre seu chá» em 3 passos, motor único de recomendação, restrição como barreira | **Sexta rodada (16/09)** — sem o teste com usuários, por decisão do dono (D27). Ver D27–D30. | PR `feat/encontrar` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 06 | Ficha: resumo leigo, timer embutido, «Onde encontrar» (indicação), e-mail | **Sétima rodada (16/09)** — ver D31–D34. | PR `feat/ficha-actions` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 07 | Descobrir e Preparar como abas de verdade (fusão de renderizadores) | **Quinta rodada (16/09)** — Origens absorve Onde beber; hub «Como preparar» com seis cards. Ver D24–D25 para o que fica. | PR `feat/descobrir-preparar` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 08 | Meu Ervatório + `perfil_saude` (tabela própria, RLS, consentimento com timestamp); cadastro reduzido; «Excluir meus dados» | **Segunda rodada (15/09)** — ver D15–D17. O Diário fica para o 08b. | PR `feat/conta-e-consentimento` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 08b | Diário de infusões (`diario_infusoes`, RLS dono, interruptor `diario`) | **Terceira rodada (16/09)** — ver D19–D21. | PR `feat/diario-infusoes` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 09 | `privacidade.html`: CNPJ/DPO, dado de saúde, base legal, retenção | **Oitava rodada (16/09)** — tudo, menos CNPJ e nome do encarregado, que continuam `[DEFINIR]` por decisão pendente do dono (D35). | PR `docs/privacy-update` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
| 10 | Páginas estáticas para receitas, blends, tipos de chá | **Nona rodada (16/09)** — ver D36. | PR `feat/static-pages-recipes-blends` (branch `claude/awesome-ride-gugauv`, reiniciada da `main`) |
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
reverter um commit. A ordem dos commits inverte a numeração do handoff (04
antes de 02) porque os CTAs da landing apontam para os hashes novos que só
existem depois do roteador.

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
responde: ligado → a classe `loja-on` entra e tudo aparece; **desligado,
confirmado pelo banco** → os nós são **removidos** do DOM; sem resposta (rede
fora, CDN bloqueado) → continuam só escondidos, porque remover e depois
receber «ligado» deixaria a loja sem tela até o próximo reload. O critério de
aceite do handoff («com flag OFF nenhum elemento de compra no DOM») vale
depois do boot; antes dele, nada é visível. Deep link para `#loja` com a flag
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

### Descobertas ao implementar (ficam para os próximos PRs)

- **Os selos da Jornada ainda usam emoji** (`BADGES` em `js/caminho.js`, ~25
  itens). Os níveis já são texto; os selos pedem ícones de linha
  (`svgIcon`) — entra no PR 08 junto com «Minha jornada».
- **`a11yDialog` não focava nem devolvia o foco em diálogos `position:fixed`**
  (`offsetParent` é null). Corrigido aqui, e vale para `checkoutOverlay` e
  `cartOverlay` também.
- **Os testes E2E dependiam da rede externa**: fontes do Google e o CDN do
  Supabase são `defer` e seguram o `DOMContentLoaded`; sem saída para a
  internet cada página levava 12 s. `tests/e2e/navegacao.spec.mjs` aborta
  essas requisições; o `smoke.spec.mjs` antigo não, e por isso é lento fora
  do CI. Vale alinhar no próximo PR de testes.
- **`html-validate index.html` acusava dois `<nav>` e dois `<footer>` com o
  mesmo nome** (landing + app no mesmo documento). Nomeados; some quando a
  landing virar a home (PR 03b/05).
- **(08b) `#diario` colidia com o atalho da landing.** `LANDING_ANCHORS`
  mapeava `diario → lp-diario`, então a página nova nunca abria pelo hash.
  A página venceu; a seção continua em `#lp-diario`. É a colisão que a D7
  previu, uma página depois.
- **(08b) Estender `interruptores_conhecidos()` numa migration nova deixa a
  antiga (`20260815230000`) não reaplicável**: ela recria a função com quatro
  chaves e o `CHECK` recusa a linha `diario`. Não é cenário de produção
  (migrations rodam uma vez, em ordem), mas o teste da 08b só reaplica a
  migration nova no bloco de idempotência, e o teste antigo continua valendo
  porque roda sozinho.
- **(08b) `tasting_journal` tem ALL para `anon`** — os default privileges de
  novo, numa tabela de antes das migrations versionadas. RLS segura (policies
  exigem `auth.uid()`), mas o privilégio não deveria existir. Limpeza à parte
  (D21).
- **(03b) A ficha estática tinha um CTA para `/#page=search`** — hash de
  antes do roteador genérico, que hoje não abre nada. Virou `/#ervas`. Os
  emojis dos CTAs e do aviso de saúde saíram junto, como já tinha saído do
  app no PR 04.
- **(03b) `aria-label` num `<div>` sem papel** é o que `html-validate`
  chama de `aria-label-misuse`. A sub-navegação do app tem isso em
  `index.html` (`#ervSubnav`); nas estáticas já nasceu sem. Vale tirar do
  app no próximo PR que tocar o cabeçalho.
- **(07) O hub de ferramentas era quatro `<div onclick>` com emoji** — o
  mesmo defeito que o CLAUDE.md descreve no menu do painel, num lugar que
  o `html-validate` não alcança porque o HTML nasce em JavaScript. Agora são
  `<a>`; o teste E2E conta `[onclick]` dentro da página e exige zero.
- **(06) `#ficha/<slug>` exigia o Supabase** — `renderFichaPage` só lia
  `admin_herb_fichas`, e as mesmas 96 fichas estão em `js/fichas-data.js`,
  de onde saem as páginas `/erva/`. Sem rede, «Ficha não encontrada»; com
  rede, uma ida ao banco para dado que já estava no aparelho. Agora o pacote
  local vem primeiro (D34). O modal da erva, por sua vez, abria a ficha num
  **overlay** (`renderFichaModal`), um segundo renderizador do mesmo JSON —
  e o botão dele estava quebrado desde sempre (`onclick="…("guarana")"`,
  aspas dentro de aspas). Saiu (D33).
- **(06) O schema 1.1 mistura seções em `acoes_principais`**: 92 das 96
  fichas trazem «Componentes ativos:», 40 «Indicações com evidência:», 36
  «Contraindicações:» e 2 «Interações:» como *itens* da lista, seguidos do
  conteúdo daquela seção; «Efeitos adversos: …» e «Dose máxima: …» idem. E
  o campo próprio `contraindicacoes` também recebeu isso em várias fichas.
  Não migramos os dados: `fichaSecoes()` lê os marcadores e devolve cada
  coisa na sua seção, nos dois renderizadores. A migração de dados que o
  handoff pede continua valendo; quando acontecer, a função vira
  passagem direta.
- **(06) Só 20 das 96 fichas dizem o tempo de infusão** (em `preparo`);
  o catálogo do app (`HERBS`, 42 ervas) cobre parte. Sem tempo, o botão é
  «Iniciar preparo» sem minutos e o timer nasce em 8 min, avisando que é
  sugestão e deixando ajustar. Só 1 ficha tem `fontes` — a seção «Fontes»
  aparece sempre, com «Fontes em revisão» nas outras, como o handoff pede.
- **(06) Não há dado que diga «não é para beber»** (copaíba, barbatimão,
  andiroba, jurema são uso tópico). O handoff quer esse aviso no topo; sem
  um campo no schema seria adivinhação por palavra-chave. Fica para a
  migração de dados; `recomendar()` não as sugere porque elas não estão em
  `HERBS`.
- **(06) Caixas de aviso com fundo fixo `#3a2a1a` e texto `--cream2`**
  (`.enc-aviso` do 05, `.perfil-rec-saude` do 08) ficavam ilegíveis no
  tema claro, que remapeia `--cream2` para tinta escura. Trocadas por
  fundo de token (`rgba(200,168,75,.1)`), junto com as da ficha.
- **(09) A política de julho descrevia um sistema que já não existe**: pedia
  telefone e cidade no cadastro (saíram no 08), não sabia do dado de saúde
  (08), do diário (08b) nem da indicação (17/08), dizia «Mercado Pago» num
  projeto que o congelou e falava de «diário de degustação»
  (`tasting_journal`, zero linhas). E `docs/compliance/retencao.md` tinha a
  mesma defasagem. Os dois foram alinhados ao código; a regra que fica é
  «dado novo = linha nos dois, no mesmo PR».
- **(09) Não há descadastro da Pausa por link** — só pelo canal do
  encarregado, manualmente (já documentado em `retencao.md`). A política
  diz isso em vez de prometer um link que não existe; o link com token
  continua na etapa 3 da newsletter.
- **(09) `termos.html` ainda tem três `[DEFINIR]`** (NF-e, canal de
  atendimento, foro) que não são de privacidade e ficaram fora deste PR;
  só a cláusula de pagamento mudou, para não contradizer a política.
- **(10) Três listas de conteúdo moravam dentro de arquivos de
  comportamento**: `RECEITAS` em `js/receitas.js`, `BLEND_DB` e
  `CHAS_DATA` em `js/app.js`. O gerador não tem como carregar esses
  arquivos em Node (tocam o DOM), então as listas saíram para
  `js/receitas-data.js`, `js/blends-data.js` e `js/chas-data.js` — o mesmo
  movimento de `HERBS` no 06. `INTENCOES` ficou onde está (é o motor) e o
  gerador lê só o mapa intenção → blend de `js/app.js`, com erro se não
  achar.
- **(10) Os blends do banco (`admin_blends`) não têm página estática.**
  Não estão no repositório; o gerador roda sem rede. `/blends/<slug>/`
  cobre os doze blends prontos por intenção (`BLEND_DB`), que são os que
  o «Encontre seu chá» sugere. Se a biblioteca do banco virar conteúdo
  editorial de verdade, o caminho é exportá-la para um script de dados,
  como as fichas.
- **(10) `#chas` não aceitava slug**: a página dos tipos de chá abria
  sempre no verde. Agora `#chas/<id>` abre o tipo pedido e trocar a aba
  troca o hash (`replaceState`), como as visões de Origens.
- **(07) A sub-navegação marcava a entrada sem slug junto com a de slug**
  (`!p.slug` era verdadeiro sempre). Não aparecia porque só Blends tinha
  duas entradas na mesma tela e as duas têm slug. Com Origens/Onde beber
  apareceria; corrigido na condição.
- **(05) O hash muda pelo fluxo, e mudar o hash com a landing por cima abre
  o app.** `history.replaceState` não dispara `hashchange`, mas o roteador
  roda 300 ms depois do boot e leria `#encontrar`. `encSincronizarHash` só
  age com a tela de fato aberta (`_currentPage` e landing escondida); o
  boot chama `encReset()`, que não toca no hash.
- **(05) `toggleFav` escreve «♥ Favorito» em todo `[data-fav-herb]`** — os
  cards do passo 3 não usam esse atributo e se re-renderizam depois do
  clique, para o rótulo vir do i18n (`enc.saved`).

**D15 — O Diário de infusões não entra no PR 08.** O critério de aceite do
handoff para o 08 é o consentimento («sem consentimento, campos desabilitados
e app 100% funcional; RLS testada»). O Diário é tabela nova, tela nova e flag
nova — outro PR (08b), com o próprio teste SQL.

**D16 — Meu Ervatório usa a sub-navegação, não a barra lateral.** O protótipo
mostra `/conta/` com nav lateral de 220 px. A sub-navegação do grupo «conta»
(Minha estante · Minha jornada · Jogo · Perfil · Sobre) já dá a mesma
hierarquia sem refazer o layout de cinco páginas. «Excluir meus dados»,
«Baixar meus dados» e «Sair» ficam na seção «Seus dados» do Perfil. A barra
lateral, se ainda fizer sentido, entra quando as páginas forem fundidas
(PR 07).

**D17 — Saúde é lista fechada; texto livre não entra.** O handoff pede
chips (`Gestante · Hipertensão · Uso de anticoagulante · Alergia a
asteráceas`). Acrescentamos `amamentando`, `crianca` e `diabetes` porque as
fichas já têm `avoid` correspondente (ou aviso, no caso do diabetes). O
campo «Restrições e alergias» (texto livre) e o «Observações» do assistente
de blends saem: texto livre com dado de saúde não filtra nada e não se
minimiza. Os «objetivos com os chás» (dormir melhor, foco…) ficam nas
preferências comuns: são intenções, as mesmas dos chips do hero, não
condições de saúde.

**D18 — A limpeza de `caffeine_pref` é destrutiva de propósito.** A coluna
guardava «Grávida»/«Hipertensão» sem base legal. A migration zera só os
valores da lista antiga; preferência de cafeína de verdade não está nela.
Não há rollback para isso — não se restaura dado sensível guardado
indevidamente.

**D19 — O diário não tem campo de notas.** O handoff modela
`diario_infusoes (…, sensacao text, nota text)`. A `nota` sai: um campo
aberto num diário é o caminho pelo qual dado de saúde entra sem
consentimento («tomei porque estou grávida»), e a D17 acabou de fechar esse
caminho no assistente de blends. O que fica é o que o handoff pede na
tela — erva + horário + sensação em chips — com a sensação numa lista
fechada (`relaxei`, `dormi_bem`, `energia`, `foco`, `digestao`,
`sem_efeito`, `nao_gostei`), espelhada no banco. Notas livres, se vierem,
são outra decisão.

**D20 — O interruptor `diario` é conferido pelo banco, não só pela tela.**
A régua do CLAUDE.md («o servidor é quem recusa») vale para funcionalidade
também: a policy de `INSERT`/`UPDATE` de `diario_infusoes` chama
`interruptor_ligado('diario')`. `SELECT` e `DELETE` não dependem dele —
desligar uma funcionalidade não pode sequestrar o que o usuário já
registrou. A chave se chama `diario` (o handoff diz `diario_ativo`) para
seguir o padrão das outras quatro, que são substantivos.

**D21 — `tasting_journal` não é reaproveitada.** Existe em produção, vazia,
sem código que a escreva, com colunas de outro modelo (nota, aroma, foto,
sabor) e com os privilégios de default (ALL para `anon`). Reaproveitar
seria herdar um esquema que ninguém desenhou para isto; o diário nasce em
tabela própria e a antiga fica para uma limpeza à parte (revogar `anon`,
depois decidir se some).

**D22 — O menu tem uma fonte só, e ela é dado, não código.** `NAV_GROUPS` e
`PAGE_HASH` saem de `js/app.js` para `js/nav-data.js`, um script clássico
sem dependência, lido pelo navegador (antes do `app.js`) e por
`scripts/nav-estatica.mjs` em Node — o mesmo truque que o `prerender` já
usava com `fichas-data.js`. Duplicar a lista no gerador seria o segundo
menu que o handoff mandou eliminar, só que em outro arquivo. As páginas
estáticas antes órfãs (`/como-se-faz/`, `/lexico/`, `/biblioteca/`) entram
no grupo «Preparar & criar» como entradas com `href`, e por isso aparecem
também na sub-navegação do app — a parte «páginas estáticas órfãs
linkadas» do PR 07 vem junto, porque não dava para linkar de um lado só.

**D23 — Nas páginas estáticas não há Loja nem Diário.** Os dois dependem
de interruptor; a página estática não carrega o app nem consulta o banco,
e a régua da D3 é falhar para desligado. Quando a Loja abrir (05/10), a
decisão volta: ou as páginas estáticas ganham uma leitura leve do
interruptor, ou continuam sem Loja e o menu do app é a porta. Idioma, tema
e «Entrar» também ficam de fora: as páginas são PT, tema claro fixo, sem
Supabase. O que aparece é o que funciona sem JavaScript — e a folha do
celular é o único pedaço com script (`js/nav-estatica.js`, 40 linhas).

**D24 — A aba Assistente do blend fica até o PR 05.** O handoff a remove
porque «virou `/encontrar`». O `/encontrar` de três passos ainda não existe
(espera o teste com usuários), e o assistente é hoje o único lugar que
cruza sintoma, hora e restrição de sessão com as fichas. Remover antes de
ter o substituto é tirar função sem dar outra. Sai no 05, quando o motor
único entrar.

**D25 — Famílias botânicas continuam entrada própria em Descobrir.** O
handoff as põe como «filtro/aba secundária do Guia de Ervas». O filtro do
Guia é reescrito no 05/06 (chips canônicos, «Sem cafeína»); enfiar
Famílias lá agora seria mexer no Guia duas vezes. O que muda já: Famílias
sai do hub «Como preparar», onde não fazia sentido, e fica só em Descobrir.

**D26 — «Onde beber» é uma visão de Origens, com hash próprio.** Fundir os
dois renderizadores numa página só (`initMundo` + `initChazerias` como 4ª
visão) sem perder o link `#onde-beber` exigiu que `pageHash` e o roteador
entendessem `tela/slug` com nome próprio: `PAGE_HASH['mundo/beber'] =
'onde-beber'`. Trocar a visão dentro da página troca o hash
(`replaceState`) e a sub-navegação; o `#chazerias` antigo segue valendo
por alias. O Leaflet e as chazerias só carregam quando a visão abre.

**D27 — O 05 entra sem o teste com usuários.** O handoff condicionava o
05 ao roteiro de teste (Fase 2 §04). O dono mandou seguir «na ordem
proposta», e a ordem passava pelo 05. O roteiro não some: vira validação
**depois** de no ar, com o fluxo real na mão das seis pessoas em vez de um
protótipo — o que se aprende aí volta como PR pequeno, não como bloqueio.
O que o teste ia decidir e foi decidido aqui, para poder ser revisto: os
rótulos dos chips (as strings `intent.*` que já existiam), a restrição em
quatro chips (gestante ou amamentando · hipertensão · anticoagulante · é
para criança) e o momento em quatro.

**D28 — A Roda de filtros sai da tela de intenções e vira modo avançado.**
A antiga Busca (roda de três anéis, chips em lista, grade) não foi apagada:
mora em `#encBusca`, escondida, e aparece quando o usuário digita no campo
de busca ou pede «Buscar por filtros e pela roda». `#roda` (Roda dos Chás)
e `#roda-funcional` continuam páginas próprias; o passo 1 aponta para a
segunda como «modo avançado», em vez de renderizar a roda no lugar, como o
protótipo sugeria — a Roda Funcional tem formulário e resultados próprios,
e embuti-la no passo 1 seria carregar duas telas numa.

**D29 — O Assistente de blends sai; `BLEND_DB` fica.** A aba tinha
sintoma, hora, sabor e restrição — o mesmo que o fluxo pergunta, com outros
nomes. Sai a aba, sai o `wizState`, saem `buildWizard` e `generateBlend`.
O que ele produzia (a receita por sintoma, `BLEND_DB`) vira o «Blend pronto
para o seu momento» do passo 3, escolhido pela intenção, e continua indo
para o construtor e para os favoritos. `#blends/assistente` e o
`#criarblend` legado caem em `#encontrar`. A bandeja («＋ Selecionar para
blend» nas fichas) muda para a aba Manual, que é onde ela desemboca.

**D30 — O motor é uma função pura, e o momento pontua, não filtra.**
`recomendar({intencao, momento, restricoes})` devolve as três ervas, o que
a restrição removeu e o blend. Intenção casa por categoria (3 pontos) e por
tag (2 por tag); momento soma 2 se a erva é daquele momento e 1 se é de
«qualquer hora» — um filtro duro zeraria o resultado em intenções com
poucas ervas noturnas. A restrição é a única barreira dura, pela mesma
`ervaContraindicada` do Perfil. «Cautela» marca erva com contraindicação
para algum grupo (gestantes, hipertensos, anticoagulantes, crianças,
lactantes) que o usuário **não** declarou; «Seguro», as demais. O teste
E2E compara o que está na tela com o que a função devolve.

**D31 — O resumo leigo é derivado, com uma porta para o texto escrito à mão.**
O handoff pede «para que serve» em duas frases sem farmacologia, e dá o
guaraná reescrito como exemplo. Reescrever 96 fichas à mão não cabe num
PR; inventar a tradução por regex seria pior. `fichaResumo(ficha, herb)`
monta o bloco a partir do que já existe: `ef`, `detail`, `temp`, `tempo`,
`dose`, `freq`, `safe` do catálogo do app quando a erva está lá, e os
campos de `preparo` e as contraindicações separadas quando não está. Uma
ficha pode trazer `resumo: { para_que_serve, como_preparar,
quem_deve_evitar }` e ele vence tudo — é assim que o texto leigo entra,
ficha a ficha, sem esperar o lote. A mesma função monta a ficha do app e a
estática (`scripts/prerender.mjs`), por isso `HERBS` saiu de `js/app.js`
para `js/herbs-data.js`, script de dados como `nav-data.js`.

**D32 — O e-mail da ficha assina a Pausa, e a copy diz isso.** O handoff
rotula «Receber esta ficha por e-mail», mas o único destino que existe é
`newsletter-subscribe` com `source: "ficha"` (D10) — nada envia a ficha.
Prometer o que não acontece é pior do que pedir menos: o bloco chama-se
«Fichas e receitas por e-mail» e diz «uma pausa por semana». Quando houver
envio da ficha (Edge Function + Resend), a copy muda junto.

**D33 — A ficha tem uma tela só.** `openFicha`/`openFichaAncora` navegam
para `#ficha/<slug>`; o overlay e o CSS dele saíram. Dois renderizadores
do mesmo JSON eram duas chances de divergir — e o resumo, o timer e o
«Onde encontrar» teriam de existir nos dois.

**D34 — A ficha carrega do pacote primeiro; o Supabase é fallback.**
`FICHAS_ANCORA` (js/fichas-data.js) é a mesma fonte das páginas `/erva/`
e do `prerender`; consultar `admin_herb_fichas` para o que já está no
aparelho custava uma ida ao banco e quebrava offline. O banco entra para
slug que não está no pacote e para o que só ele tem (produtos com
`slug_ficha`, blends que referenciam a erva), que chegam depois e só
acrescentam à lateral. Se a ficha for editada no painel sem regenerar o
pacote, o app e a estática mostram a versão do pacote — igual ao que já
acontecia nas `/erva/`.

**D35 — CNPJ e encarregado continuam `[DEFINIR]`; o resto não espera.**
O handoff pede «nenhum placeholder». Os dois campos que faltam são decisão
do dono (constituir a pessoa jurídica; nomear o encarregado) e não se
inventam. Tudo o que descreve o sistema — dado de saúde com art. 11 I,
restrições de sessão, diário, indicação, cadastro reduzido, retenção por
tipo, direitos pelo app, medição nomeada e desativada, loja fechada e
Mercado Pago fora — entrou, porque uma política defasada é pior do que uma
com dois campos marcados. Enquanto o encarregado não existe, o canal é
`contato@ervatorio.com.br`, que o rodapé já expõe. O botão «Abrir
preferências de cookies» da seção 5 carrega `js/consent.js` na própria
página (o script é autossuficiente) em vez de mandar para o app. A
política lista só o que o código faz; o que ainda não faz (double opt-in,
link de descadastro, operador de pagamento) está dito como pendente, não
prometido.

**D36 — Página estática só do que está no repositório, com o mesmo gerador
e a mesma moldura.** `/receitas/<id>/` (23), `/blends/<slug>/` (12, os
blends prontos por intenção) e `/chas/<id>/` (6) saem de
`scripts/prerender.mjs`, lendo os mesmos scripts de dados que o app carrega
— uma fonte, duas saídas, como as fichas. Cada página tem JSON-LD
(`Recipe` para receita e blend, `Article` para tipo de chá, sempre com
`BreadcrumbList`), as ervas ligadas às fichas em `/erva/`, o aviso de
saúde e um CTA para **o mesmo lugar no app**: `/#receitas/<id>`,
`/#encontrar/<intenção>` (o blend aparece no passo 3) e `/#chas/<id>`. O
slug do blend é o nome normalizado (`infusao-do-silencio`), estável e
legível; o gerador recusa slug repetido. Sem emoji e sem `style` inline
nas páginas geradas (a barra de oxidação é um `<meter>`). As entradas de
`NAV_GROUPS` ganham `estatico`, então o cabeçalho das páginas estáticas
aponta para as gêmeas — e o `sitemap.xml` passa de 192 para 236 URLs.

## 4. Como testar esta rodada

```
npm ci
npm run test:e2e            # smoke, navegacao, conta e diario (tests/e2e/)
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

Terceira rodada (08b), além do de cima:

```
psql … -f supabase/tests/20260916_diario_infusoes_test.sql   # 17 blocos, todos `t`
npx playwright test tests/e2e/diario.spec.mjs
```

6. Com `diario` desligado (estado inicial): `/#diario` mostra «ainda não
   está disponível»; «Diário» não aparece na sub-navegação de Meu Ervatório
   nem na folha do celular.
7. No painel (staging!), ligar `diario` e recarregar: «Diário» entra no
   menu; sem conta, a tela explica e oferece entrar; com conta, registrar
   Camomila com «Relaxei» cria a linha (conferir no SQL Editor:
   `select erva_id, erva_nome, sensacao from diario_infusoes`), trocar a
   sensação na lista grava só `sensacao`, apagar apaga.
8. Desligar `diario` com registros existentes: a tela some do menu e, pelo
   REST com o token do usuário, `POST /rest/v1/diario_infusoes` volta 42501;
   `GET` e `DELETE` continuam funcionando.
9. `user-data-rights` (após reimplantar): o export traz `diario_infusoes`.

Quarta rodada (03b), além do de cima:

```
npm run prerender                              # regenera as ~190 páginas e preenche os marcadores
npx playwright test tests/e2e/estaticas.spec.mjs
npx html-validate erva/guarana/index.html pausa.html privacidade.html termos.html   # sem aria-label-misuse
```

10. `/erva/guarana/`, `/lexico/`, `/como-se-faz/`, `/biblioteca/`,
    `/pausa.html`, `/privacidade.html`: o mesmo cabeçalho do app no topo,
    verde sobre a página creme; «Descobrir» marcado na erva, «Preparar &
    criar» nas outras três; sem Loja.
11. No celular, ☰ abre a folha, Esc fecha e o foco volta ao ☰.
12. No app, a sub-navegação de «Preparar & criar» mostra Como se faz,
    Léxico e Biblioteca, e cada um abre a página estática.

Quinta rodada (07), além do de cima:

13. `/#onde-beber` abre Origens já na visão «Onde beber» (mapa das casas
    de chá, carregado só ali); `/#chazerias` cai no mesmo lugar. Clicar
    «Mapa Global» muda o hash para `#origens` e a sub-navegação acompanha.
14. `/#como-preparar`: seis cards (Calculadora, Timer, Monitor de cafeína
    com o aviso «fica só neste aparelho», Como se faz, Léxico, Biblioteca),
    todos operáveis por Tab + Enter; nenhum «Famílias» ali.
15. Trocar o idioma para EN e voltar ao hub: os textos dos cards trocam.

Sexta rodada (05), além do de cima:

```
npx playwright test tests/e2e/encontrar.spec.mjs   # 6 cenários
```

16. `/#encontrar`: seis chips; escolher «Quero dormir melhor» abre o passo
    2 com `#encontrar/sono`; «À noite» + «Hipertensão» + «Ver minhas
    opções» abre o passo 3 com aviso, três cards (nenhum com «hipertensos»
    em `avoid`), selo Seguro/Cautela e o blend «Infusão do Silêncio»; o
    hash vira `#encontrar/sono/noite/hipertensao` e, colado noutra aba,
    abre direto no passo 3.
17. Com conta e consentimento de saúde: o passo 2 já vem com a restrição
    marcada. Sem consentimento, «Nenhuma».
18. Digitar «camomila» no campo abre a grade e a roda (modo avançado).
19. `/#blends`: duas abas; a bandeja está no Manual; `/#blends/assistente`
    e `/#criarblend` caem em `#encontrar`.
20. Chips do hero da landing e «Não sabe por onde começar?» continuam
    funcionando.
21. `/#ficha/guarana` **sem rede**: abre na hora, com «← Guia de Ervas»,
    o bloco-resumo (para que serve · 85°C · 5 min · quem deve evitar com
    «Hipertensão arterial não controlada»), os três botões, o aviso de
    saúde e «Detalhe técnico» recolhido. Abrir o detalhe: «Ações
    principais» não tem linha terminada em «:» nem contraindicação;
    «Contraindicações» e «Interações» têm as suas. «Fontes» lista cinco.
22. `/#ficha/andiroba`: «Fontes em revisão»; «Iniciar preparo» sem minutos
    abre o timer em 08:00 com a nota de tempo sugerido; +1 min → 09:00.
23. «Iniciar preparo · 5 min» no guaraná: contagem no lugar, pausa,
    recomeçar; ao zerar, toast «Pronto — sua pausa está servida.» O mesmo
    botão fecha o timer.
24. «♡ Salvar» vira «♥ Salvo» e entra em `erb_favs`; «Adicionar ao meu
    blend» vira «✓ No meu blend» e entra em `erb_tray`.
25. «Onde encontrar» sem parceiro diz isso e aponta para «Casas de chá no
    guia». Com o interruptor `indicacao` ligado e um produto
    `modo_de_venda = indicacao` casado com a erva, aparece «Parceiros de
    confiança…» e o link `…/indicacao?produto=<id>` (nunca a URL do
    parceiro, nunca preço). Com a loja ligada e produto próprio, «Comprar
    na Loja Ervatório».
26. E-mail na lateral: `POST newsletter-subscribe` com `source: "ficha"`;
    resposta «Anotado…»; o formulário some.
27. Abrir uma erva no Guia e clicar «Ver ficha completa»: vai para
    `#ficha/<slug>`, sem overlay. `/#ficha/27` (id antigo) vira
    `#ficha/guarana`.
28. `/#ficha/gengibre`: «Receitas com Gengibre» lista «Chai Brasileiro»;
    clicar abre a receita em `#receitas/chai-brasileiro`.
29. `/erva/guarana/` (estática): o mesmo resumo no topo, aviso de saúde
    antes de «Detalhe técnico», «Ações principais» limpas,
    «Contraindicações e cuidados» e «Interações» próprias, «Fontes».
    `/erva/copaiba/`: «Fontes em revisão».
30. Tema claro (☾): o aviso de saúde, as caixas de alerta e o aviso do
    passo 3 do Encontre seu chá continuam legíveis.
31. `/privacidade.html`: versão 1.1 de 14/09; só dois `[DEFINIR]` (seções
    1 e 2); nada de «Mercado Pago»; a seção 3 nomeia o dado de saúde com
    art. 11 I e finalidade única, as restrições de sessão, o diário sem
    texto livre, a indicação sem identidade e as três ferramentas de
    medição (desativadas); a seção 6 tem retenção por tipo; a seção 7
    diz onde ficam «Baixar meus dados» e «Excluir meus dados».
32. Na seção 5, «Abrir preferências de cookies» abre o banner na própria
    página, no modo de preferências.
33. `/termos.html` não cita mais o Mercado Pago; a cláusula aponta para a
    política.
34. `/receitas/chai-brasileiro/` sem JavaScript: ingredientes, passos
    numerados, «Ervas desta receita» com links para `/erva/gengibre/` e
    `/erva/capim-limao/`, aviso de saúde, «Abrir no Ervatório» →
    `/#receitas/chai-brasileiro`. JSON-LD `Recipe` com `totalTime: PT15M`.
35. `/blends/infusao-do-silencio/`: tag «Insônia», três ervas com
    proporção, passos, «O que esperar»; «Abrir no Ervatório» →
    `/#encontrar/sono`. `/blends/blend-equilibrante/` → `/#encontrar/explorar`.
36. `/chas/preto/`: oxidação como `<meter>`, preparo, sabores, variedades,
    história, harmonização; «Abrir no Ervatório» → `/#chas/preto`.
37. Hubs `/receitas/`, `/blends/`, `/chas/` com 23, 12 e 6 itens; o
    cabeçalho marca «Preparar & criar › Receitas / Blends prontos» e
    «Descobrir › Tipos de chá»; `sitemap.xml` com 236 URLs.
38. No app, `/#chas/preto` abre o chá preto; clicar em «Chá Branco» muda
    o hash para `#chas/branco`.

## 5. Rollback

Cada etapa é um commit; `git revert <sha>` desfaz uma sem tocar nas outras.
A migration `20260914120000` só **amplia** um `CHECK` — reverter é
reaplicar a lista antiga (documentado no próprio arquivo). Nenhuma tabela,
coluna ou policy é criada ou removida.

**08b.** Primeiro degrau: desligar o interruptor `diario` no painel — a tela
some e o banco recusa registro novo, sem deploy. Segundo: `git revert` do
commit. Terceiro (só com backup verificado, porque apaga registro de
usuário): o bloco ROLLBACK no cabeçalho de `20260916120000_diario_infusoes.sql`.

**03b.** `git revert` do commit e `npm run prerender` — o gerador antigo
reescreve as páginas sem o cabeçalho; os marcadores nas páginas escritas à
mão voltam vazios com o revert. Sem migration, sem função, sem dado.

**07.** `git revert` do commit e `npm run prerender` (a sub-navegação das
páginas estáticas volta a apontar para `#onde-beber` como página). Sem
migration, sem função, sem dado.

**05.** `git revert` do commit. Sem migration, sem função, sem dado; o
`localStorage` não muda de formato (`erb_tray`, `erb_recipes`, `erb_favs`
continuam iguais).

**06.** `git revert` do commit e `npm run prerender` (as `/erva/` voltam à
ordem antiga). Sem migration, sem função, sem dado novo: o e-mail da ficha
usa a `source: "ficha"` que a migration `20260914120000` já aceita. O
`localStorage` não muda de formato.

**09.** `git revert` do commit. Só texto (duas páginas HTML, um documento
interno) e um teste; sem migration, sem função, sem dado.

**10.** `git revert` do commit e `npm run prerender` (as pastas `receitas/`,
`blends/` e `chas/` somem do commit revertido; o sitemap volta a 192 URLs).
Sem migration, sem função, sem dado.
