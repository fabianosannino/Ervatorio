// ════════════════════════════════════════
// RECEITAS — Ervatório
// ════════════════════════════════════════

const RECEITAS = [
  // ── QUENTES ──
  {
    id:'chai-brasileiro',
    nome:'Chai Brasileiro',
    subtitulo:'O conforto do chai com ervas nacionais',
    categoria:'quente', nivel:'fácil',
    tempo_prep:'5 min', tempo_total:'15 min', porcoes:'2 xícaras',
    ervas_ids:[5,17],
    ingredientes:['3 rodelas de gengibre fresco','1 col. sopa de capim-limão seco','1 pau de canela','3 cravos-da-índia','400ml de água','100ml de leite de coco (opcional)','Mel a gosto'],
    modo:['Ferva a água com gengibre, canela e cravo por 5 minutos.','Adicione o capim-limão e desligue o fogo.','Infuse tampado por 5 minutos.','Coe e adicione o leite de coco e o mel.','Sirva em caneca grande e aproveite o aroma.'],
    dica:'Substitua o capim-limão por erva-cidreira para uma versão mais floral.',
    img:'gengibre', tags:['quentinho','inverno','especiarias','conforto'],
    beneficios:'Anti-inflamatório, digestivo, aquecedor',
    pairing:'Biscoito de aveia ou pão de especiarias'
  },
  {
    id:'golden-tea',
    nome:'Golden Tea',
    subtitulo:'Leite dourado em versão chá — anti-inflamatório poderoso',
    categoria:'quente', nivel:'fácil',
    tempo_prep:'3 min', tempo_total:'10 min', porcoes:'1 xícara',
    ervas_ids:[5],
    ingredientes:['1 col. chá de cúrcuma em pó','2 rodelas de gengibre fresco','1 pitada de pimenta-do-reino','1 pitada de canela em pó','200ml de leite vegetal','Mel ou açúcar de coco a gosto'],
    modo:['Aqueça o leite vegetal sem ferver.','Adicione cúrcuma, gengibre, pimenta e canela.','Mexa bem com batedor até incorporar.','Coe o gengibre e adoce a gosto.','Sirva quente em caneca aquecida.'],
    dica:'A pimenta-do-reino é essencial — aumenta a biodisponibilidade da curcumina em 2000%.',
    img:'curcuma', tags:['anti-inflamatório','imunidade','noturno'],
    beneficios:'Anti-inflamatório, antioxidante, digestivo',
    pairing:'Perfeito antes de dormir ou após exercícios'
  },
  {
    id:'cha-boa-noite',
    nome:'Chá da Boa Noite',
    subtitulo:'Blend relaxante para um sono profundo e restaurador',
    categoria:'quente', nivel:'fácil',
    tempo_prep:'2 min', tempo_total:'10 min', porcoes:'1 xícara',
    ervas_ids:[1,4],
    ingredientes:['1 col. sopa de camomila seca','1 col. sopa de melissa seca','1/2 col. chá de lavanda seca (opcional)','200ml de água a 85°C','Mel de flores silvestres a gosto'],
    modo:['Aqueça a água a 85°C — não ferva para preservar os óleos essenciais.','Misture camomila, melissa e lavanda em infusor.','Despeje a água e cubra. Infuse por 8 minutos.','Remova o infusor e adoce com mel.','Beba 30 minutos antes de dormir.'],
    dica:'Evite tela de celular enquanto bebe. O ritual também prepara o cérebro para o sono.',
    img:'camomila', tags:['sono','relaxante','noturno','ritual'],
    beneficios:'Relaxante, induz o sono, ansiolítico suave',
    pairing:'Leitura ou meditação antes de dormir'
  },
  {
    id:'digestivo-pos-refeicao',
    nome:'Digestivo Pós-Refeição',
    subtitulo:'Alívio natural após refeições pesadas',
    categoria:'quente', nivel:'fácil',
    tempo_prep:'2 min', tempo_total:'8 min', porcoes:'1 xícara',
    ervas_ids:[9,5],
    ingredientes:['1 col. sopa de hortelã fresca ou seca','2 rodelas de gengibre fresco','1/2 col. chá de erva-doce','200ml de água fervente'],
    modo:['Esmague levemente a hortelã entre os dedos para liberar os óleos.','Coloque hortelã, gengibre e erva-doce no infusor.','Despeje água fervente e infuse 5-7 min tampado.','Coe e beba logo após a refeição.'],
    dica:'Hortelã fresca tem efeito mais potente que a seca. Se tiver em casa, prefira sempre.',
    img:'hortela', tags:['digestivo','pós-refeição','náusea','inchaço'],
    beneficios:'Digestivo, carminativo, antiespasmódico',
    pairing:'Após almoço ou janta — especialmente refeições gordurosas'
  },
  {
    id:'cha-imunidade',
    nome:'Chá da Imunidade',
    subtitulo:'Escudo natural contra gripes e resfriados',
    categoria:'quente', nivel:'fácil',
    tempo_prep:'5 min', tempo_total:'15 min', porcoes:'2 xícaras',
    ervas_ids:[5,7],
    ingredientes:['4cm de gengibre fresco','2 col. sopa de hibisco seco','1 pau de canela','400ml de água','Suco de 1 limão','2 col. sopa de mel cru'],
    modo:['Ferva a água com gengibre e canela por 5 minutos.','Desligue e adicione o hibisco. Infuse 8 min tampado.','Coe e deixe esfriar um pouco (abaixo de 60°C).','Adicione limão e mel (nunca em água muito quente).','Beba 2-3x ao dia nos primeiros sintomas.'],
    dica:'O mel cru perde seus compostos ativos acima de 60°C. Sempre adicione quando o líquido estiver morno.',
    img:'gengibre-e-curcuma', tags:['imunidade','gripe','resfriado','vitamina C','inverno'],
    beneficios:'Antibacteriano, antiviral, vitamina C, anti-inflamatório',
    pairing:'Primeiros sinais de gripe ou como preventivo no inverno'
  },

  // ── GELADAS ──
  {
    id:'hibisco-laranja-gelado',
    nome:'Hibisco & Laranja Gelado',
    subtitulo:'A cor mais bonita do verão — vitamina C em abundância',
    categoria:'gelado', nivel:'fácil',
    tempo_prep:'10 min', tempo_total:'20 min', porcoes:'2 copos',
    ervas_ids:[7],
    ingredientes:['2 col. sopa de hibisco seco','400ml de água fervente','Suco de 1 laranja','Mel ou agave a gosto','Gelo abundante','Rodelas de laranja e hortelã para decorar'],
    modo:['Ferva a água e despeje sobre o hibisco. Infuse 10 min.','Coe e deixe esfriar completamente.','Adicione o suco de laranja e adoce a gosto.','Sirva em copo alto com gelo e decore.'],
    dica:'Para versão com gás: substitua metade da água por água com gás na hora de servir.',
    img:'hibisco', tags:['refrescante','vitamina C','verão','colorido'],
    beneficios:'Pressão arterial, vitamina C, antioxidante',
    pairing:'Petiscos, brunch ou welcome drink'
  },
  {
    id:'cold-brew-mate',
    nome:'Cold Brew de Erva-Mate',
    subtitulo:'O chimarrão reinventado — suave, sem amargor, energizante',
    categoria:'gelado', nivel:'fácil',
    tempo_prep:'5 min', tempo_total:'8-12h (geladeira)', porcoes:'4 copos',
    ervas_ids:[39],
    ingredientes:['4 col. sopa de erva-mate (chimarrão)','800ml de água filtrada fria','Suco de 1/2 limão (opcional)','Mel a gosto','Gelo'],
    modo:['Coloque a erva-mate em frasco com a água fria.','Tampe e leve à geladeira por 8-12h (overnight é perfeito).','Coe com filtro de papel ou coador fino.','Adicione limão e mel a gosto.','Sirva com muito gelo.'],
    dica:'Cold brew extrai cafeína e nutrientes sem os taninos que causam amargor. Muito mais suave que o chimarrão tradicional.',
    img:'erva-mate', tags:['energia','cafeína natural','verão','sem amargor'],
    beneficios:'Energia, foco, antioxidante, xantinas',
    pairing:'Manhã de trabalho ou pré-treino'
  },
  {
    id:'capim-limao-gengibre',
    nome:'Capim-Limão & Gengibre Gelado',
    subtitulo:'Fresco, picante e tônico — a bebida do verão',
    categoria:'gelado', nivel:'fácil',
    tempo_prep:'10 min', tempo_total:'20 min', porcoes:'2 copos',
    ervas_ids:[17,5],
    ingredientes:['2 col. sopa de capim-limão seco','3 rodelas de gengibre fresco','400ml de água quente','Suco de 1 limão','Mel a gosto','Gelo e rodelas de limão para decorar'],
    modo:['Prepare infusão de capim-limão com gengibre (10 min).','Coe e deixe esfriar.','Adicione suco de limão e mel.','Sirva em copo com gelo e rodelas de limão.'],
    dica:'Para festas: faça concentrado 2x mais forte e dilua com água com gás na hora de servir.',
    img:'capim-limao', tags:['refrescante','digestivo','verão','tônico'],
    beneficios:'Digestivo, calmante, antioxidante',
    pairing:'Grelhados, saladas ou como aperitivo'
  },
  {
    id:'hibisco-melancia',
    nome:'Hibisco & Melancia',
    subtitulo:'Duas cores de verão em um copo só',
    categoria:'gelado', nivel:'fácil',
    tempo_prep:'15 min', tempo_total:'25 min', porcoes:'4 copos',
    ervas_ids:[7],
    ingredientes:['3 col. sopa de hibisco seco','600ml de água fervente','300g de melancia sem semente','Suco de 1/2 limão','Mel a gosto','Gelo e cubinhos de melancia para decorar'],
    modo:['Prepare chá de hibisco forte. Coe e resfrie.','Liquidifique a melancia até obter suco.','Misture chá com suco de melancia e limão.','Adoce a gosto e sirva bem gelado.'],
    dica:'Congele parte do chá de hibisco em forminhas — os cubos não diluem a bebida.',
    img:'hibisco-2', tags:['verão','colorido','festas','hidratante'],
    beneficios:'Hidratante, vitaminas, pressão arterial',
    pairing:'Churrasco, praia ou piquenique'
  },

  // ── MOCKTAILS ──
  {
    id:'hibisco-spritz',
    nome:'Hibisco Spritz',
    subtitulo:'Aperitivo sem álcool elegante e com personalidade',
    categoria:'mocktail', nivel:'médio',
    tempo_prep:'15 min', tempo_total:'25 min', porcoes:'2 taças',
    ervas_ids:[7],
    ingredientes:['100ml de chá de hibisco concentrado (frio)','150ml de água tônica gelada','50ml de suco de laranja','1 col. sopa de suco de limão','Mel a gosto','Gelo','Rodelas de laranja e flores secas para decorar'],
    modo:['Prepare hibisco bem concentrado (4 col./200ml) e resfrie.','Em taça com gelo, coloque o suco de laranja e o chá.','Complete com tônica gelada vertendo pela lateral do copo.','Adicione limão e adoce a gosto.','Decore e sirva imediatamente.'],
    dica:'Verter a tônica pela lateral mantém as borbulhas. Serve como aperitivo ou welcome drink.',
    img:'hibisco-2', tags:['elegante','festas','sem álcool','aperitivo'],
    beneficios:'Vitamina C, antioxidante, refrescante',
    pairing:'Aperitivos, queijos, tábua de frios'
  },
  {
    id:'maracuja-tonica',
    nome:'Maracujá & Erva-Cidreira Tônica',
    subtitulo:'Relaxante que parece cocktail — tropical e sofisticado',
    categoria:'mocktail', nivel:'médio',
    tempo_prep:'15 min', tempo_total:'25 min', porcoes:'2 copos',
    ervas_ids:[3,4],
    ingredientes:['100ml de chá de erva-cidreira (frio)','50ml de suco de maracujá natural','100ml de água tônica','1 col. sopa de mel','Suco de 1/2 limão','Gelo e sementes de maracujá para decorar'],
    modo:['Prepare chá de erva-cidreira (8 min) e resfrie.','Em copo com gelo, misture chá com suco de maracujá.','Adicione mel e limão, mexa bem.','Complete com tônica gelada.','Decore com sementes de maracujá.'],
    dica:'A erva-cidreira tem efeito calmante suave — este mocktail é ótimo para relaxar sem sonolência.',
    img:'maracuja', tags:['tropical','relaxante','festas','sofisticado'],
    beneficios:'Ansiedade, relaxamento, digestão',
    pairing:'Happy hour, celebrações, jantares ao ar livre'
  },
  {
    id:'hortela-mojito',
    nome:'Hortelã Mojito Sem Álcool',
    subtitulo:'O clássico cubano com ervas frescas brasileiras',
    categoria:'mocktail', nivel:'fácil',
    tempo_prep:'10 min', tempo_total:'10 min', porcoes:'2 copos',
    ervas_ids:[9],
    ingredientes:['10 folhas de hortelã fresca','Suco de 2 limões','2 col. sopa de açúcar ou mel','200ml de água com gás bem gelada','Gelo picado','Ramos de hortelã para decorar'],
    modo:['Esmague a hortelã com o açúcar no fundo do copo (não destrua, só amasse levemente).','Adicione o suco de limão e misture.','Preencha com gelo picado.','Complete com água com gás e misture suavemente.','Decore com hortelã e sirva imediatamente.'],
    dica:'Use hortelã fresca — o mojito sem hortelã fresca perde sua essência. Esmague apenas para liberar os óleos.',
    img:'hortela-fresca', tags:['clássico','refrescante','festas','rápido'],
    beneficios:'Digestivo, refrescante, calmante suave',
    pairing:'Petiscos, tapas, peixe grelhado'
  },
  {
    id:'gengibre-lemonade',
    nome:'Gengibre Lemonade',
    subtitulo:'A limonada que aquece e refresca ao mesmo tempo',
    categoria:'mocktail', nivel:'fácil',
    tempo_prep:'15 min', tempo_total:'25 min', porcoes:'4 copos',
    ervas_ids:[5],
    ingredientes:['5cm de gengibre fresco ralado','Suco de 4 limões','4 col. sopa de mel','600ml de água','200ml de água com gás','Gelo e fatias de gengibre para decorar'],
    modo:['Ferva 200ml de água com o gengibre por 5 min. Coe e resfrie.','Misture o xarope com suco de limão e mel.','Adicione os 400ml de água fria.','Complete com água com gás na hora de servir.','Sirva com gelo e fatias de gengibre.'],
    dica:'Para mais picante: aumente o gengibre ou infuse mais tempo. Para mais suave: coe imediatamente.',
    img:'gengibre', tags:['energizante','digestivo','verão','festas'],
    beneficios:'Digestivo, anti-inflamatório, imunidade',
    pairing:'Comida asiática, frutos do mar, pratos apimentados'
  },

  // ── MEDICINAIS ──
  {
    id:'detox-manha',
    nome:'Detox da Manhã',
    subtitulo:'Limpeza suave e revitalizante — o ritual em jejum',
    categoria:'medicinal', nivel:'fácil',
    tempo_prep:'5 min', tempo_total:'12 min', porcoes:'1 copo',
    ervas_ids:[9,5,7],
    ingredientes:['1 col. sopa de hortelã fresca','2 rodelas de gengibre','1 col. chá de hibisco','250ml de água a 80°C','Suco de 1/2 limão','1 pitada de cúrcuma'],
    modo:['Use água a 80°C — muito quente destrói enzimas da hortelã.','Infuse hortelã, gengibre, hibisco e cúrcuma por 7 min.','Coe e adicione suco de limão (nunca antes — o ácido altera a infusão).','Beba em jejum, 30 min antes do café da manhã.'],
    dica:'A temperatura da água é crucial: 80°C para o melhor efeito. Nunca fervente com hortelã fresca.',
    img:'hortela', tags:['detox','manhã','jejum','revitalizante'],
    beneficios:'Digestivo, antioxidante, depurativo',
    pairing:'Beba 30 min antes do café da manhã'
  },
  {
    id:'xarope-gengibre-mel',
    nome:'Xarope de Gengibre e Mel',
    subtitulo:'Concentrado curativo que dura semanas na geladeira',
    categoria:'medicinal', nivel:'médio',
    tempo_prep:'10 min', tempo_total:'30 min', porcoes:'1 frasco (250ml)',
    ervas_ids:[5],
    ingredientes:['200g de gengibre fresco descascado','200ml de mel cru','Suco de 2 limões','1 pau de canela','5 cravos-da-índia','100ml de água'],
    modo:['Rale o gengibre.','Ferva com a água, canela e cravo por 15 minutos.','Coe e deixe esfriar completamente.','Misture o mel e o suco de limão (nunca aqueça após o mel).','Armazene em frasco esterilizado na geladeira. Dura 3-4 semanas.','Use 1 col. sopa em chá quente ou água morna, 2-3x ao dia.'],
    dica:'Este xarope é concentrado. Na geladeira dura até um mês. Dê de presente — impressiona muito.',
    img:'gengibre', tags:['preventivo','inverno','presente','armazenável'],
    beneficios:'Anti-inflamatório, antibacteriano, imunidade',
    pairing:'Use em chás, sucos, smoothies ou puro como remédio'
  },
  {
    id:'cha-foco-energy',
    nome:'Chá do Foco',
    subtitulo:'Energia limpa e concentração sem a ansiedade do café',
    categoria:'medicinal', nivel:'fácil',
    tempo_prep:'3 min', tempo_total:'10 min', porcoes:'1 xícara grande',
    ervas_ids:[17,5],
    ingredientes:['1 col. sopa de capim-limão','2 rodelas de gengibre fresco','1/2 col. chá de canela','250ml de água a 85°C','Mel a gosto'],
    modo:['Aqueça a água a 85°C.','Infuse capim-limão, gengibre e canela por 7 minutos tampado.','Coe e adoce suavemente com mel.','Beba devagar, de preferência sem distrações.'],
    dica:'O capim-limão tem citral que melhora o humor e concentração. Combine com respiração profunda antes de trabalhar.',
    img:'capim-limao', tags:['foco','energia','trabalho','estudo','manhã'],
    beneficios:'Foco, humor, energia leve, digestivo',
    pairing:'Antes de sessões de trabalho, estudo ou meditação'
  },

  // ── CULINÁRIAS ──
  {
    id:'geleia-hibisco',
    nome:'Geleia de Hibisco',
    subtitulo:'Cor rubim e sabor intenso — transforma qualquer pão',
    categoria:'culinario', nivel:'médio',
    tempo_prep:'10 min', tempo_total:'40 min', porcoes:'2 potes pequenos',
    ervas_ids:[7],
    ingredientes:['50g de hibisco seco','500ml de água','350g de açúcar','Suco de 1 limão','1/2 col. chá de pectina (opcional)'],
    modo:['Ferva o hibisco na água por 15 min. Coe e reserve o líquido.','Coloque o líquido com açúcar e limão numa panela.','Cozinhe em fogo médio, mexendo, por 20-25 min até engrossar.','Teste do prato: 1 gota num prato frio — deve firmar.','Despeje em potes esterilizados e feche quente.'],
    dica:'A geleia engrossa mais ao esfriar. Retire do fogo quando ainda parecer líquida demais.',
    img:'hibisco-seco', tags:['doce','brunch','pão','presente','colorido'],
    beneficios:'Vitamina C, antioxidante',
    pairing:'Pão artesanal, queijo brie, torradas'
  },
  {
    id:'granita-capim-limao',
    nome:'Granita de Capim-Limão',
    subtitulo:'Sorvete rústico italiano com o frescor do cerrado',
    categoria:'culinario', nivel:'médio',
    tempo_prep:'15 min', tempo_total:'4h (congelamento)', porcoes:'4 porções',
    ervas_ids:[17],
    ingredientes:['4 col. sopa de capim-limão seco','500ml de água','120g de açúcar','Suco de 2 limões','Raspas de 1 limão'],
    modo:['Ferva a água com o açúcar até dissolver. Retire do fogo.','Adicione o capim-limão e infuse 20 min coberto.','Coe, adicione suco e raspas de limão.','Despeje em forma rasa e leve ao freezer.','A cada 45 min, raspe com garfo para formar cristais. Repita 4-5x.'],
    dica:'O segredo é raspar regularmente — quanto mais você raspa, mais leve e aerada fica a granita.',
    img:'capim-limao', tags:['sobremesa','verão','vegano','refrescante'],
    beneficios:'Digestivo, calmante, refrescante',
    pairing:'Após o almoço ou como palate cleanser'
  },
  {
    id:'manteiga-ervas',
    nome:'Manteiga de Ervas Aromáticas',
    subtitulo:'Transforma qualquer pão ou proteína em algo especial',
    categoria:'culinario', nivel:'fácil',
    tempo_prep:'10 min', tempo_total:'10 min + 1h geladeira', porcoes:'1 rolo (8-10 porções)',
    ervas_ids:[9],
    ingredientes:['200g de manteiga sem sal em temperatura ambiente','1 col. sopa de hortelã fresca picada','1 col. sopa de alecrim fresco picado','1 col. sopa de tomilho fresco','1 dente de alho picado fino','1 col. chá de raspas de limão','Sal marinho a gosto'],
    modo:['Amasse a manteiga com um garfo até ficar cremosa.','Adicione todas as ervas picadas, o alho e as raspas.','Misture bem e tempere com sal.','Enrole em papel manteiga formando um cilindro.','Leve à geladeira por 1h. Corte em rodelas para servir.'],
    dica:'Congele as rodelas separadas para usar por até 2 meses. Ideal sobre frango grelhado, peixe ou macarrão.',
    img:'hortela-fresca', tags:['culinário','rápido','versátil','presente'],
    beneficios:'Aroma terapêutico, digestivo',
    pairing:'Pão, carnes grelhadas, macarrão, batatas'
  },
  {
    id:'infusao-camomila-sobremesa',
    nome:'Creme de Camomila',
    subtitulo:'Sobremesa delicada com toda a suavidade da camomila',
    categoria:'culinario', nivel:'avançado',
    tempo_prep:'20 min', tempo_total:'4h (gelar)', porcoes:'4 porções',
    ervas_ids:[1],
    ingredientes:['4 col. sopa de camomila seca','500ml de leite integral','200ml de creme de leite','4 gemas de ovo','80g de açúcar','1 col. sopa de maisena','Flores de camomila para decorar'],
    modo:['Aqueça o leite com a camomila e desligue antes de ferver. Infuse 15 min e coe.','Bata as gemas com açúcar e maisena até clarear.','Adicione o leite de camomila morno à mistura de gemas, devagar.','Leve de volta ao fogo baixo, mexendo sempre, até engrossar.','Adicione o creme de leite, despeje em taças e leve à geladeira por 4h.','Sirva decorado com flores de camomila.'],
    dica:'Nunca deixe ferver após adicionar as gemas — cozinha e cria grumos. Fogo baixo e paciência.',
    img:'camomila', tags:['sobremesa','elegante','floral','brunch'],
    beneficios:'Relaxante, digestivo, sofisticado',
    pairing:'Após jantar leve ou como sobremesa de chá das cinco'
  },

  // ── RITUAIS ──
  {
    id:'gongfu-ervas-brasileiras',
    nome:'Sessão Gongfu com Ervas Brasileiras',
    subtitulo:'A arte da infusão múltipla adaptada para o cerrado',
    categoria:'ritual', nivel:'avançado',
    tempo_prep:'10 min', tempo_total:'45 min', porcoes:'6-8 infusões pequenas',
    ervas_ids:[1,4,9],
    ingredientes:['2 col. sopa da sua erva favorita (camomila, melissa ou hortelã)','150ml de água a 85°C','Bule pequeno ou gaiwan (100-150ml)','Xícaras pequenas (30-50ml)','Timer'],
    modo:['Aqueça o bule com água quente. Descarte. Adicione a erva (alta proporção: 1 col. por 100ml).','1ª infusão: 30 segundos. Aprecie cor e aroma.','2ª infusão: 45 segundos. Note a evolução do sabor.','3ª infusão: 1 minuto. A erva revela notas mais profundas.','4ª em diante: adicione 30s a cada vez. Repita até esgotar.','Entre infusões: feche os olhos, sinta o aroma, observe a xícara.'],
    dica:'O método Gongfu foi criado para chás orientais mas funciona lindamente com ervas brasileiras. Cada infusão é uma conversa diferente com a mesma planta.',
    img:'cha-artesanal', tags:['ritual','meditação','gongfu','mindfulness','cerimônia'],
    beneficios:'Prática meditativa, presença plena, apreciação sensorial',
    pairing:'Silêncio, meditação ou conversa significativa'
  },
  {
    id:'cold-brew-ceremonial',
    nome:'Cold Brew Lento — A Receita da Paciência',
    subtitulo:'12 horas de infusão fria que transforma a planta em outra coisa',
    categoria:'ritual', nivel:'fácil',
    tempo_prep:'5 min', tempo_total:'12h', porcoes:'2 copos',
    ervas_ids:[1,7,17],
    ingredientes:['1 col. sopa de camomila seca','1 col. chá de hibisco','1/2 col. sopa de capim-limão','400ml de água filtrada fria','Mel opcional'],
    modo:['Em jarra, combine todas as ervas com a água fria.','Feche e leve à geladeira por 12h (overnight é perfeito).','Coe com filtro de papel para máxima limpidez.','Sirva puro ou com uma gota de mel.','Observe a cor: o hibisco cria um rosé natural sem calor.'],
    dica:'A extração fria revela doçura natural que o calor esconde. Não é chá gelado — é outra bebida.',
    img:'camomila', tags:['ritual','paciência','suave','natural','cold brew'],
    beneficios:'Relaxante, antioxidante, digestivo suave',
    pairing:'Leitura, fim de tarde, preparação para o sono'
  },
  {
    id:'cha-chimarrao-moderno',
    nome:'Chimarrão Moderno',
    subtitulo:'A tradição gaúcha com técnica e intenção',
    categoria:'ritual', nivel:'médio',
    tempo_prep:'5 min', tempo_total:'20 min', porcoes:'1 cuia (várias reposições)',
    ervas_ids:[39],
    ingredientes:['Erva-mate para chimarrão (quantidade para encher a cuia 3/4)','Água aquecida a 70-75°C (NUNCA fervente)','Cuia e bomba','Opcional: folhas de hortelã fresca ou uma fatia de limão'],
    modo:['Incline a cuia e preencha 3/4 com a erva-mate seca.','Tampe a abertura com a palma e agite delicadamente para compactar.','Posicione a bomba inclinada na parte vazia da cuia.','Aqueça a água a 70-75°C — água fervente queima a erva e amarga.','Adicione a água aos poucos pela lateral da bomba.','Deixe absorver 1 min antes da primeira sugada. Reponha a água repetidamente.'],
    dica:'A temperatura da água é o segredo do chimarrão não amargo. 70-75°C é o ponto ideal. Tenha um termômetro ou espere a água ferver e aguarde 5 minutos.',
    img:'erva-mate', tags:['tradição','ritual','gaúcho','partilha','manha'],
    beneficios:'Energia, foco, antioxidante, social',
    pairing:'Roda de amigos, manhã, trabalho em equipe'
  },
];

