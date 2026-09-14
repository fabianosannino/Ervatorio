// ============================================================
// Clube Ervatório — conteúdo, sem comportamento (PR 11 do handoff)
// ============================================================
// O texto editorial do Clube é PT, como o dos tipos de chá
// (js/chas-data.js) e o das receitas: a moldura da tela (títulos de
// seção, botões, formulário, estado) é que passa por js/i18n.js. Script
// clássico sem dependência — se um dia a página do Clube ganhar gêmea
// estática, o `prerender` lê este arquivo sem navegador.
//
// **Preço não mora aqui enquanto não houver preço.** `preco: null` nos
// três planos é o que segura os estados «pré-venda» e «ativo» em
// clubeEstado() — ver D37. No dia em que os valores existirem, eles
// entram aqui e a tela passa a oferecer o que o servidor consegue
// cobrar, não antes.
// ============================================================
var CLUBE_PLANOS = [
  {
    id: 'folha', nome: 'Folha', para: 'Para começar', preco: null, periodo: '',
    itens: [
      'A Pausa toda semana, por e-mail',
      'Estante ilimitada: ervas, blends e receitas salvos',
      'Aviso antecipado quando a Loja abrir',
    ],
  },
  {
    id: 'raiz', nome: 'Raiz', para: 'Para quem já tem ritmo', preco: null, periodo: 'mês', destaque: true,
    itens: [
      'Tudo do Folha',
      'O blend do mês, com o guia do ritual',
      'Desconto de membro na Loja e cupom em casas de chá parceiras',
    ],
  },
  {
    id: 'floresta', nome: 'Floresta', para: 'Para quem vive de chá', preco: null, periodo: 'ano',
    itens: [
      'Tudo do Raiz',
      'Uma vivência por ano, presencial',
      'Curadoria individual a partir do seu perfil sensorial',
    ],
  },
];

// Os cinco tempos da Pausa (pausa.html) viram as cinco entregas do Clube.
var CLUBE_TEMPOS = [
  { n: 'Escolha',  entrega: 'A recomendação do mês, pensada para a estação e para o seu momento.' },
  { n: 'Prepare',  entrega: 'Os ingredientes na sua casa, com desconto quando a Loja abrir.' },
  { n: 'Espere',   entrega: 'Um ritual guiado — o tempo da infusão como tempo seu.' },
  { n: 'Perceba',  entrega: 'O guia sensorial do blend do mês: o que procurar no aroma e no gole.' },
  { n: 'Registre', entrega: 'O que você sentiu vai para o Diário; a conversa, para a comunidade.' },
];

// Onde o Clube aparece quando abrir. É camada sobre o site, não uma aba.
var CLUBE_ONDE = [
  { onde: 'No resultado do «Encontre seu chá»', oque: 'O blend do mês entra entre as opções do seu momento.' },
  { onde: 'Na ficha da erva',                   oque: 'O desconto de membro aparece em «Onde encontrar».' },
  { onde: 'No mapa de casas de chá',            oque: 'O cupom das chazerias parceiras.' },
  { onde: 'Em Meu Ervatório',                   oque: 'A Pausa da semana e o histórico do que você recebeu.' },
  { onde: 'Nas receitas',                       oque: 'A receita do mês, com os ingredientes já somados.' },
  { onde: 'No rodapé e na home',                oque: 'Um convite discreto, sem banner piscando.' },
];

var CLUBE_FAQ = [
  { q: 'Quanto custa?',
    a: 'Ainda não há preço. Os três planos estão em definição e nada é cobrado de quem entra na lista.' },
  { q: 'Quando abre?',
    a: 'Não há data marcada. Quem está na lista é avisado por e-mail antes de todo mundo.' },
  { q: 'O que eu recebo agora?',
    a: 'A Pausa, uma carta por semana com uma erva, um preparo e um minuto para você — e o Guia de Preparo, pronto para imprimir.' },
  { q: 'Entrar na lista me compromete a alguma coisa?',
    a: 'Não. É só o seu e-mail, sem cobrança e sem compromisso, e você sai quando quiser.' },
  { q: 'O que vocês fazem com o meu e-mail?',
    a: 'Enviamos a Pausa e o aviso da abertura. Nada além disso, e nunca para terceiros — está na Política de Privacidade.' },
  { q: 'Já assino a Pausa. Preciso entrar de novo?',
    a: 'Não precisa: é a mesma lista. Reenviar o endereço não duplica nada nem reativa quem pediu para sair.' },
];
