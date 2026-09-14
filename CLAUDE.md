# Regras de Engenharia — Ervatório

## Fluxo de trabalho (obrigatório)
- **Nunca** commite direto na `main`. Sempre crie branch `feat|fix|chore/<slug>` e abra PR (draft).
- Um PR = uma mudança pequena e revisável. Não misture temas.
- Só faça merge com: CI verde, preview Vercel validado e critérios de aceite atendidos.
- Toda mudança de risco vai atrás de **feature flag** (padrão: desligada em prod).
- Todo PR descreve: objetivo, o que muda, como testar, e **plano de rollback**.

## Segurança de dados (Supabase / Postgres)
- **Toda** tabela nova nasce com RLS habilitado. Sem exceção.
- Toda policy de `UPDATE`/`INSERT` tem `WITH CHECK` explícito. Nunca deixe colunas de privilégio (`is_admin`) editáveis pelo próprio usuário.
- Views que expõem dados de usuário usam `WITH (security_invoker = true)` ou não são concedidas a `authenticated`/`anon`.
- Operações que exigem `service_role`, recálculo de preço, ou integração externa vão para Edge Function — nunca para o cliente.
- Autorização (admin vs. usuário) é validada **no servidor** (Edge Function/RLS), nunca só no JavaScript do cliente.
- Nota de nomenclatura: em `user_profiles`, a coluna `role` é o perfil de chá do usuário (iniciante, tea_master…) e É editável pelo dono; as colunas de privilégio são `is_admin` e `admin_capabilities`.
- **`is_admin` diz se ENTRA no painel; `admin_capabilities` diz o que FAZ** (migration `20260815220000`). São dois eixos, e juntá-los foi o erro original: quem despachava pedido recebia junto o poder de apagar a base de usuários.
  - O predicado das policies é `public.tem_capacidade('<cap>')`, que exige `is_admin` **e** a capacidade — revogar o acesso ao painel basta para tirar tudo.
  - Capacidade nova entra em `public.capacidades_conhecidas()`; o `CHECK` recusa o que não estiver lá, para que erro de digitação não vire capacidade fantasma.
  - `admin_capabilities` é coluna de privilégio: só `service_role` escreve (trigger `trg_protect_profile_privileges`). Sem isso ela seria o caminho aberto que `is_admin` deixou de ser.
  - A lista em `js/admin.js` é **UX**: esconde o que não adianta clicar. Se ela e o banco divergirem, **o banco vence**.
  - Mexeu em policy ou capacidade? Rode `supabase/tests/20260815_rbac_capacidade_test.sql` — ele aplica a migration de verdade num Postgres descartável e prova as recusas.

## Interruptores — o que liga e desliga sem deploy

- A tabela `interruptores` (migration `20260815230000`) guarda **só chaves de
  operação**: decisão comercial que o admin vira. Protecão **não** entra ali —
  mora em variável de ambiente, fora do alcance do painel. A régua: *se
  desligar é proteção → ambiente; se ligar é decisão comercial → painel.*
- **O servidor é quem recusa.** `payments_enabled` valia só no navegador:
  `js/checkout.js` lia `window.SITE_SETTINGS` e nenhuma Edge Function conferia
  — quem virasse a variável no devtools chamava `create-order` do mesmo jeito.
  Agora `create-order` e `create-payment-preference` chamam `exigirLigado`
  (`supabase/functions/_shared/interruptores.ts`), que **falha fechada**.
- `site_settings.payments_enabled` virou **projeção** mantida por trigger. Os
  cinco leitores em `js/` seguem funcionando; a verdade tem um dono só. Não
  escreva naquela coluna — escreva no interruptor.
- Interruptor novo entra em `public.interruptores_conhecidos()` **e** na lista
  `ADM_INTERRUPTORES` de `js/admin.js`. O `CHECK` recusa o que não estiver na
  primeira; a segunda é UX e cada entrada declara **o que para de acontecer ao
  desligar**.