// ─── Filtro ativo ───
let receitasFiltro = 'todas';
let receitaAberta = null;

// ─── Inicialização ───
function initReceitas() {
  receitasFiltro = 'todas';
  receitaAberta = null;
  renderReceitasHub();
}

// ──�� Hub com filtros e grid ───
function renderReceitasHub() {
  const el = document.getElementById('receitasContainer');
  if (!el) return;

  // Filtros como texto (handoff 14/09): emoji fora da identidade e ruim
  // para leitor de tela. Os rotulos vem do i18n (rec.filter_*).
  const _t = typeof t === 'function' ? t : (k, fb) => fb;
  const cats = [
    {id:'todas',    label:_t('rec.filter_all')       || 'Todas'},
    {id:'quente',   label:_t('rec.filter_hot')       || 'Quentes'},
    {id:'gelado',   label:_t('rec.filter_cold')      || 'Geladas'},
    {id:'mocktail', label:_t('rec.filter_mocktail')  || 'Mocktails'},
    {id:'medicinal',label:_t('rec.filter_medicinal') || 'Medicinais'},
    {id:'culinario',label:_t('rec.filter_culinary')  || 'Culinárias'},
    {id:'ritual',   label:_t('rec.filter_ritual')    || 'Rituais'},
  ].map(c => ({...c, label: c.label.startsWith('rec.') ? c.id : c.label}));

  const lista = receitasFiltro === 'todas'
    ? RECEITAS
    : RECEITAS.filter(r => r.categoria === receitasFiltro);

  el.innerHTML = `
    <div class="rec-intro">
      <div class="rec-intro-title">Receitas com Ervas</div>
      <div class="rec-intro-sub">Do chá clássico ao mocktail sofisticado — cada receita conta a história de uma planta</div>
    </div>
    <div class="rec-filter-bar">
      ${cats.map(c=>`
        <button class="rec-filter-btn${receitasFiltro===c.id?' on':''}"
                onclick="setReceitaFiltro('${c.id}')"
                aria-pressed="${receitasFiltro===c.id?'true':'false'}">
          ${c.label}
        </button>`).join('')}
    </div>
    <div class="rec-count" style="font-size:.7rem;color:var(--muted);margin-bottom:.75rem">
      ${lista.length} receita${lista.length!==1?'s':''}
    </div>
    <div class="rec-grid">
      ${lista.map(r=>buildReceitaCard(r)).join('')}
    </div>`;
}

