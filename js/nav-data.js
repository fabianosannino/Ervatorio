// ============================================================
// Dados de navegação — um só cabeçalho para app e páginas estáticas (PR 03b)
// ============================================================
// Este arquivo é lido em dois lugares:
//   • no navegador, antes de js/app.js (renderNav, renderSubnav, a folha
//     do menu e o roteador por hash);
//   • em Node, por scripts/prerender.mjs, que gera o mesmo cabeçalho em
//     HTML puro para /erva/*, /lexico/*, /como-se-faz/*, /biblioteca/*,
//     pausa.html e as páginas legais.
// Por isso ele é um script clássico sem dependência nenhuma: só dados.
//
// Cada página de um grupo tem `id` (tela do app, `#page-<id>`) OU `href`
// (página estática, caminho real). `estatico` numa tela do app é a gêmea
// estática dela — nas páginas estáticas o link vai para lá, para o leitor
// não sair do mundo indexável sem querer. `flag` põe a página atrás de um
// interruptor (ver flagLigada em app.js); `loja` faz o mesmo para o grupo.
// Rótulos são chaves de js/i18n.js.
// ============================================================
var NAV_GROUPS = [
  { id:'encontrar', label:'nav.functional_wheel', sub:'nav.sub_find', home:'search', pages:[
      { id:'search',         label:'nav.functional_wheel' },
      { id:'roda-funcional', label:'nav.wheel_advanced' },
      { id:'roda',           label:'nav.tea_wheel' },
      { id:'quiz',           label:'nav.quiz' } ] },
  { id:'descobrir', label:'nav.discover', sub:'nav.sub_discover', home:'ervatorio', pages:[
      { id:'ervatorio',      label:'nav.encyclopedia', estatico:'/erva/' },
      { id:'ficha',          hidden:true },
      { id:'familias',       label:'nav.families' },
      { id:'familia',        hidden:true },
      { id:'chas',           label:'nav.traditional_teas', estatico:'/chas/' },
      { id:'mundo',          label:'nav.world_teas' },
      { id:'mundo', slug:'beber', label:'nav.teahouses' },
      { id:'guia-sensorial', label:'nav.flavor_guide' } ] },
  { id:'preparar', label:'nav.prepare', sub:'nav.sub_prepare', home:'receitas', pages:[
      { id:'receitas',       label:'nav.recipes', estatico:'/receitas/' },
      { id:'blends', slug:'manual',  label:'nav.blends' },
      { id:'blends', slug:'prontos', label:'nav.ready_blends', estatico:'/blends/' },
      { id:'blend',          hidden:true },
      { id:'ferramentas',    label:'nav.tools' },
      { id:'ferramenta',     hidden:true },
      // Páginas estáticas (sem tela no app): o link é o caminho real.
      { href:'/como-se-faz/', label:'nav.how_made' },
      { href:'/lexico/',      label:'nav.lexicon' },
      { href:'/biblioteca/',  label:'nav.library' } ] },
  { id:'loja', label:'nav.marketplace', sub:'nav.sub_shop', home:'marketplace', loja:true, pages:[
      { id:'marketplace',    label:'nav.marketplace' },
      { id:'suppliers',      label:'nav.suppliers' },
      { id:'pedidos',        label:'nav.orders' } ] },
  // Meu Ervatório não é item de texto no menu: é o botão da direita e a
  // grade da folha mobile. Continua sendo um grupo para a sub-navegação.
  { id:'conta', label:'nav.account', home:'favs', icone:true, pages:[
      { id:'favs',           label:'nav.favorites' },
      { id:'caminho',        label:'nav.path' },
      { id:'diario',         label:'nav.diary', flag:'diario' },
      { id:'jogo',           label:'nav.game' },
      { id:'perfil',         label:'nav.profile' },
      { id:'sobre',          label:'nav.about' } ] },
];

// Hashes canônicos das telas que têm nome próprio na URL (os demais usam
// o id): `#ervas` abre page-ervatorio, `#estante` abre page-favs…
var PAGE_HASH = {
  search:'encontrar', ervatorio:'ervas', mundo:'origens', 'mundo/beber':'onde-beber',
  ferramentas:'como-preparar', marketplace:'loja', suppliers:'produtores', favs:'estante', caminho:'jornada',
};
