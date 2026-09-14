// ════════════════════════════════════════
// SEO — Ervatório
// Dynamic meta tags per page × language
// ════════════════════════════════════════

const SEO_META = {
  search: {
    pt: { title:'Encontre seu chá — Ervatório', desc:'Conte como você está e receba ervas e chás que combinam com o seu momento — com preparo, cuidados e onde encontrar.' },
    en: { title:'Find your tea — Ervatório', desc:'Tell us how you feel and get herbs and teas that fit your moment — with brewing, cautions and where to find them.' },
    es: { title:'Encuentra tu té — Ervatório', desc:'Cuenta cómo estás y recibe hierbas y tés que combinan con tu momento — con preparación, cuidados y dónde encontrarlos.' },
    ja: { title:'あなたのお茶を見つける — Ervatório', desc:'今の気分に合うハーブとお茶を、淹れ方・注意点・入手先とともに。' },
    de: { title:'Finde deinen Tee — Ervatório', desc:'Sag uns, wie es dir geht, und erhalte Kräuter und Tees für deinen Moment — mit Zubereitung, Hinweisen und Bezugsquellen.' },
    fr: { title:'Trouvez votre thé — Ervatório', desc:'Dites-nous comment vous allez et recevez des herbes et thés pour votre moment — avec préparation, précautions et où les trouver.' },
  },
  chas: {
    pt: { title:'Tipos de chá (Camellia sinensis) — Ervatório', desc:'Os seis tipos de Camellia sinensis: branco, verde, amarelo, oolong, preto e pu-erh. História, preparo, variedades e harmonização.' },
    en: { title:'Types of tea (Camellia sinensis) — Ervatório', desc:'The six types of Camellia sinensis: white, green, yellow, oolong, black and pu-erh. History, brewing, varieties and food pairings.' },
    es: { title:'Tipos de té (Camellia sinensis) — Ervatório', desc:'Los seis tipos de Camellia sinensis: blanco, verde, amarillo, oolong, negro y pu-erh. Historia, preparación, variedades y maridaje.' },
    ja: { title:'お茶の種類（Camellia sinensis） — Ervatório', desc:'カメリアシネンシスの6種類：白茶、緑茶、黄茶、ウーロン茶、紅茶、プーアール茶。歴史、淹れ方、品種。' },
    de: { title:'Teesorten (Camellia sinensis) — Ervatório', desc:'Die sechs Typen von Camellia sinensis: Weißtee, Grüntee, Gelbtee, Oolong, Schwarztee und Pu-erh. Geschichte, Zubereitung und Sorten.' },
    fr: { title:'Types de thé (Camellia sinensis) — Ervatório', desc:'Les six types de Camellia sinensis : blanc, vert, jaune, oolong, noir et pu-erh. Histoire, préparation, variétés et accords.' },
  },
  mundo: {
    pt: { title:'Origens e onde beber — Ervatório', desc:'Da China ao Brasil: cultura do chá em 15 países. Mapas, ervas locais, tradições e conexões com o Brasil.' },
    en: { title:'Origins and where to drink — Ervatório', desc:'From China to Brazil: tea culture in 15 countries. Maps, local herbs, traditions and connections to Brazil.' },
    es: { title:'Orígenes y dónde beber — Ervatório', desc:'De China a Brasil: cultura del té en 15 países. Mapas, hierbas locales, tradiciones y conexiones con Brasil.' },
    ja: { title:'産地と飲める場所 — Ervatório', desc:'中国からブラジルまで：15カ国のお茶文化。地図、地元の薬草、伝統、ブラジルとの繋がり。' },
    de: { title:'Herkunft und wo trinken — Ervatório', desc:'Von China bis Brasilien: Teekultur in 15 Ländern. Karten, lokale Kräuter, Traditionen und Verbindungen zu Brasilien.' },
    fr: { title:'Origines et où boire — Ervatório', desc:'De la Chine au Brésil : culture du thé dans 15 pays. Cartes, herbes locales, traditions et liens avec le Brésil.' },
  },
  receitas: {
    pt: { title:'Receitas com Ervas — Ervatório', desc:'Mais de 20 receitas: chás quentes, drinks gelados, mocktails, medicinais, culinárias e rituais com ervas brasileiras.' },
    en: { title:'Herb Recipes — Ervatório', desc:'Over 20 recipes: hot teas, cold drinks, mocktails, medicinal, culinary and ritual blends with Brazilian herbs.' },
    es: { title:'Recetas con Hierbas — Ervatório', desc:'Más de 20 recetas: tés calientes, bebidas frías, mocktails, medicinales, culinarios y rituales con hierbas brasileñas.' },
    ja: { title:'ハーブレシピ — Ervatório', desc:'20以上のレシピ：ホットティー、コールドドリンク、モクテル、薬用、料理、儀式用のブラジルハーブブレンド。' },
    de: { title:'Kräuterrezepte — Ervatório', desc:'Über 20 Rezepte: heiße Tees, Kaltgetränke, Mocktails, Heilmittel, Kulinarisches und Rituale mit brasilianischen Kräutern.' },
    fr: { title:'Recettes aux Herbes — Ervatório', desc:'Plus de 20 recettes : thés chauds, boissons froides, mocktails, médicinaux, culinaires et rituels aux herbes brésiliennes.' },
  },
  jogo: {
    pt: { title:'Jogo Botânico — Ervatório', desc:'Teste seus conhecimentos sobre ervas medicinais brasileiras. Identifique plantas a partir de pistas e ganhe pontos.' },
    en: { title:'Botanical Game — Ervatório', desc:'Test your knowledge of Brazilian medicinal herbs. Identify plants from clues and earn points.' },
    es: { title:'Juego Botánico — Ervatório', desc:'Pon a prueba tus conocimientos de hierbas medicinales brasileñas. Identifica plantas a partir de pistas.' },
    ja: { title:'植物ゲーム — Ervatório', desc:'ブラジルの薬草の知識をテストしましょう。ヒントから植物を識別してポイントを獲得。' },
    de: { title:'Botanisches Spiel — Ervatório', desc:'Teste dein Wissen über brasilianische Heilkräuter. Identifiziere Pflanzen anhand von Hinweisen und sammle Punkte.' },
    fr: { title:'Jeu Botanique — Ervatório', desc:'Testez vos connaissances sur les herbes médicinales brésiliennes. Identifiez les plantes à partir d\'indices.' },
  },
  ferramentas: {
    pt: { title:'Como preparar — Ervatório', desc:'Guia de preparo, calculadora de infusão, timer e monitor de cafeína. Tudo para preparar o chá certo.' },
    en: { title:'How to brew — Ervatório', desc:'Brewing guide, infusion calculator, timer and caffeine monitor. Everything to brew the right tea.' },
    es: { title:'Cómo preparar — Ervatório', desc:'Guía de preparación, calculadora de infusión, temporizador y monitor de cafeína.' },
    ja: { title:'淹れ方 — Ervatório', desc:'淹れ方ガイド、抽出計算機、タイマー、カフェインモニター。' },
    de: { title:'Zubereitung — Ervatório', desc:'Zubereitungsguide, Aufguss-Kalkulator, Timer und Koffein-Monitor.' },
    fr: { title:'Comment préparer — Ervatório', desc:'Guide de préparation, calculateur d\'infusion, minuteur et moniteur de caféine.' },
  },
  quiz: {
    pt: { title:'Teste de 1 minuto — qual chá combina com você? | Ervatório', desc:'Descubra qual erva ou chá brasileiro combina com a sua personalidade neste quiz interativo do Ervatório.' },
    en: { title:'1-minute test — which tea fits you? | Ervatório', desc:'Discover which Brazilian herb or tea matches your personality in this interactive Ervatório quiz.' },
    es: { title:'Quiz — ¿Cuál té brasileño eres tú? | Ervatório', desc:'Descubre qué hierba o té brasileño combina con tu personalidad en este quiz interactivo.' },
    ja: { title:'クイズ — あなたはどのブラジルのお茶？ | Ervatório', desc:'このインタラクティブクイズで、あなたの個性に合うブラジルのハーブやお茶を発見しましょう。' },
    de: { title:'Quiz — Welcher brasilianische Tee bist du? | Ervatório', desc:'Entdecke, welches brasilianische Kraut oder welcher Tee zu deiner Persönlichkeit passt.' },
    fr: { title:'Quiz — Quel thé brésilien êtes-vous ? | Ervatório', desc:'Découvrez quelle herbe ou quel thé brésilien correspond à votre personnalité dans ce quiz interactif.' },
  },
  blends: {
    pt: { title:'Criar meu blend — Ervatório', desc:'Monte seu blend com ervas do Brasil e do mundo, ou escolha um pronto. Salve e receba por e-mail.' },
    en: { title:'Create my blend — Ervatório', desc:'Build your own blend with herbs from Brazil and the world, or pick a ready one. Save it and get it by e-mail.' },
    es: { title:'Mezclas de Hierbas — Ervatório', desc:'Crea, guarda y comparte mezclas personalizadas de hierbas brasileñas. Asistente inteligente y modo manual.' },
    ja: { title:'ハーブブレンド — Ervatório', desc:'ブラジルのハーブのカスタムブレンドを作成、保存、共有。スマートアシスタントと手動モード。' },
    de: { title:'Kräutermischungen — Ervatório', desc:'Erstelle, speichere und teile personalisierte brasilianische Kräutermischungen. Intelligenter Assistent und manueller Modus.' },
    fr: { title:'Mélanges d\'Herbes — Ervatório', desc:'Créez, enregistrez et partagez des mélanges d\'herbes brésiliennes personnalisés. Assistant intelligent et mode manuel.' },
  },
  ervatorio: {
    pt: { title:'Guia de Ervas · Ervopédia — Ervatório', desc:'96 fichas: para que serve, como preparar, quem deve evitar. Origem, efeitos, cuidados e detalhe técnico de cada erva.' },
    en: { title:'Herb Guide · Ervopedia — Ervatório', desc:'96 herb profiles: what it is for, how to brew, who should avoid it. Origin, effects, cautions and technical detail.' },
    es: { title:'Guía de Hierbas · Ervopedia — Ervatório', desc:'Enciclopedia completa de hierbas medicinales brasileñas: origen, efectos, preparación, contraindicaciones.' },
    ja: { title:'ハーブガイド · エルボペディア — Ervatório', desc:'ブラジル薬草の完全な百科事典：起源、効果、調製、禁忌、詳細なプロファイル。' },
    de: { title:'Kräuterführer · Ervopedia — Ervatório', desc:'Vollständige Enzyklopädie brasilianischer Heilkräuter: Herkunft, Wirkung, Zubereitung, Kontraindikationen.' },
    fr: { title:'Guide des Herbes · Ervopédia — Ervatório', desc:'Encyclopédie complète des herbes médicinales brésiliennes : origine, effets, préparation, contre-indications.' },
  },
  caminho: {
    pt: { title:'Minha jornada — selos e conquistas | Ervatório', desc:'Acompanhe sua jornada no Ervatório: badges conquistados, nível de conhecimento e progresso botânico.' },
    en: { title:'My journey — badges & achievements | Ervatório', desc:'Track your Ervatório journey: earned badges, knowledge level and botanical progress.' },
    es: { title:'Mi camino — sellos y logros | Ervatório', desc:'Sigue tu camino en el Ervatório: badges conquistados, nivel y progreso botánico.' },
    ja: { title:'マイジャーニー — バッジと実績 | Ervatório', desc:'エルバトリオの旅を追跡：獲得したバッジ、知識レベル、植物の進歩。' },
    de: { title:'Meine Reise — Abzeichen & Errungenschaften | Ervatório', desc:'Verfolge deine Ervatório-Reise: verdiente Abzeichen, Wissensstufe und botanischen Fortschritt.' },
    fr: { title:'Mon parcours — badges & accomplissements | Ervatório', desc:'Suivez votre parcours Ervatório : badges gagnés, niveau de connaissance et progrès botanique.' },
  },
  diario: {
    pt: { title:'Diário de infusões — Ervatório', desc:'Registre o que tomou, quando e como se sentiu. Fica na sua conta; só você lê.' },
    en: { title:'Infusion diary — Ervatório', desc:'Log what you drank, when, and how you felt. It stays in your account; only you can read it.' },
    es: { title:'Diario de infusiones — Ervatório', desc:'Registra qué tomaste, cuándo y cómo te sentiste. Queda en tu cuenta; solo tú lo lees.' },
    ja: { title:'お茶日記 — Ervatório', desc:'何をいつ飲んで、どう感じたかを記録。アカウントに保存され、あなただけが読めます。' },
    de: { title:'Aufguss-Tagebuch — Ervatório', desc:'Halte fest, was du wann getrunken hast und wie du dich gefühlt hast. Bleibt in deinem Konto; nur du liest es.' },
    fr: { title:'Journal d\'infusions — Ervatório', desc:'Notez ce que vous avez bu, quand, et comment vous vous êtes senti. Reste dans votre compte ; vous seul le lisez.' },
  },
};