// Extensão real de cada imagem de produto (evita 404/flash ao acertar de primeira)
const REC_IMG_EXT = {
  'camomila':'png','capim-limao':'png','cha-artesanal':'png','curcuma':'png',
  'erva-mate':'jpg','gengibre':'jpg','gengibre-e-curcuma':'png','hibisco':'png',
  'hibisco-2':'jpg','hibisco-seco':'png','hortela':'jpg','hortela-fresca':'png','maracuja':'png'
};
function recImgSrc(slug){
  const ext = REC_IMG_EXT[slug] || 'png';
  return `images/produtos/${slug}.${ext}`;
}

function buildReceitaCard(r) {
  const catColors = {quente:'#c86a30',gelado:'#2d7a8a',mocktail:'#7a2d8a',medicinal:'#2d7a3a',culinario:'#8a7a2d',ritual:'#3a2d8a'};
  const catLabel  = {quente:'Quente',gelado:'Gelada',mocktail:'Mocktail',medicinal:'Medicinal',culinario:'Culinária',ritual:'Ritual'};
  const color = catColors[r.categoria] || 'var(--gold)';
  const primarySrc = recImgSrc(r.img);
  const altExt = primarySrc.endsWith('.png') ? 'jpg' : 'png';
  const altSrc = `images/produtos/${r.img}.${altExt}`;
  return `
    <div class="rec-card" onclick="openReceita('${r.id}')">
      <div class="rec-card-img" style="background:linear-gradient(135deg,${color}18,${color}35)">
        <img src="${primarySrc}" onerror="if(this.src.indexOf('${altSrc}')<0){this.src='${altSrc}'}else{this.src='images/produtos/placeholder.svg';this.onerror=null}"
             alt="${r.nome}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;opacity:.85">
        <span class="rec-cat-badge" style="background:${color}">${catLabel[r.categoria]}</span>
      </div>
      <div class="rec-card-body">
        <div class="rec-card-title">${r.nome}</div>
        <div class="rec-card-sub">${r.subtitulo}</div>
        <div class="rec-card-meta">
          <span>⏱ ${r.tempo_total}</span>
          <span>🍽 ${r.porcoes}</span>
        </div>
        <div class="rec-card-tags">
          ${r.tags.slice(0,3).map(t=>`<span class="rec-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>`;
}