- Mexeu em interruptor? Rode `supabase/tests/20260815_interruptores_test.sql`.

## O pedido é uma máquina de estados, não uma coluna

- **`orders.status` é projeção** mantida por gatilho (migration `20260816140000`).
  A verdade é `pedido_eventos`. **Nunca escreva `status`** — registre um fato.
- **`pedido_eventos` é append-only por gatilho**: o banco recusa `update` e
  `delete`. Corrigir um fato é **acrescentar** o que corrige.
- **O estado é a precedência entre os fatos, não o último a chegar.** É o que
  faz um `paid` atrasado do Mercado Pago **não** desfazer um `refunded` — a
  comparação antiga (`order.status === newStatus`) não pegava esse caso, porque
  os dois valores são diferentes.
- **A tela escreve pela função `registrar_fato_do_pedido`**, que confere
  `pedidos:escrever` por dentro. `js/admin-orders.js` fazia `update({status})`
  direto do navegador.
- **O privilégio de `update` em `orders` é por coluna, nominalmente.** Coluna
  nova que o admin edite pela tela **entra na lista da migration**, senão a tela
  quebra com «permission denied». Atenção: `REVOKE UPDATE (coluna)` **não**
  subtrai de um `GRANT UPDATE` de tabela inteira — são privilégios separados no
  Postgres, e foi assim que a primeira versão desta migration deixou a porta
  aberta sem dar erro.
- A régua existe em **dois lugares** — `estados_do_pedido()` no banco e
  `ESTADOS_DO_PEDIDO` em `supabase/functions/_shared/estado-do-pedido.ts`. O
  bloco 8 do teste compara.
- Mexeu nisso? Rode `supabase/tests/20260816_pedido_eventos_test.sql`.

## Indicação — o parceiro vende, nós encaminhamos

- **`modo_de_venda` diz quem vende** (migration `20260816120000`). `proprio` =
  nós vendemos e entregamos; `indicacao` = o parceiro vende na loja dele
  (Amazon, Mercado Livre), o dinheiro **não** passa por aqui e nós recebemos
  comissão. A diferença é estrutural porque no marketplace o CDC trata a cadeia
  como **solidária** — descobrir de qual tipo era o produto no meio de uma
  reclamação é tarde.
- A constraint é **bicondicional**: link sem indicação é tão errado quanto
  indicação sem link. Um produto próprio com `link_externo` teria dois caminhos
  de compra, e o comprador escolheria o que não gera pedido nosso.
- **`create-order` recusa produto de indicação.** A vitrine não mostra o botão
  de carrinho, mas isso é UX — o carrinho mora no `localStorage` e a função é
  alcançável por qualquer cliente HTTP. Aceitar seria cobrar por algo que não
  temos e não podemos cancelar.
- **A rota recebe o id do produto, nunca a URL.** Aceitar a URL na query faria
  um **redirecionador aberto**: link que começa no nosso domínio, com o nosso
  certificado, e termina onde o atacante quiser. O link sai do cadastro e ainda
  é conferido — em SQL (`link_de_indicacao_seguro`) e em TypeScript, pela mesma
  regra.
- **`cliques_de_indicacao` não guarda quem clicou.** Nem IP, nem hash, nem
  sessão. Para faturar o parceiro basta volume; identidade seria excesso.
  Programa de afiliados de **entrada** (alguém traz comprador para cá) é outra
  tabela, com prazo e visitante — juntar as duas produz uma que não responde
  nenhuma.
- **O card de indicação não mostra preço.** Não é diagramação: os programas de
  afiliado proíbem exibir preço que não venha da API deles em tempo real, e
  preço guardado envelhece. Muda no dia em que houver integração de preço.
- Mexeu nisso? Rode `supabase/tests/20260816_indicacao_test.sql`. A recusa da
  `create-order` é TypeScript e **não** tem teste automático — confira no
  staging.