const SEO_DEFAULT = {
  pt: { title:'Ervatório — Curadoria Botânica', desc:'Curadoria de ervas medicinais, chás e rituais do Brasil e do mundo.' },
  en: { title:'Ervatório — Botanical Curation', desc:'Curation of medicinal herbs, teas and rituals from Brazil and the world.' },
  es: { title:'Ervatório — Curación Botánica', desc:'Curación de hierbas medicinales, tés y rituales de Brasil y del mundo.' },
  ja: { title:'Ervatório — ボタニカルキュレーション', desc:'ブラジルと世界の薬草、お茶、儀式のキュレーション。' },
  de: { title:'Ervatório — Botanische Kuration', desc:'Kuration von Heilkräutern, Tees und Ritualen aus Brasilien und der Welt.' },
  fr: { title:'Ervatório — Curation Botanique', desc:'Curation de plantes médicinales, thés et rituels du Brésil et du monde.' },
};

function updateSEO(pageId) {
  const lang = (window._lang || 'pt');
  const map  = SEO_META[pageId] || SEO_DEFAULT;
  const data = (map[lang] || map.pt) || SEO_DEFAULT.pt;

  document.title = data.title;

  const setMeta = (sel, val) => {
    let el = document.querySelector(sel);
    if (el) el.setAttribute('content', val);
  };
  setMeta('meta[name="description"]',         data.desc);
  setMeta('meta[property="og:title"]',        data.title);
  setMeta('meta[property="og:description"]',  data.desc);
  setMeta('meta[name="twitter:title"]',       data.title);
  setMeta('meta[name="twitter:description"]', data.desc);

  // Canonical lang alternate (basic)
  document.documentElement.lang = {pt:'pt-BR',en:'en',es:'es',ja:'ja',de:'de',fr:'fr'}[lang] || 'pt-BR';
}