function setReceitaFiltro(cat) {
  receitasFiltro = cat;
  renderReceitasHub();
}

// ─── Detalhe da receita ───
function openReceita(id) {
  const r = RECEITAS.find(x=>x.id===id);
  if (!r) return;
  receitaAberta = id;
  const catColors = {quente:'#c86a30',gelado:'#2d7a8a',mocktail:'#7a2d8a',medicinal:'#2d7a3a',culinario:'#8a7a2d',ritual:'#3a2d8a'};
  const color = catColors[r.categoria] || 'var(--gold)';
  const el = document.getElementById('receitasContainer');
  if (!el) return;

  // Herb links
  const herbLinks = (r.ervas_ids||[]).map(hid=>{
    const herbs = typeof HERBS !== 'undefined' ? HERBS : [];
    const h = herbs.find(x=>x.id===hid);
    return h ? `<button class="rec-herb-link" onclick="goPage('ficha',null,'${h.id}')">${h.icon||'🌿'} ${h.n}</button>` : '';
  }).filter(Boolean).join('');

  el.innerHTML = `
    <button class="rec-back-btn" onclick="renderReceitasHub()">← Todas as receitas</button>

    <div class="rec-detail-header" style="border-left:3px solid ${color}">
      <div class="rec-detail-cat" style="color:${color}">${r.categoria.toUpperCase()} · ${r.nivel.toUpperCase()}</div>
      <h2 class="rec-detail-title">${r.nome}</h2>
      <div class="rec-detail-sub">${r.subtitulo}</div>
      <div class="rec-detail-meta">
        <span>⏱ ${r.tempo_total}</span>
        <span>🍽 ${r.porcoes}</span>
        ${r.tempo_prep?`<span>🔪 ${r.tempo_prep} preparo</span>`:''}
      </div>
    </div>

    ${herbLinks?`<div class="rec-herbs-row">
      <div style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem">Ervas desta receita</div>
      ${herbLinks}
    </div>`:''}

    <div class="rec-section">
      <div class="rec-section-title">📦 Ingredientes</div>
      <ul class="rec-ingredientes">
        ${r.ingredientes.map(i=>`<li>${i}</li>`).join('')}
      </ul>
    </div>

    <div class="rec-section">
      <div class="rec-section-title">📋 Modo de Preparo</div>
      <div class="rec-steps">
        ${r.modo.map((s,i)=>`
          <div class="rec-step">
            <div class="rec-step-num" style="background:${color}22;color:${color};border:1px solid ${color}44">${i+1}</div>
            <div class="rec-step-text">${s}</div>
          </div>`).join('')}
      </div>
    </div>

    ${r.dica?`<div class="rec-dica">💡 <strong>Dica:</strong> ${r.dica}</div>`:''}
    ${r.beneficios?`<div class="rec-section"><div class="rec-section-title">✦ Benefícios</div><div style="font-size:.83rem;color:var(--cream2);line-height:1.7">${r.beneficios}</div></div>`:''}
    ${r.pairing?`<div class="rec-section"><div class="rec-section-title">🍽 Harmonização</div><div style="font-size:.83rem;color:var(--cream2);line-height:1.7">${r.pairing}</div></div>`:''}

    <div style="display:flex;gap:8px;margin-top:1.5rem;flex-wrap:wrap">
      ${r.ervas_ids&&r.ervas_ids.length?`
        <button class="roda-start-btn" style="background:${color}22;border:1px solid ${color}44;color:${color}"
                onclick="sendReceitaToBlend(${JSON.stringify(r.ervas_ids)})">
          ＋ Adicionar ervas ao blend
        </button>`:'' }
      <button class="roda-start-btn" onclick="renderReceitasHub()">← Mais receitas</button>
    </div>`;
}

function sendReceitaToBlend(ids) {
  if (typeof blendTray === 'undefined') { toast('Blend não disponível'); return; }
  let added = 0;
  ids.forEach(id => {
    if (!blendTray.includes(id)) { blendTray.push(id); added++; }
  });
  if (added > 0) {
    localStorage.setItem('erb_tray', JSON.stringify(blendTray));
    if (typeof toastLink === 'function') {
      toastLink(`${added} erva${added!==1?'s':''} adicionada${added!==1?'s':''} ao blend`,
        'Ver blend →', ()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
    }
  } else {
    if (typeof toast === 'function') toast('Ervas já estão no blend');
  }
}