## Segredos
- **Nunca** coloque `service_role`, tokens de API ou secrets em arquivos servidos ao navegador, no HTML, ou no repositório.
- Segredos vivem em Supabase Secrets / Vercel Environment Variables. A única chave pública aceitável é a `sb_publishable_...` (anon/publishable).
- Antes de commitar, rode varredura de segredos (gitleaks/trufflehog). O CI também roda.

## Migrations
- Toda mudança de schema é uma migration versionada e **idempotente** (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP ... IF EXISTS`), em `supabase/migrations/`.
- Teste a migration em um **Supabase branch (staging)** antes de aplicar em produção.
- Migrations nunca destroem dados sem backup verificado e passo de rollback documentado.

## Pagamentos — o Mercado Pago está congelado (17/08)

**O pagamento do Ervatório será Stripe. O MP não recebe mais desenvolvimento.**
Ver `docs/estrategia/2026-08-17-congelar-mercado-pago.md`.

O que isso quer dizer na prática:

- O código do MP **fica** — três funções e o módulo compartilhado. Não apague:
  remover é trabalho de horas cujo benefício é menos código para ler, e desfazer
  é reescrever.
- `payments_enabled` continua **desligado**, e é assim que fica.
- A dívida de assinatura HMAC está **encerrada como não será corrigida**. Não
  peça a ninguém para disparar «Simular notificação» no sandbox: o passo existia
  para descobrir a variante de assinatura do MP, e não haverá webhook do MP.
- Não proponha o MP como próximo passo. «Pronto, faltando só o teste de
  sandbox» é o estado que mantém um item em toda lista para sempre, cobrado de
  quem não vai fazê-lo.

Quando a Stripe entrar, o padrão a portar é o da Veridia — sem SDK:
`lib/cobranca/assinatura-do-evento.ts` (HMAC sobre `timestamp.payload`) e
`lib/loja/stripe.ts` (`fetch` form-encoded, `import "server-only"`).

O que continua valendo, com qualquer provedor:

- O total do pedido é **sempre** recalculado no servidor a partir do preço
  autoritativo do banco. Nunca confie em valor vindo do cliente.
- Toda mudança no fluxo de pagamento é testada em **sandbox** ponta-a-ponta
  antes de ir a produção.
- `pago` é escrito pelo **webhook**, nunca pela tela de sucesso.

## A produção alcançou o repositório (conferido em 14/09)

As quatro migrações que este arquivo dizia faltar — `20260815220000` (RBAC por
capacidade), `20260815230000` (interruptores), `20260816120000` (indicação) e
`20260816140000` (`pedido_eventos`) — **foram aplicadas em 17/08** e as Edge
Functions `create-order`, `indicacao`, `admin-delete-user` e `admin-metrics`
foram reimplantadas na mesma data. `tem_capacidade()` e `interruptores` existem
em produção.

O que ainda é de **27/07** no ar: `create-payment-preference`, `mp-webhook`,
`create-return`, `user-data-rights`, `calculate-shipping`. Só a primeira tem
diferença que importa (o `exigirLigado`), e o MP está congelado com
`pagamentos` desligado — reimplantar junto com a próxima função que tocar
pagamento.

## O handoff de UX (14/09) e o que decidimos sobre ele

Ver `docs/estrategia/2026-09-14-plano-handoff-ux.md`: avaliação, ordem dos PRs
e as decisões D1–D14. As que mais mudam o jeito de trabalhar aqui:

- **`loja_ativa` é o interruptor `pagamentos`.** No cliente, **só**
  `lojaAtiva()` (`js/app.js`) decide o que aparece; falha para desligado.
  Bloco de comércio novo no HTML leva `data-loja` — com a loja desligada ele
  é removido do DOM no boot.
- **Rotas continuam por hash.** `handleHash` é genérico (`#<pagina>[/<slug>]`)
  e tem um mapa de aliases para os hashes antigos. Tela nova = `id="page-x"`
  no HTML e, se tiver nome novo, uma linha no mapa. Seção da landing usa
  prefixo `lp-` para não colidir com página do app.
- **A Roda Funcional continua página própria até o `feat/encontrar`.**
  `#encontrar` abre a tela de intenções; `#encontrar/<intencao>` já aplica a
  intenção.
- **O cabeçalho é um só, e a fonte dele é `js/nav-data.js`** (PR 03b).
  `NAV_GROUPS` e `PAGE_HASH` moram lá, como script clássico sem dependência,
  porque dois leitores usam o mesmo arquivo: `js/app.js` no navegador e
  `scripts/nav-estatica.mjs` em Node, que gera o cabeçalho em HTML puro para
  `/erva/*`, `/lexico/*`, `/como-se-faz/*`, `/biblioteca/*`, `pausa.html` e
  as legais. Entrada de grupo tem `id` (tela do app) **ou** `href` (página
  estática); `estatico` numa tela do app é a gêmea estática dela.
  - As regras CSS do cabeçalho, da folha e do rodapé vivem em `css/nav.css`,
    carregada **antes** de `main.css` no `index.html` e sozinha nas páginas
    estáticas, onde `.erv-estatico` traz os tokens do tema escuro só para
    esses componentes (`pausa.html` usa `--bg` para o fundo creme da página;
    tokens em `:root` quebrariam isso).
  - Mexeu no menu? `npm run prerender` regenera as ~190 páginas **e**
    preenche os marcadores (`<!-- erv-nav-css -->`, `<!-- erv-nav-estatica -->`,
    `<!-- erv-rodape-estatico -->`) em `pausa.html`, `privacidade.html` e
    `termos.html`. Marcador ausente é erro, não silêncio.
  - **Loja e Diário não aparecem nas páginas estáticas** (D23): dependem de
    interruptor, e sem o JavaScript do app não há como saber se estão ligados.
    A régua é falhar para desligado. Idioma, tema e «Entrar» também ficam de
    fora — as páginas estáticas são PT, tema claro fixo, sem Supabase.
  - `tests/e2e/estaticas.spec.mjs` confere tudo isso, incluindo a folha do
    celular (`js/nav-estatica.js`: foco no ✕, Tab preso, Esc devolve o foco).
- **Tela com visões que têm hash próprio** (PR 07): `#onde-beber` é
  `mundo/beber` — a 4ª visão de Origens, não uma página. `PAGE_HASH` aceita
  a chave `tela/slug` e `pageHash()` a consulta primeiro; a entrada em
  `NAV_GROUPS` é `{ id:'mundo', slug:'beber' }`. Quem troca a visão dentro
  da tela chama `history.replaceState` + `updateNavState`, para hash e
  sub-navegação não mentirem. Renderizador pesado (Leaflet) carrega só
  quando a visão abre.
- **HTML que nasce em JavaScript não passa pelo `html-validate`.** O hub de
  ferramentas tinha quatro `<div onclick>` e ninguém viu. Card clicável é
  `<a>` (ou `<button>`), e o teste E2E da tela conta `[onclick]` e exige
  zero.
- **A recomendação tem um motor só: `recomendar()`** (PR 05, D30). Intenção
  → categorias e tags de `HERBS` (`INTENCOES`); momento pontua, não filtra;
  restrição é a única barreira dura, pela mesma `ervaContraindicada` do
  Perfil. Tela nova que recomende erva **chama essa função** — não
  reimplementa o filtro. A restrição da sessão vive em `encState`, nunca em
  `localStorage`; com conta e consentimento, o Perfil pré-marca
  (`encRestricoesDoPerfil`). O resultado tem hash compartilhável
  (`#encontrar/<intencao>/<momento>/<restricoes>`), e quem mexe no hash de
  dentro da tela passa por `encSincronizarHash`, que se recusa a agir com a
  landing por cima.
- **O Assistente de blends não existe mais** (D29): `BLEND_DB` é o blend
  sugerido por intenção; `#blends/assistente` e `#criarblend` caem em
  `#encontrar`.
- **A ficha é uma tela só, e o resumo dela nasce numa função só** (PR 06,
  D31–D34). `js/ficha-resumo.js` é script clássico de dados-e-funções puras
  lido pelo app (`renderFichaPage`, em `js/ervatorio-pages.js`) e pelo
  `prerender` (`/erva/<slug>/`): `fichaSecoes()` separa o que o schema 1.1
  mistura em `acoes_principais` (marcadores «Contraindicações:»,
  «Interações:», «Componentes ativos:»…) e `fichaResumo()` monta «para que
  serve · como preparar · quem deve evitar». Por isso `HERBS` mora em
  `js/herbs-data.js` — o gerador precisa dos mesmos `ef`/`avoid`/`tempo`.
  Ficha com `resumo: {para_que_serve, como_preparar, quem_deve_evitar}`
  escrito à mão vence o derivado. Não reimplemente a leitura dos
  marcadores em outro lugar; quando a migração de dados separar as seções
  de verdade, a função vira passagem direta.
  - `#ficha/<slug>` lê `FICHAS_ANCORA` primeiro e o Supabase só para slug
    fora do pacote; produtos (`slug_ficha`) e blends do banco chegam depois
    e só acrescentam à lateral. O overlay `renderFichaModal` não existe
    mais: `openFicha(slug)` navega.
  - «Onde encontrar» segue as regras de **Indicação** acima: parceiro só
    com o interruptor `indicacao` ligado (`mktIsVisible` falha para
    escondido), link pela rota `/indicacao?produto=<id>` e **sem preço**;
    «Comprar na Loja» só com `lojaAtiva()` e produto próprio. Sem nenhum
    dos dois, a ficha diz que ainda não tem parceiro — nunca «em breve».
  - O e-mail da ficha é `subscribeEmail(form, 'ficha', …)` — o mesmo
    contrato do «Avise-me» da home, com outra `source`. A copy promete o
    que acontece (a Pausa semanal), não «receber esta ficha» (D32).
  - Caixa de aviso é fundo de token (`rgba(200,168,75,.1)`), nunca cor
    fixa escura: o tema claro remapeia `--cream2` para tinta escura e
    `#3a2a1a` + `--cream2` fica ilegível.
- **Conteúdo que vira página estática mora em script de dados** (PR 10,
  D36). `js/receitas-data.js`, `js/blends-data.js`, `js/chas-data.js`,
  `js/herbs-data.js`, `js/fichas-data.js`, `js/nav-data.js`: só dados, sem
  DOM, lidos pelo app e por `scripts/prerender.mjs`. Lista nova que precise
  de página indexável nasce assim — não dentro de `app.js`. As páginas
  geradas (`/receitas/<id>/`, `/blends/<slug>/`, `/chas/<id>/`) têm JSON-LD,
  CTA para o mesmo lugar no app (`/#receitas/<id>`, `/#encontrar/<intenção>`,
  `/#chas/<id>`), aviso de saúde, nenhum emoji e nenhum `style` inline
  (`html-validate` nas geradas). Entrada de `NAV_GROUPS` com gêmea estática
  leva `estatico`. Os blends de `admin_blends` não têm página: não estão no
  repositório.

## Dado de saúde — tabela própria, consentimento próprio (PR 08 do handoff)

- **Condição de saúde é dado sensível** (LGPD art. 5º II). Só se trata com
  consentimento **específico e destacado** para finalidade específica
  (art. 11 I). A finalidade aqui é **uma**: filtrar recomendações.
- **Mora em `perfil_saude`** (migration `20260915120000`), uma linha por
  usuário, RLS do dono, sem acesso a `anon`. **Não existe linha sem
  consentimento** (`consentimento_em NOT NULL`); retirar o consentimento é
  `DELETE`. Cai com a conta (CASCADE) e sai no export de `user-data-rights`.
- **Nunca no aparelho.** `perfilState` / `erb_perfil` guardam nome e
  preferências; saúde vive em `saudeState`, **só em memória**, carregada do
  servidor a cada sessão. O Service Worker não cacheia a API do Supabase
  (outra origem). Se algum dia alguém escrever saúde em `localStorage`, é
  regressão — o `conta.spec.mjs` confere.
- **Lista fechada, dois espelhos**: `condicoes_de_saude_conhecidas()` no
  banco (o `CHECK` recusa o resto) e `SAUDE_CONDICOES` em `js/app.js` (cada
  entrada diz quais `avoid` das fichas ela bloqueia). Condição nova entra nos
  dois. **Texto livre de saúde não entra** em lugar nenhum — o campo
  «observações» do assistente de blends foi trocado por chips de sessão.
- **Já houve vazamento**: `user_preferences.caffeine_pref` recebia a primeira
  «condição» do perfil. A migration limpou os valores conhecidos; a
  sincronização não escreve mais ali.
- **Tabela nova nasce com ALL para `anon` e `authenticated`** — o projeto
  Supabase tem `ALTER DEFAULT PRIVILEGES` que concede tudo em `public`. `GRANT`
  soma, não subtrai: a primeira migration de `perfil_saude` deu `UPDATE` por
  coluna e deixou o `UPDATE` de tabela inteira, `TRUNCATE`, `TRIGGER` e
  `REFERENCES` que já estavam lá (conferido em produção; corrigido em
  `20260915130000`). Em tabela nova, **sempre `REVOKE ALL FROM anon,
  authenticated` antes dos `GRANT`**, e o teste simula os default privileges
  (`ALTER DEFAULT PRIVILEGES ... GRANT ALL`) para pegar isso.
- Mexeu nisso? Rode `supabase/tests/20260915_perfil_saude_test.sql`.

## Diário de infusões — atrás de interruptor, sem texto livre (PR 08b do handoff)

- **`diario_infusoes`** (migration `20260916120000`): erva + horário +
  sensação, uma linha por infusão, RLS do dono, sem acesso a `anon`. Cai com
  a conta (CASCADE) e sai no export de `user-data-rights`.
- **O interruptor `diario` decide duas coisas**: se a tela aparece no menu
  (`flag:'diario'` em `NAV_GROUPS`, lida por `flagLigada()`) **e** se o banco
  aceita registro novo — a policy de `INSERT`/`UPDATE` chama
  `interruptor_ligado('diario')`. Desligar **não sequestra**: o dono continua
  lendo e apagando o que é dele. Nasce desligado; liga-se pelo painel.
- **`flagLigada()` falha para desligado** e não tem fallback: sem resposta
  do banco, a tela avisa «ainda não está disponível» em vez de prometer o que
  o servidor recusaria. Página nova atrás de interruptor = `flag:'<chave>'`
  na entrada de `NAV_GROUPS` + `if(id==='x') render…` no `goPage` + o
  re-render em `ervaria.loadInterruptores` quando a resposta chega.
- **Sensação é lista fechada, dois espelhos**: `sensacoes_conhecidas()` no
  banco e `DIARIO_SENSACOES` em `js/app.js`. **Não há campo de notas.** Um
  campo aberto num diário é o lugar onde «tomei porque estou grávida» entra
  sem consentimento — o mesmo motivo pelo qual o assistente de blends perdeu
  o «observações». Sensação percebida («relaxei», «dormi bem») não é
  condição de saúde. Se um dia houver notas livres, é outra decisão, com a
  minimização pensada antes.
- **`erva_id` é texto**: o id numérico de `HERBS` como string (a mesma
  convenção de `user_favorites.tea_id`) ou o slug da ficha editorial. O
  catálogo mora em js/, não numa tabela — por isso `erva_nome` vai junto,
  para o export ser legível sem o app. O `CHECK` confere o formato.
- **Só em memória** (`diarioState`), como a saúde: carregado do servidor a
  cada sessão, nada em `localStorage`. O `diario.spec.mjs` confere.
- **`#diario` é página do app**, não mais atalho para a seção da landing
  (`#lp-diario`, que os links da landing já usam). Saiu de
  `LANDING_ANCHORS` — a colisão era exatamente o que a D7 previu.
- **`tasting_journal` continua existindo**, com zero linhas e nenhum código
  que a escreva. Não foi reaproveitada: o modelo (nota, aroma, foto) é outro
  e os privilégios dela ainda são os de default (ALL para `anon`). Fica para
  uma limpeza própria.
- **Migration que estende `interruptores_conhecidos()` torna a migration
  antiga não reaplicável**: a `20260815230000` recria a função com a lista
  de quatro e o `CHECK` recusa a linha `diario`. Em produção as migrations
  rodam uma vez, em ordem, então não é cenário — mas o bloco de idempotência
  do teste reaplica **só** a migration nova, e o teste antigo dos
  interruptores continua contando quatro porque roda sozinho.
- Mexeu nisso? Rode `supabase/tests/20260916_diario_infusoes_test.sql`.

## Compliance
- Nenhum script de tracking (analytics, pixel) dispara antes do **consentimento** do usuário (LGPD / Consent Mode v2).
- Dados pessoais têm base legal, política de retenção e caminho de exclusão.
- **`privacidade.html` descreve o sistema de hoje, não o de ontem** (PR 09, D35).
  É o resumo público de `docs/compliance/retencao.md`; **dado novo = linha nos
  dois, no mesmo PR** que o cria. A política só afirma o que o código faz —
  o que falta (double opt-in, link de descadastro, operador de pagamento) é
  dito como pendente. Só CNPJ e encarregado ficam `[DEFINIR]`, por decisão
  do dono; `tests/e2e/legal.spec.mjs` conta os placeholders e recusa
  «Mercado Pago» nas páginas legais.

## Qualidade (Definition of Done)
- Acessibilidade: elementos interativos são `<button>`/`<a>` reais, operáveis por teclado; modais com foco/ESC/`aria-modal`; contraste AA.
  - **O menu do painel já foi doze `<div onclick>`** e a regra acima estava
    escrita aqui o tempo todo — o toque funcionava, então nada reclamava. Um
    `<div>` não recebe foco, não responde a Enter nem a Espaço, e o leitor de
    tela não o anuncia como controle. A varredura que acha isso é
    `npx html-validate admin.html` (regra `prefer-native-element`); ela roda no
    CI com `|| true`, então **é preciso ler a saída**, não só ver o passo verde.
  - **Reset de botão vive na folha, não em `style` inline.** O único item que
    já era `<button>` carregava o reset repetido no atributo; o décimo terceiro
    teria esquecido. Cuidado com a ordem: `border:0` zera as quatro bordas e a
    de ativo é redeclarada logo depois — inverter apaga o indicador. E use
    `font-family:inherit`, nunca `font:inherit`, que traz junto o `font-size`
    do agente de usuário.
  - **`aria-current` anda junto com a classe `active`.** A classe pinta; o
    atributo é o que o leitor de tela anuncia. Marcar só a classe deixa quem
    navega por teclado sem saber em que seção está.
- Performance: nenhuma mudança piora LCP/TBT/CLS; imagens otimizadas; scripts com `defer`.
- Observabilidade: erros logados; mudanças críticas emitem evento/metrificação.
- Nunca quebre o checkout, o login ou o webhook de pagamento sem teste que prove o contrário.

## Ordem de prioridade em conflito
Segurança de dados > Compliance legal > Integridade de pagamento > Estabilidade > Performance > Nova feature.
