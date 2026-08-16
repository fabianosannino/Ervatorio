// ── UTILS ─────────────────────────────────────────────────────────────────

/** Escapa HTML para prevenir XSS ao interpolar dados em innerHTML */
function esc(s){
  if(s==null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/**
 * Ícones de linha editoriais (substituem emojis na UI, alinhados ao pausa.html).
 * Uso: svgIcon('leaf') -> string SVG. Herda a cor via currentColor e o tamanho
 * via font-size/width do contexto. Passe size para fixar (px).
 */
const _ICON_PATHS = {
  leaf: '<path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z"/><path d="M6 18C10 14 13.5 10.5 17 7.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z"/>',
  map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
  cart: '<circle cx="9" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/><path d="M2.5 4h2.2l2 12h11l2-8H6.7"/>',
  tea: '<path d="M4 9h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M17 10h1.8a2.2 2.2 0 0 1 0 4.4H17"/><path d="M8 3c-.6.8-.6 1.6 0 2.4M12 3c-.6.8-.6 1.6 0 2.4"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  cone: '<path d="M6 3h12l-1.5 5.5a5 5 0 0 1-9 0L6 3z"/><path d="M8 21h8"/><path d="M12 14v7"/>',
  thermometer: '<path d="M12 3a2 2 0 0 1 2 2v8a4 4 0 1 1-4 0V5a2 2 0 0 1 2-2z"/>',
  spoon: '<path d="M12 12v9"/><ellipse cx="12" cy="7" rx="3.5" ry="4.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="1.5"/><path d="M4 9h16M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>'
};
function svgIcon(name, size){
  const p = _ICON_PATHS[name];
  if(!p) return '';
  const dim = size ? `width="${size}" height="${size}"` : 'width="1em" height="1em"';
  return `<svg class="ui-ico" viewBox="0 0 24 24" ${dim} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-.15em">${p}</svg>`;
}

// ── DATA ──────────────────────────────────────────────────────────────────

const HERBS = [
  {id:1,n:"Camomila",lat:"Matricaria chamomilla",icon:"🌼",img:"images/produtos/camomila.jpg",tagline:"Relaxamento e digestão leve",cat:"Calmante",ef:"Calmante suave, anti-inflamatória, digestiva",detail:"Apigenina se liga aos receptores GABA, promovendo relaxamento. Ideal para insônia leve, cólicas e digestão irritada. Segura para crianças, idosos e gestantes.",safe:["gestantes","hipertensos","crianças"],avoid:[],temp:"85°C",tempo:"8 min",dose:"1-2 col. sopa / 250ml",freq:"2-3x ao dia",tags:["calmante","digestiva","anti-inflamatória","sono"],momento:["tarde","qualquer"],bioma:"Europa",usos:["chá","medicinal","aromaterapia","cosméticos"],restricoes_pais:[]},
  {id:2,n:"Valeriana",lat:"Valeriana officinalis",icon:"🌸",img:"images/produtos/valeriana.png",tagline:"Sedação natural para noites difíceis",cat:"Sono",ef:"Sedativa potente, insônia, ansiedade grave",detail:"Actua diretamente no GABA. Reduz tempo para adormecer em 30-60 min. Não associar com álcool ou benzodiazepínicos. Evitar em depressão.",safe:["hipertensos"],avoid:["gestantes","antes de dirigir"],temp:"85°C",tempo:"10 min",dose:"1 col. sopa / 250ml",freq:"1x à noite",tags:["sono","ansiedade","sedativa","calmante"],momento:["noite"],bioma:"Europa",usos:["medicinal","suplemento","chá"],restricoes_pais:["Alemanha: regulada como medicamento, não suplemento alimentar"]},
  {id:3,n:"Maracujá",lat:"Passiflora spp. (P. alata · P. edulis · P. incarnata)",icon:"🌿",img:"images/produtos/maracuja.png",tagline:"Três espécies oficiais brasileiras, uma farmacologia GABAérgica — ansiolítico popular com evidência clínica robusta.",cat:"Calmante",linha:"Essencial",ef:"Ansiolítico — ação monografada, Sedativo leve, Indutor suave de sono",detail:"Três espécies oficiais brasileiras com farmacologia GABAérgica. Flavonoides (vitexina, isovitexina) se ligam ao receptor GABA-A com afinidade baixa, produzindo calma sem sedação pesada. Monografia oficial da Farmacopeia Brasileira.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"95°C",tempo:"10 min",dose:"3 g de folhas secas / 150 ml",freq:"2 a 4 vezes ao dia, fim de tarde e noite",tags:["ansiedade","sono"],momento:["tarde","noite"],bioma:"Mata Atlântica",usos:["chá","medicinal","culinária","coquetel"],restricoes_pais:[]},
  {id:4,n:"Melissa",lat:"Melissa officinalis",icon:"🍃",img:"images/produtos/melissa.png",tagline:"Calma cítrica e equilíbrio mental",cat:"Calmante",ef:"Calmante, antidepressiva suave, digestiva",detail:"Inibe MAO-B, elevando serotonina e dopamina naturalmente. Excelente para quem 'não consegue parar de pensar'. Sabor agradável de limão. Sem risco de dependência.",safe:["gestantes","crianças","hipertensos"],avoid:[],temp:"85°C",tempo:"7 min",dose:"1-2 col. sopa / 250ml",freq:"3x ao dia",tags:["ansiedade","digestiva","calmante","antidepressiva"],momento:["tarde","noite","qualquer"],bioma:"Europa",usos:["chá","medicinal","aromaterapia","culinária"],restricoes_pais:[]},
  {id:5,n:"Gengibre",lat:"Zingiber officinale",icon:"🫚",img:"images/produtos/gengibre.jpg",tagline:"Ativação digestiva e imunidade vibrante",cat:"Digestivo",ef:"Anti-náusea, digestivo, termogênico, antigripal",detail:"Procinético: acelera esvaziamento gástrico. Anti-inflamatório que inibe COX-2 e LOX. Eficaz quanto ibuprofeno para dor menstrual em estudos. Usar fresco para máximo efeito.",safe:["hipertensos"],avoid:["gestantes (doses altas)","anticoagulantes"],temp:"90°C",tempo:"10 min",dose:"3-4 fatias frescas / 300ml",freq:"conforme necessidade",tags:["digestivo","náusea","inflamação","termogênico","gripe"],momento:["manha","qualquer"],bioma:"Ásia",usos:["chá","culinária","medicinal","coquetel"],restricoes_pais:[]},
  {id:6,n:"Chá Verde",lat:"Camellia sinensis",icon:"🍵",img:"images/produtos/matcha.png",tagline:"Energia limpa e foco natural",cat:"Estimulante",ef:"Foco, antioxidante, termogênico, metabolismo",detail:"L-teanina + cafeína: estado único de foco calmo. EGCG: antioxidante mais estudado do mundo. Tomar 30min antes de exercício potencializa queima de gordura.",safe:[],avoid:["gestantes","insônia","hipertensos sensíveis","após 16h"],temp:"75°C",tempo:"3-4 min",dose:"1 col. sopa / 200ml",freq:"1-2x manhã",tags:["foco","energia","metabolismo","antioxidante"],momento:["manha","tarde"],bioma:"Ásia",usos:["chá","culinária","suplemento","cosméticos"],restricoes_pais:[]},
  {id:7,n:"Hibisco",lat:"Hibiscus sabdariffa",icon:"🌺",img:"images/produtos/hibisco.jpg",tagline:"Equilíbrio metabólico e vitamina C",cat:"Cardiovascular",ef:"Hipotensor, antioxidante, emagrecimento, vitamina C",detail:"Estudo JAMA: 3 xícaras/dia reduziram PA sistólica em média 7mmHg. Rico em antocianinas. Inibe amilase, reduzindo absorção de carboidratos. Vermelho intenso, sabor ácido.",safe:[],avoid:["gestantes","pressão baixa","uso com diuréticos"],temp:"90°C",tempo:"8 min",dose:"2 col. sopa / 300ml",freq:"2-3x ao dia",tags:["pressão","antioxidante","emagrecimento","vitamina C"],momento:["qualquer"],bioma:"África",usos:["chá","culinária","coquetel","medicinal"],restricoes_pais:[]},
  {id:8,n:"Alecrim",lat:"Rosmarinus officinalis",icon:"🌿",img:"images/produtos/alecrim.png",tagline:"Foco, memória e despertar natural",cat:"Estimulante",ef:"Foco, memória, circulação, estimulante",detail:"1,8-cineol no aroma já melhora desempenho cognitivo. Estimula circulação cerebral e periférica. Excelente para manhãs lentas e concentração. Sem cafeína.",safe:["hipertensos"],avoid:["gestantes (doses altas)","epilepsia"],temp:"90°C",tempo:"5 min",dose:"1 col. sopa / 200ml",freq:"1-2x ao dia",tags:["foco","memória","energia","circulação"],momento:["manha","tarde"],bioma:"Mediterrâneo",usos:["culinária","aromaterapia","medicinal","chá"],restricoes_pais:[]},
  {id:9,n:"Hortelã",lat:"Mentha piperita",icon:"🌿",img:"images/produtos/hortela.jpg",tagline:"Frescor digestivo e leveza",cat:"Digestivo",ef:"Digestiva, carminativa, descongestionante, fresca",detail:"Mentol relaxa musculatura lisa intestinal. Alivia IBS em estudos clínicos. Descongestionante das vias aéreas. Frio potencializa o efeito mentolado.",safe:["hipertensos","crianças (sem óleo essencial)"],avoid:["gestantes (doses altas)","bebês (óleo)","refluxo grave"],temp:"85°C",tempo:"5 min",dose:"1 col. sopa / 250ml",freq:"após refeições",tags:["digestivo","gases","congestão","frescor"],momento:["qualquer"],bioma:"Mediterrâneo",usos:["chá","culinária","aromaterapia","coquetel"],restricoes_pais:[]},
  {id:10,n:"Erva-doce",lat:"Pimpinella anisum",icon:"🌾",img:"images/produtos/erva-doce.jpg",tagline:"Antigases e conforto abdominal",cat:"Digestivo",ef:"Carminativa, antigases, cólicas, expectorante",detail:"Carminativo clássico: relaxa musculatura intestinal e libera gases. Seguro até para bebês (muito diluído). Combina muito bem com camomila e hortelã.",safe:["hipertensos","crianças","gestantes (uso moderado)"],avoid:[],temp:"90°C",tempo:"7 min",dose:"1 col. sopa / 250ml",freq:"após refeições",tags:["gases","cólicas","digestivo","expectorante"],momento:["qualquer"],bioma:"Mediterrâneo",usos:["chá","culinária","medicinal"],restricoes_pais:[]},
  {id:11,n:"Canela",lat:"Cinnamomum zeylanicum",icon:"🌿",img:"images/produtos/canela.png",tagline:"Termogênica e reguladora de glicemia",cat:"Metabólico",ef:"Termogênica, regula glicemia, anti-inflamatória",detail:"Regula insulina, evita pico glicêmico. Termogênica e adocicada: reduz desejo por doces. Cassia tem cumarina (limitar). Prefira canela-do-ceilão.",safe:["hipertensos"],avoid:["gestantes (doses altas)","anticoagulantes"],temp:"95°C",tempo:"10 min",dose:"1 pau ou 1 col. / 300ml",freq:"2x ao dia",tags:["metabolismo","glicemia","termogênico","digestivo"],momento:["manha","tarde"],bioma:"Ásia",usos:["culinária","chá","medicinal","coquetel"],restricoes_pais:[]},
  {id:12,n:"Cúrcuma",lat:"Curcuma longa",icon:"🫚",img:"images/produtos/curcuma.png",tagline:"Anti-inflamatório potente e protetor hepático",cat:"Anti-inflamatório",ef:"Anti-inflamatório potente, hepático, antioxidante",detail:"Curcumina: inibe COX-2. Eficaz quanto ibuprofeno em artrite em estudos. Adicionar pimenta-do-reino aumenta absorção em 2000%. Leite dourado com leite vegetal.",safe:["hipertensos"],avoid:["gestantes (doses altas)","pedras na vesícula","anticoagulantes"],temp:"90°C",tempo:"10 min",dose:"1 col. chá + pitada pimenta / 250ml",freq:"2x ao dia",tags:["anti-inflamatório","fígado","articulações","antioxidante"],momento:["qualquer"],bioma:"Ásia",usos:["culinária","chá","medicinal","suplemento","cosméticos"],restricoes_pais:[]},
  {id:13,n:"Alfazema",lat:"Lavandula angustifolia",icon:"💜",img:"images/produtos/lavanda.jpg",tagline:"Delicadeza floral e calma profunda",cat:"Calmante",ef:"Ansiolítica, sedativa suave, dor de cabeça",detail:"Estudo Lasea: eficaz quanto lorazepam para ansiedade leve. Reduz ondas beta cerebrais. Aroma + infusão combinados têm efeito sinérgico.",safe:["hipertensos"],avoid:["gestantes"],temp:"85°C",tempo:"8 min",dose:"1 col. sopa flores / 250ml",freq:"2x ao dia",tags:["ansiedade","sono","dor de cabeça","calmante"],momento:["tarde","noite"],bioma:"Mediterrâneo",usos:["aromaterapia","medicinal","chá","culinária","cosméticos"],restricoes_pais:[]},
  {id:14,n:"Boldo",lat:"Peumus boldus",icon:"🍃",img:"images/produtos/boldo-espinheira-santa.png",tagline:"Recuperação e proteção digestiva",cat:"Digestivo",ef:"Hepático, digestivo, alivia peso pós-refeição",detail:"Colagogo clássico: estimula produção e fluxo de bile. Alivia sensação de peso em 20-30 min. Não usar por mais de 6 semanas seguidas.",safe:["hipertensos"],avoid:["gestantes","obstrução biliar","uso prolongado"],temp:"90°C",tempo:"5 min",dose:"1 col. sopa / 250ml",freq:"após refeição gordurosa",tags:["fígado","digestivo","bile","ressaca"],momento:["qualquer"],bioma:"América do Sul",usos:["chá","medicinal"],restricoes_pais:["Alemanha: uso máx. 6 semanas contínuas (BfArM)","Bélgica: deregistrado em 2014"]},
  {id:15,n:"Alcachofra",lat:"Cynara scolymus",icon:"🌱",img:"images/produtos/alcachofra.png",tagline:"Detox hepático e redução de colesterol",cat:"Digestivo",ef:"Detox fígado, reduz colesterol, diurética",detail:"Cinarina: aumenta produção de bile. Colerético + detox suave e progressivo. Combina com boldo para digestão pesada.",safe:["hipertensos"],avoid:["gestantes","obstrução biliar","alergia a asteráceas"],temp:"90°C",tempo:"10 min",dose:"1-2 col. sopa / 300ml",freq:"2x ao dia",tags:["fígado","colesterol","digestivo","detox"],momento:["qualquer"],bioma:"Mediterrâneo",usos:["culinária","chá","suplemento","medicinal"],restricoes_pais:[]},
  {id:16,n:"Guaco",lat:"Mikania glomerata",icon:"🍃",img:"images/produtos/guaco.png",tagline:"Respiração livre e alívio natural",cat:"Respiratório",ef:"Broncodilatador, expectorante, tosse, gripe",detail:"Regulamentado pela ANVISA como fitoterápico. Broncodilatador natural mais eficaz. Pode ser usado como xarope ou chá. 3-4x ao dia em crises.",safe:["hipertensos"],avoid:["gestantes","uso prolongado sem supervisão"],temp:"90°C",tempo:"10 min",dose:"2 col. sopa / 300ml",freq:"3-4x ao dia (gripe)",tags:["tosse","bronquite","gripe","expectorante"],momento:["qualquer"],bioma:"Mata Atlântica",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:17,n:"Capim-Limão",lat:"Cymbopogon citratus",icon:"🌾",img:"images/produtos/capim-limao.png",tagline:"Calmante tropical e digestivo cítrico",cat:"Calmante",ef:"Calmante, digestivo, antigripal, febre",detail:"Sabor cítrico agradável. Calmante sem sonolência intensa. Antipirétic e antigripal suave. Muito consumido no Brasil.",safe:["gestantes","hipertensos","crianças"],avoid:[],temp:"90°C",tempo:"8 min",dose:"2-3 folhas frescas / 300ml",freq:"3x ao dia",tags:["calmante","febre","digestivo","cítrico"],momento:["qualquer"],bioma:"Brasil",usos:["chá","aromaterapia","culinária","coquetel"],restricoes_pais:[]},
  {id:18,n:"Folha de Amora",lat:"Morus nigra",icon:"🍃",img:"images/produtos/hibisco-azul-e-amora.png",tagline:"Equilíbrio hormonal e menopausa",cat:"Hormonal",ef:"Menopausa, suores noturnos, fitoestrogênios",detail:"Fitoestrogênios reduzem sintomas da menopausa. Estudo: reduz calores em 50% em 8 semanas. Hipoglicemiante suave.",safe:["hipertensos"],avoid:["gestantes","câncer hormônio-dependente"],temp:"88°C",tempo:"10 min",dose:"1-2 col. sopa / 250ml",freq:"2x ao dia",tags:["menopausa","hormônios","fitoestrogênio","hipoglicemiante"],momento:["tarde","noite"],bioma:"Ásia",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:19,n:"Erva Cidreira",lat:"Lippia alba",icon:"🍃",img:"images/produtos/erva-cidreira.png",tagline:"Calma suave para toda a família",cat:"Calmante",ef:"Calmante suave, digestiva, ansiedade",detail:"Calmante brasileiro clássico. Suave e seguro para toda a família. Ideal para estresse diário leve sem causar sedação.",safe:["gestantes","crianças","hipertensos"],avoid:[],temp:"85°C",tempo:"7 min",dose:"1-2 col. sopa / 250ml",freq:"3x ao dia",tags:["calmante","ansiedade","digestivo","família"],momento:["tarde","noite","qualquer"],bioma:"Brasil",usos:["chá","medicinal","culinária"],restricoes_pais:[]},
  {id:20,n:"Espinheira Santa",lat:"Maytenus ilicifolia",icon:"🌿",img:"images/produtos/boldo-espinheira-santa.png",tagline:"Antiácido natural e protetor gástrico",cat:"Digestivo",ef:"Gastrite, úlcera, acidez, antiácido natural",detail:"Antiácido e cicatrizante natural da mucosa gástrica. Regulado pela ANVISA. Tomar em jejum e antes das refeições.",safe:["hipertensos"],avoid:["gestantes","amamentação"],temp:"88°C",tempo:"10 min",dose:"1 col. sopa / 250ml",freq:"3x ao dia em jejum",tags:["gastrite","úlcera","acidez","estômago"],momento:["qualquer"],bioma:"Cerrado",usos:["chá","medicinal"],restricoes_pais:["Contraindicada na gestação e amamentação"]},
  {id:21,n:"Carqueja",lat:"Baccharis trimera",icon:"🌿",img:"images/produtos/carqueja.png",tagline:"Controle metabólico e detox hepático",cat:"Metabólico",ef:"Termogênica, digestiva, saciedade, diabetes",detail:"Termogênica e reduz absorção de gordura. Auxiliar no emagrecimento. Amargo: combinar com canela para suavizar.",safe:["hipertensos"],avoid:["gestantes"],temp:"90°C",tempo:"8 min",dose:"1 col. sopa / 250ml",freq:"antes das refeições",tags:["emagrecimento","termogênico","diabetes","fígado"],momento:["manha","tarde"],bioma:"Mata Atlântica",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:22,n:"Ginkgo Biloba",lat:"Ginkgo biloba",icon:"🍃",img:"images/produtos/ginkgo-biloba.png",tagline:"Memória e circulação cerebral",cat:"Cognitivo",ef:"Memória, circulação cerebral, concentração",detail:"Aumenta fluxo sanguíneo cerebral. Resultados em 4-6 semanas de uso contínuo. Evitar com anticoagulantes.",safe:["hipertensos"],avoid:["gestantes","anticoagulantes","antes de cirurgia"],temp:"90°C",tempo:"10 min",dose:"1 col. sopa / 250ml",freq:"2x ao dia",tags:["memória","foco","circulação","cognitivo"],momento:["manha","tarde"],bioma:"Ásia",usos:["suplemento","medicinal","chá"],restricoes_pais:["França: proibida como suplemento alimentar (ANSES 2019)","UE: regulada como medicamento em vários países"]},
  {id:23,n:"Hibisco Azul",lat:"Clitoria ternatea",icon:"💙",img:"images/produtos/hibisco-azul-e-amora.png",tagline:"Antioxidante cerebral que muda de cor",cat:"Cognitivo",ef:"Antioxidante, memória, ansiedade, muda de cor",detail:"Muda de roxo para rosa/vermelho com limão (antocianinas sensíveis ao pH). Antioxidante cerebral. Estudos mostram melhora em testes cognitivos.",safe:["hipertensos"],avoid:["gestantes"],temp:"90°C",tempo:"5 min",dose:"1-2 col. sopa / 250ml",freq:"1-2x ao dia",tags:["cognitivo","antioxidante","memória","beleza"],momento:["tarde","qualquer"],bioma:"Ásia",usos:["chá","culinária","coquetel","cosméticos"],restricoes_pais:[]},
  {id:24,n:"Calêndula",lat:"Calendula officinalis",icon:"🌸",img:"images/produtos/calendula.png",tagline:"Cicatrizante floral e regenerador",cat:"Pele",ef:"Cicatrizante, anti-inflamatória, antifúngica",detail:"Cicatrizante interno e externo. Anti-inflamatória da mucosa e pele. Usar também como compressa.",safe:["hipertensos"],avoid:["gestantes","alergia a asteráceas"],temp:"88°C",tempo:"8 min",dose:"1-2 col. sopa flores / 250ml",freq:"2-3x ao dia",tags:["pele","cicatrizante","anti-inflamatório","gastrite"],momento:["qualquer"],bioma:"Mediterrâneo",usos:["cosméticos","medicinal","chá","culinária"],restricoes_pais:[]},
  {id:25,n:"Rooibos",lat:"Aspalathus linearis",icon:"🍃",img:"images/produtos/rooibos.png",tagline:"Noite sem cafeína, antioxidante único",cat:"Antioxidante",ef:"Antioxidante potente, sem cafeína, anti-aging",detail:"Antioxidante 50x mais potente que chá verde segundo alguns estudos. Sem cafeína: ideal à tarde e noite. Rico em minerais.",safe:["gestantes","crianças","hipertensos"],avoid:[],temp:"95°C",tempo:"5-7 min",dose:"1-2 col. sopa / 300ml",freq:"a qualquer hora",tags:["antioxidante","sem cafeína","anti-aging","pele"],momento:["tarde","noite","qualquer"],bioma:"África",usos:["chá"],restricoes_pais:[]},
  {id:26,n:"Ashwagandha",lat:"Withania somnifera",icon:"🌿",img:"images/produtos/ashwagandha.png",tagline:"Adaptógeno para estresse e cognição",cat:"Adaptogênico",ef:"Reduz cortisol, estresse, energia, libido",detail:"Reduce cortisol em até 30% em estudos. Adaptogênico: acalma sob estresse, energiza sob fadiga. Resultados em 4-8 semanas.",safe:["hipertensos"],avoid:["gestantes","hipertireoidismo","doenças autoimunes"],temp:"90°C",tempo:"10 min",dose:"1 col. chá pó / 250ml",freq:"2x ao dia",tags:["adaptogênico","estresse","cortisol","libido"],momento:["tarde","noite"],bioma:"Ásia",usos:["medicinal","suplemento","chá"],restricoes_pais:["Dinamarca: proibida como suplemento alimentar (2023)","Irlanda: retirada do mercado (2023)","Nova Zelândia: restrita (Medsafe 2023)"]},
  {id:27,n:"Guaraná",lat:"Paullinia cupana",icon:"🫐",img:"images/produtos/guarana.png",tagline:"Energia profunda sul-americana",cat:"Estimulante",ef:"Estimulante, foco, metabolismo, emagrecimento",detail:"Cafeína de liberação mais lenta que o café. Menos pico e queda. Rico em taninos e guaranina.",safe:[],avoid:["gestantes","hipertensos","insônia","crianças","após 15h"],temp:"85°C",tempo:"5 min",dose:"1/2 col. chá pó / 250ml",freq:"1x manhã",tags:["energia","foco","metabolismo","estimulante"],momento:["manha"],bioma:"Amazônia",usos:["chá","suplemento","energético","culinária"],restricoes_pais:[]},
  {id:28,n:"Tomilho",lat:"Thymus vulgaris",icon:"🌿",img:"images/produtos/tomilho.jpg",tagline:"Antisséptico pulmonar e expectorante",cat:"Respiratório",ef:"Expectorante, antisséptico, tosse, bronquite",detail:"Timol: antisséptico pulmonar potente. Usado como xarope na Europa há séculos. Dissolve muco e desinfeta vias aéreas.",safe:["hipertensos"],avoid:["gestantes (doses altas)"],temp:"90°C",tempo:"8 min",dose:"1 col. sopa / 250ml",freq:"3x ao dia",tags:["tosse","expectorante","bronquite","antisséptico"],momento:["qualquer"],bioma:"Mediterrâneo",usos:["culinária","medicinal","aromaterapia","chá"],restricoes_pais:[]},
  {id:29,n:"Aroeira-da-Praia",lat:"Schinus terebinthifolius Raddi",icon:"🌿",img:"images/produtos/aroeira-da-praia.jpg",cat:"Anti-inflamatório",linha:"Funcional",tagline:"Pimenta-rosa brasileira virou cicatrizante ginecológico oficial.",ef:"Anti-inflamatório tópico — monografado, Cicatrizante ginecológico, Adstringente potente",detail:"Planta caiçara com dupla identidade: tempero gourmet (pimenta-rosa) e fitoterápico monografado. Casca em decocção para uso externo ginecológico — anti-inflamatório e cicatrizante via taninos concentrados.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"100°C",tempo:"10 min",dose:"1 g de cascas secas / 150 ml (uso externo)",freq:"banho de assento 3-4x ao dia",tags:["inflamacao","pele","ginecologico","oral"],momento:["qualquer"],bioma:"Mata Atlântica",usos:["medicinal","cosméticos","culinária"],restricoes_pais:[]},
  {id:30,n:"Assa-Peixe",lat:"Vernonia polyanthes Less",icon:"🌿",img:"images/produtos/assa-peixe.jpg",cat:"Respiratório",linha:"Essencial",tagline:"Arbusto de pastagens brasileiras — expectorante oficial da Anvisa.",ef:"Expectorante — monografado, Anti-inflamatório, Broncodilatador leve",detail:"Arbusto pioneiro de pastagens brasileiras. Expectorante monografado pela Anvisa — saponinas estimulam secreção brônquica. Flor importante para apicultura nacional.",safe:["adultos saudáveis","hipertensos"],avoid:["gestantes","lactantes"],temp:"95°C",tempo:"10 min",dose:"3 g de folhas secas / 150 ml",freq:"1x ao dia em quadros agudos",tags:["respiratorio"],momento:["qualquer"],bioma:"Cerrado",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:31,n:"Barbatimão",lat:"Stryphnodendron adstringens (Mart.) Coville",icon:"🌿",img:"images/produtos/barbatimao.jpg",cat:"Pele",linha:"Funcional",tagline:"Árvore do cerrado com casca cicatrizante oficial da Anvisa.",ef:"Cicatrizante — monografado, Adstringente potente, Anti-inflamatório tópico",detail:"Árvore do cerrado com a maior concentração de taninos condensados entre as ervas oficiais brasileiras. Creme cicatrizante monografado — taninos formam película proteica sobre feridas. Uso externo.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"95°C",tempo:"10 min",dose:"Creme: aplicação tópica conforme bula",freq:"2-3x ao dia",tags:["inflamacao","pele","ginecologico","oral"],momento:["qualquer"],bioma:"Cerrado",usos:["medicinal","cosméticos"],restricoes_pais:[]},
  {id:32,n:"Boldo-Baiano",lat:"Vernonia condensata Baker",icon:"🌿",img:"images/produtos/boldo-baiano.jpg",cat:"Digestivo",linha:"Essencial",tagline:"O terceiro boldo brasileiro — folha amarga do quintal nordestino.",ef:"Antidispéptico, Hepatoativo leve, Anti-inflamatório leve",detail:"Terceira planta brasileira chamada 'boldo' — folha amarga com sesquiterpenos lactonas. Antidispéptico monografado. Tradição afro-brasileira no Nordeste.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"95°C",tempo:"10 min",dose:"conforme monografia oficial",freq:"após refeições",tags:["digestao"],momento:["qualquer"],bioma:"Brasil",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:33,n:"Boldo-Brasileiro",lat:"Plectranthus barbatus Andrews",icon:"🌿",img:"images/produtos/boldo-brasileiro.jpg",cat:"Digestivo",linha:"Essencial",tagline:"O boldo do quintal brasileiro — planta africana naturalizada, gentil.",ef:"Antidispéptico — monografado, Colagogo leve, Hepatoativo suave",detail:"Planta africana (Plectranthus barbatus) naturalizada nos quintais brasileiros. Antidispéptico monografado, mais gentil que o boldo-do-chile. Forskolina é seu diterpeno característico.",safe:["adultos saudáveis"],avoid:["gestantes","lactantes","crianças","hipertensos"],temp:"95°C",tempo:"5 min",dose:"1 a 3 g de folhas / 150 ml (1 a 3 folhas frescas)",freq:"2-3x ao dia após refeições pesadas",tags:["digestao","hepatico"],momento:["qualquer"],bioma:"Brasil",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:34,n:"Chambá",lat:"Justicia pectoralis Jacq.",icon:"🌿",img:"images/produtos/chamba.jpg",cat:"Respiratório",linha:"Essencial",tagline:"Erva do Nordeste com aroma de baunilha e ação expectorante oficial.",ef:"Expectorante — monografado, Broncodilatador leve, Antitussígeno suave",detail:"Erva do Ceará com aroma de baunilha (cumarina). Expectorante monografado, permitido a partir dos 3 anos. Base do programa Farmácias Vivas da UFC.",safe:["adultos saudáveis","hipertensos"],avoid:["anticoagulantes"],temp:"95°C",tempo:"10 min",dose:"5 g de partes aéreas / 150 ml",freq:"2-3x ao dia em quadros de tosse",tags:["respiratorio","inflamacao"],momento:["qualquer"],bioma:"Caatinga",usos:["chá","medicinal"],restricoes_pais:["Interação com anticoagulantes (cumarina) — uso cauteloso"]},
  {id:35,n:"Chapéu-de-Couro",lat:"Echinodorus macrophyllus (Kunth) Micheli",icon:"🌿",img:"images/produtos/chapeu-de-couro.jpg",cat:"Urinário",linha:"Funcional",tagline:"Folha larga de brejo brasileiro — diurético e anti-inflamatório oficial.",ef:"Diurético leve — monografado, Anti-inflamatório — monografado, Antidispéptico",detail:"Folha larga de brejos brasileiros. Diurético e anti-inflamatório monografado — diterpenos clerodanos. Uso tradicional em litíase urinária e gota.",safe:["adultos saudáveis"],avoid:["gestantes","lactantes","hipertensos"],temp:"95°C",tempo:"10 min",dose:"1 g de folhas / 150 ml",freq:"3x ao dia antes das refeições",tags:["urinario"],momento:["qualquer"],bioma:"Cerrado",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:36,n:"Copaíba",lat:"Copaifera spp. (C. langsdorffii · C. multijuga · C. reticulata)",icon:"🌿",img:"images/produtos/copaiba.jpg",cat:"Anti-inflamatório",linha:"Funcional",tagline:"Óleo-resina do coração da Amazônia — anti-inflamatório tópico poderoso.",ef:"Anti-inflamatório tópico — monografado, Cicatrizante, Antimicrobiano",detail:"Óleo-resina extraído do tronco de árvores amazônicas centenárias. Pomada anti-inflamatória monografada — beta-cariofileno age no receptor canabinoide CB2. Três espécies oficiais.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"95°C",tempo:"10 min",dose:"Pomada: aplicação tópica conforme bula",freq:"2-3x ao dia em área afetada",tags:["inflamacao","pele"],momento:["qualquer"],bioma:"Amazônia",usos:["medicinal","cosméticos","aromaterapia"],restricoes_pais:[]},
  {id:37,n:"Erva-Baleeira",lat:"Cordia verbenacea DC.",icon:"🌿",img:"images/produtos/erva-baleeira.jpg",cat:"Anti-inflamatório",linha:"Funcional",tagline:"Do litoral atlântico ao primeiro fitoterápico brasileiro patenteado (Acheflan).",ef:"Anti-inflamatório tópico — monografado, Analgésico local, Antimicrobiano tópico",detail:"Planta caiçara do litoral atlântico. Primeiro fitoterápico brasileiro com pesquisa clínica completa (Acheflan). Anti-inflamatório tópico via alfa-humuleno e trans-cariofileno.",safe:["adultos saudáveis","hipertensos"],avoid:[],temp:"95°C",tempo:"10 min",dose:"3 g de folhas / 150 ml (uso externo)",freq:"compressa 3x ao dia",tags:["inflamacao"],momento:["qualquer"],bioma:"Mata Atlântica",usos:["medicinal","cosméticos"],restricoes_pais:[]},
  {id:38,n:"Erva-de-Bicho",lat:"Polygonum punctatum Elliot",icon:"🌿",img:"images/produtos/erva-de-bicho.jpg",cat:"Anti-inflamatório",linha:"Funcional",tagline:"Pimenteira-d'água das várzeas brasileiras — anti-hemorroidal oficial.",ef:"Anti-hemorroidal — monografado, Adstringente (taninos), Hemostático local",detail:"Planta de várzeas brasileiras com sabor picante (polygodial). Anti-hemorroidal monografado — banho de assento. Taninos adstringentes mais leve irritação local produzem efeito contração-cicatrização.",safe:["adultos saudáveis","hipertensos"],avoid:["gestantes","lactantes"],temp:"95°C",tempo:"10 min",dose:"3 g de partes aéreas / 150 ml (uso externo)",freq:"banho de assento 3x ao dia",tags:["hemorroidas"],momento:["qualquer"],bioma:"Brasil",usos:["medicinal"],restricoes_pais:[]},
  {id:39,n:"Erva-Mate",lat:"Ilex paraguariensis A.St.-Hil.",icon:"🧉",img:"images/produtos/erva-mate.jpg",cat:"Estimulante",linha:"Essencial",tagline:"Chimarrão, tererê e chá-mate — estímulo brasileiro por excelência.",ef:"Estimulante, Antioxidante, Termogênico, Diurético leve",detail:"Xantinas (cafeína mais teobromina) e polifenóis. Ritual comunitário do Sul. Consumo muito quente associado a câncer de esôfago (IARC 2A) — evitar acima de 70°C.",safe:["hipertensos (moderado)"],avoid:["gestantes","insônia","crianças","após 16h"],temp:"70°C",tempo:"4 min",dose:"1 col. sopa / 200ml",freq:"manhã-tarde",tags:["energia","foco","termogênico","antioxidante","tradição"],momento:["manha","tarde"],bioma:"Mata Atlântica",usos:["chá","energético","culinária","coquetel"],restricoes_pais:["IARC 2A: bebidas muito quentes (>70°C) associadas a risco de câncer de esôfago"]},
  {id:40,n:"Guaçatonga",lat:"Casearia sylvestris Sw.",icon:"🌿",img:"images/produtos/guacatonga.jpg",cat:"Digestivo",linha:"Essencial",tagline:"Erva-de-bugre da Mata Atlântica — antiulcerosa nativa brasileira.",ef:"Antidispéptico — monografado, Antiulcerogênico, Anti-inflamatório",detail:"Irmã menos famosa da espinheira-santa — antidispéptico e antiulcerogênico monografado. Casearinas (diterpenos clerodanos) com atividade antitumoral em estudos de bancada.",safe:["adultos saudáveis","hipertensos"],avoid:["gestantes","lactantes","crianças"],temp:"95°C",tempo:"5 min",dose:"2 a 4 g de folhas / 150 ml",freq:"2-3x ao dia antes das refeições",tags:["digestao","inflamacao","oral"],momento:["qualquer"],bioma:"Mata Atlântica",usos:["chá","medicinal"],restricoes_pais:[]},
  {id:41,n:"Macela",lat:"Achyrocline satureioides (Lam.) DC.",icon:"🌿",img:"images/produtos/macela.jpg",cat:"Digestivo",linha:"Essencial",tagline:"Flor amarela do pampa — tradição gaúcha de colher na Sexta-Feira Santa.",ef:"Antidispéptico — monografado, Antiespasmódico digestivo, Anti-inflamatório",detail:"Flor amarela do pampa, tradição gaúcha colher na Sexta-Feira Santa. Antidispéptico monografado — flavonoides com ação antiespasmódica e ansiolítica leve. Travesseiros aromáticos do Sul.",safe:["adultos saudáveis","hipertensos"],avoid:["gestantes","crianças"],temp:"95°C",tempo:"5 min",dose:"1,5 g de sumidades floridas / 150 ml",freq:"2-3x ao dia após refeições",tags:["digestao","inflamacao","antiespasmodico"],momento:["noite"],bioma:"Pampas",usos:["chá","medicinal","aromaterapia"],restricoes_pais:[]},
  {id:42,n:"Quebra-Pedra",lat:"Phyllanthus niruri L.",icon:"🌿",img:"images/produtos/quebra-pedra.jpg",cat:"Urinário",linha:"Funcional",tagline:"A erva que dissolve cálculos renais — litolítico oficial da Anvisa.",ef:"Litolítico — monografado, Diurético leve, Anti-inflamatório",detail:"Erva rasteira que reduz formação de cristais urinários. Litolítico monografado pela Anvisa — lignanas (filantina, hipofilantina) previnem nucleação de oxalato de cálcio. Manter hidratação.",safe:["adultos saudáveis","hipertensos"],avoid:["gestantes"],temp:"95°C",tempo:"10 min",dose:"3 g de partes aéreas / 150 ml",freq:"2-3x ao dia",tags:["urinario"],momento:["qualquer"],bioma:"Amazônia",usos:["chá","medicinal"],restricoes_pais:[]},
];

// ── LINHAS ──
// Classificação comercial da erva (linha de produto).
// Essencial: tradicionais brasileiras de uso diário.
// Global: importadas / reconhecidas mundialmente.
// Funcional: nootrópicas, adaptogênicas e especiarias funcionais.
const LINHAS = [
  {id:'Essencial', label:'Essencial', color:'#6fa86a', desc:'Ervas tradicionais brasileiras de uso diário.'},
  {id:'Global',    label:'Global',    color:'#6aa0d8', desc:'Ervas internacionais e chás finos reconhecidos mundialmente.'},
  {id:'Funcional', label:'Funcional', color:'#d89a5a', desc:'Ervas funcionais, adaptógenos e especiarias bioativas.'},
];

const HERB_LINE_MAP = {
  Essencial: [1,3,4,5,9,10,14,15,16,17,18,19,20,21,24,28],
  Global:    [6,7,22,23,25,26,27],
  Funcional: [2,8,11,12,13],
};
(function applyLinhas(){
  for(const [linha, ids] of Object.entries(HERB_LINE_MAP)){
    ids.forEach(id=>{ const h=HERBS.find(x=>x.id===id); if(h) h.linha=linha; });
  }
})();

const SUPPLIERS = [
  {id:1,name:"Ervas & Raízes",type:"Produtor Orgânico",city:"São Paulo, SP",since:"2008",cert:"IBD Orgânico",ship:"Todo Brasil",minOrder:"R$ 80",herbs:["Camomila","Melissa","Erva Cidreira","Calêndula","Alfazema"],color:"#2d5a3a"},
  {id:2,name:"Casa das Plantas",type:"Ervateiro Tradicional",city:"Belo Horizonte, MG",since:"1992",cert:"Artesanal",ship:"Sul/Sudeste",minOrder:"R$ 50",herbs:["Boldo","Guaco","Carqueja","Arruda","Erva-doce"],color:"#4a3a1a"},
  {id:3,name:"Phytofarm Brasil",type:"Distribuidor Nacional",city:"Curitiba, PR",since:"2005",cert:"GMP + ANVISA",ship:"Todo Brasil",minOrder:"R$ 120",herbs:["Ginkgo Biloba","Ashwagandha","Bacopa","Valeriana","Rooibos"],color:"#2a3a5a"},
  {id:4,name:"Verde Vivo",type:"Orgânico & Biodinâmico",city:"Florianópolis, SC",since:"2015",cert:"Demeter Biodinâmico",ship:"Todo Brasil",minOrder:"R$ 100",herbs:["Cúrcuma","Gengibre","Canela","Hibisco","Capim-Limão"],color:"#3a5a2a"},
  {id:5,name:"Temperos do Cerrado",type:"Produtor Regional",city:"Goiânia, GO",since:"2010",cert:"Agroecológico",ship:"Centro-Oeste/Norte",minOrder:"R$ 60",herbs:["Espinheira Santa","Barbatimão","Sucupira","Jatobá","Pau-terra"],color:"#5a4a1a"},
  {id:6,name:"TeaImport",type:"Importador Especializado",city:"São Paulo, SP",since:"2012",cert:"SIF + Vigilância",ship:"Todo Brasil",minOrder:"R$ 150",herbs:["Chá Verde","Chá Branco","Rooibos","Hibisco Azul","Tulsi"],color:"#1a3a5a"},
];

// STATE — safe localStorage parser with fallback
function safeLoad(key, fallback){
  try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(fallback) ? (Array.isArray(v) ? v : fallback) : (v && typeof v === 'object' ? v : fallback); }
  catch(e){ return fallback; }
}
let favorites = safeLoad('erb_favs', []);
let blendTray = safeLoad('erb_tray', []);
let savedRecipes = safeLoad('erb_recipes', []);
let cart = safeLoad('erb_cart', []);
let activeFilters = {search:'',cat:'Todos',safe:'',avoid:'',momento:'',linha:''};
let wizState = {sintomas:[],hora:'',sabor:''};
let activeSup = 'Todos';
let currentHerb = null;

// ── NAVIGATION ──
function goPage(id,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  if(btn) btn.classList.add('on');
  if(id==='favs') renderFavs();
  if(id==='suppliers') renderSuppliers();
  if(id==='roda') initRoda();
  if(id==='perfil') renderPerfil();
  if(id==='sobre') renderSobre();
}

// ── FILTER STATE — 3 independent dimensions ──
// activeFilters.cat   = category string | 'Todos'
// activeFilters.safe  = safe/avoid id string | ''
// activeFilters.momento = moment id string | ''

// ── RING DATA ──
const CATS = ['Todos','Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Cardiovascular','Anti-inflamatório','Antioxidante','Adaptogênico','Pele'];
const SAFE_OPTIONS = [{id:'gestantes',label:'Seguro Gestantes',cls:'safe'},{id:'hipertensos',label:'Seguro Hipertensos',cls:'safe'},{id:'crianças',label:'Seguro Crianças',cls:'safe'},{id:'sem-cafeina',label:'Sem Cafeína',cls:'safe'},{id:'evitar-gestantes',label:'Evitar Gestantes',cls:'danger'},{id:'evitar-hipertensos',label:'Evitar Hipertensos',cls:'danger'}];

const WHEEL_CATS = ['Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Cardiovasc.','Anti-inflam.','Antioxidante','Adaptogên.','Pele'];
const CAT_COLORS = ['#2d5a4a','#1e3d5c','#5a3a1a','#3a5a1e','#1e4a3a','#5a4a1a','#3a2d6b','#6b3a5a','#6b2d3a','#4a1e4a','#2d4a6b','#3d5a2a','#5a3a4a'];

const RING2 = [
  {id:'gestantes', label:'Gestantes', color:'#2d5a3a', type:'safe'},
  {id:'hipertensos',label:'Hipertensos',color:'#1e3d5c', type:'safe'},
  {id:'crianças',  label:'Crianças',   color:'#3a4a2a', type:'safe'},
  {id:'sem-cafeina',label:'S/ Cafeína',color:'#4a3a2a', type:'safe'},
  {id:'evitar-gestantes',  label:'Evitar Gest.', color:'#5a2a2a', type:'avoid'},
  {id:'evitar-hipertensos',label:'Evitar Hiper.',color:'#4a2a3a', type:'avoid'},
];

// Ring 3: moment — each has tags that map to herb tags
const RING3 = [
  {id:'manha', label:'Manhã',   color:'#7a5c2a', tags:['energia','estimulante','termogênico','foco'],
   desc:'Ervas energizantes, termogênicas e de foco para começar o dia com disposição.'},
  {id:'tarde',  label:'Tarde',   color:'#3a5a2a', tags:['foco','digestivo','antioxidante'],
   desc:'Ervas digestivas e de foco para a tarde produtiva, sem comprometer o sono.'},
  {id:'noite',  label:'Noite',   color:'#1a2a4a', tags:['sono','calmante','ansiedade'],
   desc:'Ervas calmantes e sedativas para relaxar e preparar o corpo para o descanso.'},
  {id:'qualquer',label:'Sempre', color:'#2d3a2d', tags:['digestivo','anti-inflamatório','antioxidante'],
   desc:'Ervas de uso livre, seguras e benéficas em qualquer horário do dia.'},
];

// Context descriptions per ring selection
const CAT_CONTEXT = {
  'Calmante':'Ervas que reduzem excitação do sistema nervoso, aliviam ansiedade e promovem relaxamento físico e mental.',
  'Sono':'Ervas sedativas e hipnóticas que facilitam adormecer e melhoram a qualidade do sono profundo.',
  'Digestivo':'Ervas que estimulam a digestão, eliminam gases, protegem a mucosa e suportam fígado e vesícula.',
  'Estimulante':'Ervas que elevam energia, foco e disposição através de cafeína natural ou compostos adaptogênicos.',
  'Respiratório':'Ervas broncodilatadoras, expectorantes e descongestionantes para vias aéreas e pulmões.',
  'Metabólico':'Ervas termogênicas que aceleram o metabolismo, regulam glicemia e apoiam o emagrecimento.',
  'Cognitivo':'Ervas nootrópicas que melhoram memória, concentração, circulação cerebral e clareza mental.',
  'Hormonal':'Ervas com fitoestrogênios e reguladores do ciclo feminino, menopausa e equilíbrio endócrino.',
  'Cardiovascular':'Ervas hipotensoras, vasodilatadoras e protetoras do coração e sistema circulatório.',
  'Anti-inflamatório':'Ervas que inibem vias inflamatórias (COX-2, LOX), aliviando dores e inflamações sistêmicas.',
  'Antioxidante':'Ervas ricas em polifenóis, antocianinas e catequinas que combatem radicais livres e envelhecimento.',
  'Adaptogênico':'Ervas que equilibram o organismo sob estresse — acalmam quando agitado, energizam quando fatigado.',
  'Pele':'Ervas depurativas, cicatrizantes e antioxidantes que melhoram a pele de dentro para fora.',
};

const SAFE_CONTEXT = {
  'gestantes':'Filtrando apenas ervas seguras e comprovadas para gestantes. Excluindo estimulantes, abortivos e contraindicados.',
  'hipertensos':'Mostrando ervas seguras para hipertensos. Excluindo estimulantes e vasoconstritores.',
  'crianças':'Ervas suaves e seguras para uso infantil, sem sedativos fortes nem estimulantes.',
  'sem-cafeina':'Excluindo todas as ervas com cafeína, mateína ou guaranina. Ideal para à noite ou sensíveis.',
  'evitar-gestantes':'Atenção: estas ervas devem ser evitadas na gestação. Use com acompanhamento profissional.',
  'evitar-hipertensos':'Atenção: estas ervas podem elevar pressão ou interagir com anti-hipertensivos.',
};

// HERB_MOMENTO agora integrado em HERBS[].momento

// ── WHEEL ENGINE ──
let wheelHov1=-1, wheelHov2=-1, wheelHov3=-1;
const wheelCanvas = document.getElementById('filterWheel');
const wheelCtx = wheelCanvas.getContext('2d');
// HiDPI: scale canvas 2x for retina sharpness
const DPR = window.devicePixelRatio || 1;
const WHEEL_CSS = 400; // visual size in CSS pixels (bigger)
const WHEEL_SIZE = Math.round(WHEEL_CSS * DPR);
wheelCanvas.width = WHEEL_SIZE;
wheelCanvas.height = WHEEL_SIZE;
wheelCanvas.style.width = WHEEL_CSS + 'px';
wheelCanvas.style.height = WHEEL_CSS + 'px';
wheelCtx.scale(DPR, DPR);
const WHEEL_CX = WHEEL_CSS/2, WHEEL_CY = WHEEL_CSS/2;
const R_OUTER = 190, R_MIDDLE = 135, R_INNER = 88, R_CENTER = 44; // ring radii (px) — scaled up

function lightenW(hex,amt){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+Math.round(90*amt))},${Math.min(255,g+Math.round(90*amt))},${Math.min(255,b+Math.round(90*amt))})`;
}

function getRing(mx,my){
  const dx=mx-WHEEL_CX, dy=my-WHEEL_CY, d=Math.sqrt(dx*dx+dy*dy);
  if(d<R_CENTER) return {ring:0,idx:-1};
  let a=Math.atan2(dy,dx)+Math.PI/2;
  if(a<0)a+=2*Math.PI; if(a>=2*Math.PI)a-=2*Math.PI;
  if(d<=R_INNER)  return {ring:3, idx:Math.floor(a/(2*Math.PI/RING3.length))%RING3.length};
  if(d<=R_MIDDLE) return {ring:2, idx:Math.floor(a/(2*Math.PI/RING2.length))%RING2.length};
  if(d<=R_OUTER) return {ring:1, idx:Math.floor(a/(2*Math.PI/WHEEL_CATS.length))%WHEEL_CATS.length};
  return {ring:0,idx:-1};
}

function drawRingSlices(n, rOuter, rInner, items, getColor, isSel, isHov, getLabel){
  const arc=2*Math.PI/n, start=-Math.PI/2;
  items.forEach((item,i)=>{
    const a0=start+i*arc, a1=a0+arc;
    const sel=isSel(i), hov=isHov(i);
    // slice
    wheelCtx.beginPath(); wheelCtx.moveTo(WHEEL_CX,WHEEL_CY);
    wheelCtx.arc(WHEEL_CX,WHEEL_CY,rOuter,a0,a1); wheelCtx.closePath();
    wheelCtx.fillStyle = sel ? lightenW(getColor(i),.42) : hov ? lightenW(getColor(i),.2) : getColor(i);
    wheelCtx.fill();
    // border
    wheelCtx.strokeStyle = sel ? 'rgba(200,168,75,.7)' : 'rgba(11,10,8,.65)';
    wheelCtx.lineWidth = sel ? 1.5 : 1;
    wheelCtx.stroke();
    // selected glow ring
    if(sel){
      wheelCtx.beginPath(); wheelCtx.moveTo(WHEEL_CX,WHEEL_CY);
      wheelCtx.arc(WHEEL_CX,WHEEL_CY,rOuter-1,a0+.02,a1-.02); wheelCtx.closePath();
      wheelCtx.strokeStyle='rgba(240,217,138,.35)'; wheelCtx.lineWidth=2; wheelCtx.stroke();
    }
    // label
    const mA=a0+arc/2, lr=(rOuter+rInner)/2;
    const lx=WHEEL_CX+lr*Math.cos(mA), ly=WHEEL_CY+lr*Math.sin(mA);
    wheelCtx.save(); wheelCtx.translate(lx,ly); wheelCtx.rotate(mA+Math.PI/2);
    wheelCtx.fillStyle = sel?'#f0d98a': hov?'#e6c96e':'rgba(235,225,205,.75)';
    const fsize = rOuter===R_OUTER ? 11.5 : rOuter===R_MIDDLE ? 10 : 9.5;
    wheelCtx.font=`${sel?'500':'400'} ${fsize}px Jost,sans-serif`;
    wheelCtx.textAlign='center'; wheelCtx.textBaseline='middle';
    const lbl=getLabel(i); const parts=lbl.split(' ');
    if(parts.length>1){ wheelCtx.fillText(parts[0],0,-5); wheelCtx.fillText(parts.slice(1).join(' '),0,5); }
    else wheelCtx.fillText(lbl,0,0);
    wheelCtx.restore();
  });
}

function drawWheel(){
  wheelCtx.clearRect(0,0,WHEEL_CSS,WHEEL_CSS);

  // Ring 1: Categories (outer)
  drawRingSlices(WHEEL_CATS.length, R_OUTER, R_MIDDLE, WHEEL_CATS,
    i=>CAT_COLORS[i],
    i=>activeFilters.cat===WHEEL_CATS[i],
    i=>wheelHov1===i,
    i=>WHEEL_CATS[i]);

  // Ring 2: Safe/Avoid (middle)
  drawRingSlices(RING2.length, R_MIDDLE, R_INNER, RING2,
    i=>RING2[i].color,
    i=>activeFilters.safe===RING2[i].id,
    i=>wheelHov2===i,
    i=>RING2[i].label);

  // Ring 3: Momento (inner)
  drawRingSlices(RING3.length, R_INNER, R_CENTER, RING3,
    i=>RING3[i].color,
    i=>activeFilters.momento===RING3[i].id,
    i=>wheelHov3===i,
    i=>RING3[i].label);

  // Ring separator lines
  [R_MIDDLE,R_INNER].forEach(r=>{
    wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,r,0,Math.PI*2);
    wheelCtx.strokeStyle='rgba(200,168,75,.3)'; wheelCtx.lineWidth=1.5; wheelCtx.stroke();
  });
  // outer ring
  wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,R_OUTER+3,0,Math.PI*2);
  wheelCtx.strokeStyle='rgba(200,168,75,.12)'; wheelCtx.lineWidth=1; wheelCtx.stroke();

  // Center
  wheelCtx.beginPath(); wheelCtx.arc(WHEEL_CX,WHEEL_CY,R_CENTER,0,Math.PI*2);
  wheelCtx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#1a3a2a'; wheelCtx.fill();
  wheelCtx.strokeStyle='rgba(200,168,75,.45)'; wheelCtx.lineWidth=1.5; wheelCtx.stroke();

  updateWheelCenter();
  updateFilterContext();
  buildLegend();
}

// Hover
wheelCanvas.addEventListener('mousemove',e=>{
  const rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(e.clientX-rect.left, e.clientY-rect.top);
  wheelHov1=ring===1?idx:-1; wheelHov2=ring===2?idx:-1; wheelHov3=ring===3?idx:-1;
  wheelCanvas.style.cursor=(ring>0&&idx>=0)?'pointer':'default';
  drawWheel();
});
wheelCanvas.addEventListener('mouseleave',()=>{ wheelHov1=wheelHov2=wheelHov3=-1; drawWheel(); });

// Click — each ring is fully independent
function handleWheelClick(ring,idx){
  if(ring===1 && idx>=0){
    const cat=WHEEL_CATS[idx];
    activeFilters.cat = activeFilters.cat===cat ? 'Todos' : cat;
  } else if(ring===2 && idx>=0){
    const item=RING2[idx];
    activeFilters.safe = activeFilters.safe===item.id ? '' : item.id;
  } else if(ring===3 && idx>=0){
    const m=RING3[idx];
    activeFilters.momento = activeFilters.momento===m.id ? '' : m.id;
  }
  drawWheel(); buildFilters(); renderHerbs();
}
wheelCanvas.addEventListener('click',e=>{
  const rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(e.clientX-rect.left,e.clientY-rect.top);
  handleWheelClick(ring,idx);
});
wheelCanvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  const t=e.touches[0], rect=wheelCanvas.getBoundingClientRect();
  const {ring,idx}=getRing(t.clientX-rect.left,t.clientY-rect.top);
  handleWheelClick(ring,idx);
},{passive:false});

function updateWheelCenter(){
  const activeCount = [
    activeFilters.cat&&activeFilters.cat!=='Todos',
    activeFilters.safe!=='',
    activeFilters.momento!=='',
    activeFilters.linha!=='',
  ].filter(Boolean).length;
  const el=document.getElementById('wcCat');
  if(activeCount===0){ el.textContent='Toque\num anel'; el.style.fontSize='.55rem'; }
  else { el.textContent=`${activeCount} filtro${activeCount>1?'s':''}`;  el.style.fontSize='.65rem'; }
  // lines
  const parts=[];
  if(activeFilters.cat&&activeFilters.cat!=='Todos') parts.push(activeFilters.cat);
  if(activeFilters.linha) parts.push(LINHAS.find(l=>l.id===activeFilters.linha)?.label||'');
  if(activeFilters.safe) parts.push(RING2.find(r=>r.id===activeFilters.safe)?.label||'');
  if(activeFilters.momento) parts.push(RING3.find(r=>r.id===activeFilters.momento)?.label||'');
  document.getElementById('wcSafe').textContent=parts.join(' + ');
}

function updateFilterContext(){
  const box=document.getElementById('filterContext');
  if(!box) return;
  const lines=[];
  if(activeFilters.momento){
    const m=RING3.find(r=>r.id===activeFilters.momento);
    if(m) lines.push({label:`Momento: ${m.label}`, text:m.desc, color:'#4a6a9a'});
  }
  if(activeFilters.cat&&activeFilters.cat!=='Todos'){
    const text=CAT_CONTEXT[activeFilters.cat]||'';
    if(text) lines.push({label:`Categoria: ${activeFilters.cat}`, text, color:'#c8a84b'});
  }
  if(activeFilters.linha){
    const l=LINHAS.find(x=>x.id===activeFilters.linha);
    if(l) lines.push({label:`Linha: ${l.label}`, text:l.desc, color:l.color});
  }
  if(activeFilters.safe){
    const text=SAFE_CONTEXT[activeFilters.safe]||'';
    if(text){
      const item=RING2.find(r=>r.id===activeFilters.safe);
      lines.push({label:`Filtro de segurança: ${item?.label||''}`, text, color:item?.type==='avoid'?'#c86060':'#4a8a5a'});
    }
  }
  if(!lines.length){ box.innerHTML=''; box.style.display='none'; return; }
  box.style.display='block';
  box.innerHTML=lines.map(l=>`
    <div style="margin-bottom:${lines.length>1?.75:0}rem;padding-left:.75rem;border-left:2px solid ${l.color}">
      <div style="font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:${l.color};margin-bottom:2px">${l.label}</div>
      <div style="font-size:.78rem;color:var(--cream2);line-height:1.6">${l.text}</div>
    </div>`).join('');
}

function buildLegend(){
  const leg=document.getElementById('wheelLegend');
  leg.innerHTML='';
  const rings=[
    {label:'Categoria',    color:'#c8a84b', active: activeFilters.cat&&activeFilters.cat!=='Todos' ? activeFilters.cat : null},
    {label:'Linha',        color:'#b8854a', active: activeFilters.linha ? (LINHAS.find(l=>l.id===activeFilters.linha)?.label||null) : null},
    {label:'Segurança',    color:'#4a8a5a', active: activeFilters.safe ? (RING2.find(r=>r.id===activeFilters.safe)?.label||null) : null},
    {label:'Momento',      color:'#4a6a9a', active: activeFilters.momento ? (RING3.find(r=>r.id===activeFilters.momento)?.label||null) : null},
  ];
  rings.forEach(({label,color,active})=>{
    const d=document.createElement('div');
    d.className='legend-item'+(active?' active':'');
    d.innerHTML=`<span class="legend-dot" style="background:${color};${active?'':'opacity:.4'}"></span>`+
      `<span style="color:${active?color:'var(--muted)'}">${active?active:label}</span>`+
      (active?`<span style="color:var(--muted);font-size:.65rem;margin-left:4px">✕</span>`:'');
    if(active){
      d.style.cursor='pointer';
      d.onclick=()=>{
        if(label==='Categoria') activeFilters.cat='Todos';
        else if(label==='Linha') activeFilters.linha='';
        else if(label==='Segurança') activeFilters.safe='';
        else activeFilters.momento='';
        drawWheel(); buildFilters(); renderHerbs();
      };
    }
    leg.appendChild(d);
  });
}

// ── COLLAPSE TOGGLE ──
let filtersOpen=false;
function toggleFilters(){
  filtersOpen=!filtersOpen;
  document.getElementById('filtersCollapse').classList.toggle('open',filtersOpen);
  document.getElementById('toggleArrow').classList.toggle('open',filtersOpen);
}

function clearAllFilters(){
  activeFilters={search:'',cat:'Todos',safe:'',avoid:'',momento:'',linha:''};
  document.getElementById('searchInput').value='';
  drawWheel(); buildFilters(); renderHerbs();
  toast('Filtros limpos');
}

// ── INTENÇÕES — entrada por linguagem natural ──
function aplicarIntencao(intencao){
  const mapa = {
    'sono':       {cat:'Sono',     safe:'',          momento:'noite'},
    'foco':       {cat:'Estimulante', safe:'',       momento:'manha'},
    'digestao':   {cat:'Digestivo',safe:'',           momento:''},
    'ansiedade':  {cat:'Calmante', safe:'',           momento:''},
    'imunidade':  {cat:'Todos',    safe:'',           momento:'', search:'imunidade'},
    'explorar':   null,
  };
  if(intencao==='explorar'){ goPage('roda',document.querySelector('.nav-tab:nth-child(2)')); return; }
  const filtros = mapa[intencao];
  if(!filtros) return;
  activeFilters.cat = filtros.cat;
  activeFilters.safe = filtros.safe;
  activeFilters.momento = filtros.momento;
  activeFilters.linha = '';
  if(filtros.search) document.getElementById('searchInput').value = filtros.search;
  drawWheel(); buildFilters(); renderHerbs();
  document.getElementById('herbGrid').scrollIntoView({behavior:'smooth',block:'start'});
  toast('Mostrando ervas para: '+intencao);
}

function buildFilters(){
  const row = document.getElementById('filterRow');
  row.innerHTML = '';
  // ── label helper ──
  const addLabel = (txt,color)=>{
    const l=document.createElement('div');
    l.style.cssText=`width:100%;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:${color};margin:6px 0 3px;font-weight:400`;
    l.textContent=txt; row.appendChild(l);
  };
  addLabel('Categoria','#c8a84b');
  CATS.forEach(c=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeFilters.cat===c?' on':'');
    b.textContent=c;
    b.onclick=()=>{ activeFilters.cat=c; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Linha','#b8854a');
  LINHAS.forEach(l=>{
    const b=document.createElement('button');
    const isOn = activeFilters.linha===l.id;
    b.className=`fchip fchip-linha linha-${l.id.toLowerCase()}`+(isOn?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ activeFilters.linha = activeFilters.linha===l.id?'':l.id; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Momento do dia','#4a6a9a');
  RING3.forEach(m=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeFilters.momento===m.id?' on':'');
    b.textContent=m.label;
    b.onclick=()=>{ activeFilters.momento=activeFilters.momento===m.id?'':m.id; drawWheel(); buildFilters(); renderHerbs(); };
    row.appendChild(b);
  });
  addLabel('Segurança','#4a8a5a');
  SAFE_OPTIONS.forEach(s=>{
    const b=document.createElement('button');
    const isOn = activeFilters.safe===s.id;
    b.className=`fchip ${s.cls}`+(isOn?' on':'');
    b.textContent=s.label;
    b.onclick=()=>{
      if(s.cls==='safe') activeFilters.safe = activeFilters.safe===s.id?'':s.id;
      else activeFilters.safe = activeFilters.safe===s.id?'':s.id;
      drawWheel(); buildFilters(); renderHerbs();
    };
    row.appendChild(b);
  });
}

/** Pure filter logic — testable without DOM */
function filterHerbs(herbs, query, filters){
  return herbs.filter(h=>{
    const txt = (h.n+h.lat+h.ef+h.tags.join(' ')).toLowerCase();
    if(query && !txt.includes(query)) return false;
    if(filters.cat!=='Todos' && h.cat!==filters.cat) return false;
    if(filters.linha && h.linha!==filters.linha) return false;
    if(filters.momento && !(h.momento||[]).includes(filters.momento)) return false;
    if(filters.safe==='gestantes' && !h.safe.includes('gestantes')) return false;
    if(filters.safe==='hipertensos' && !h.safe.includes('hipertensos')) return false;
    if(filters.safe==='crianças' && !h.safe.includes('crianças')) return false;
    if(filters.safe==='sem-cafeina' && h.avoid.some(a=>a.includes('cafeína'))) return false;
    if(filters.safe==='evitar-gestantes' && !h.avoid.some(a=>a.includes('gestantes'))) return false;
    if(filters.safe==='evitar-hipertensos' && !h.avoid.some(a=>a.includes('hipertensos'))) return false;
    return true;
  });
}

let _herbCardsBuilt = false;
function resetHerbCards(){ _herbCardsBuilt = false; }

function buildHerbCards(){
  if(_herbCardsBuilt) return;
  const grid = document.getElementById('herbGrid');
  grid.innerHTML = HERBS.map(h=>`
    <div class="herb-card" data-herb-id="${h.id}" onclick="openHerbModal(${h.id})">
      <div class="hc-top">
        ${h.img
          ? `<img class="herb-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<span style=\\'font-size:1.3rem\\'>${h.icon}</span>'">`
          : `<span style="font-size:1.3rem">${h.icon}</span>`
        }
        <button class="hc-fav ${favorites.includes(h.id)?'on':''}" onclick="toggleFav(event,${h.id})" title="Favoritar" aria-label="Favoritar ${esc(h.n)}">♥</button>
        <button class="hc-blend ${blendTray.includes(h.id)?'on':''}" data-blend-herb="${h.id}" onclick="event.stopPropagation();toggleTrayModal(${h.id})" title="Selecionar para blend">＋</button>
      </div>
      <div class="hc-name">${esc(h.n)}</div>
      ${h.tagline ? `<div class="hc-tagline">${esc(h.tagline)}</div>` : ''}
      <div class="hc-latin">${esc(h.lat)}</div>
      <div class="hc-effect">${esc(h.ef)}</div>
      <div class="hc-tags">
        <span class="htag htag-cat">${esc(h.cat)}</span>
        ${h.linha?`<span class="htag htag-linha linha-${h.linha.toLowerCase()}">${esc(h.linha)}</span>`:''}
        ${(h.momento||[]).map(m=>{const mo=RING3.find(r=>r.id===m); return mo?`<span class="htag" style="background:${mo.color}22;border:0.5px solid ${mo.color}44;color:${mo.color}">${esc(mo.label)}</span>`:''}).join('')}
        ${h.safe.slice(0,1).map(s=>`<span class="htag htag-safe">✓ ${esc(s)}</span>`).join('')}
        ${h.avoid.length?`<span class="htag htag-warn">⚠ ${esc(h.avoid[0])}</span>`:''}
      </div>
    </div>
  `).join('');
  _herbCardsBuilt = true;
}

function renderHerbs(){
  buildHerbCards();
  const q = document.getElementById('searchInput').value.toLowerCase();
  const visibleIds = new Set(filterHerbs(HERBS, q, activeFilters).map(h=>h.id));
  const grid = document.getElementById('herbGrid');
  const cards = grid.querySelectorAll('.herb-card');
  cards.forEach(card => {
    const id = parseInt(card.dataset.herbId);
    card.style.display = visibleIds.has(id) ? '' : 'none';
    // Update fav state without full rebuild
    const favBtn = card.querySelector('.hc-fav');
    if(favBtn) favBtn.classList.toggle('on', favorites.includes(id));
  });
  // Update count summary
  let countEl = grid.querySelector('.herb-count');
  const hasFilter = activeFilters.cat!=='Todos'||activeFilters.safe||activeFilters.momento||activeFilters.linha||q;
  if(!countEl){ countEl=document.createElement('div'); countEl.className='herb-count'; countEl.style.cssText='font-size:.75rem;color:var(--muted);margin-bottom:.75rem;grid-column:1/-1'; grid.prepend(countEl); }
  countEl.textContent = hasFilter ? `${visibleIds.size} de ${HERBS.length} ervas` : '';
  countEl.style.display = hasFilter ? '' : 'none';
  // No-results message
  let noRes = grid.querySelector('.no-results');
  if(!visibleIds.size && !noRes){ noRes=document.createElement('div'); noRes.className='no-results'; noRes.style.gridColumn='1/-1'; noRes.textContent='Nenhuma erva encontrada com esses filtros'; grid.appendChild(noRes); }
  if(noRes) noRes.style.display = visibleIds.size ? 'none' : '';
}

// ── HERB MODAL ──
function openHerbModal(id){
  currentHerb = HERBS.find(h=>h.id===id);
  if(typeof trackAction==='function') trackAction('view-herb', id);
  const h = currentHerb;
  const inTray = blendTray.includes(h.id);
  document.getElementById('modalContent').innerHTML=`
    <div class="modal-handle"></div>
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-herb-header">
      ${h.img
        ? `<img class="modal-herb-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'modal-herb-img modal-herb-icon\\'>${h.icon}</div>'">`
        : `<div class="modal-herb-img modal-herb-icon">${h.icon}</div>`
      }
      <div class="modal-herb-header-info">
        <div class="modal-herb-name">${esc(h.n)}</div>
        ${h.tagline ? `<div class="modal-tagline">${esc(h.tagline)}</div>` : ''}
        <div class="modal-latin">${esc(h.lat)}</div>
        ${h.linha?`<div class="modal-linha"><span class="htag htag-linha linha-${h.linha.toLowerCase()}">Linha ${esc(h.linha)}</span></div>`:''}
        ${h.bioma?`<div class="modal-bioma-row"><span class="herb-bioma-badge">${svgIcon('globe')} ${esc(h.bioma)}</span></div>`:''}
      </div>
    </div>
    ${h.usos&&h.usos.length?`<div class="modal-usos-row">${h.usos.map(u=>`<span class="herb-uso-chip">${esc(u)}</span>`).join('')}</div>`:''}
    <button id="modalBlendBtn" data-blend-herb="${h.id}" class="modal-blend-toggle ${inTray?'in-tray':''}" onclick="toggleTrayModal(${h.id})">
      ${inTray?'✓ Selecionado para blend':'＋ Selecionar para blend'}
    </button>
    <div class="modal-section">
      <div class="modal-label">Sobre</div>
      <div class="modal-text">${esc(h.detail)}</div>
    </div>
    <div class="modal-section">
      <div class="modal-label">Como preparar</div>
      <div class="prep-grid">
        <div class="prep-item"><div class="prep-val">${esc(h.temp)}</div><div class="prep-key">Temperatura</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.tempo)}</div><div class="prep-key">Infusão</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.dose)}</div><div class="prep-key">Dose</div></div>
        <div class="prep-item"><div class="prep-val">${esc(h.freq)}</div><div class="prep-key">Frequência</div></div>
      </div>
    </div>
    ${h.avoid&&h.avoid.length?`<div class="warn-box">⚠ Contraindicações: ${h.avoid.map(a=>esc(a)).join(', ')}</div>`:''}
    ${h.safe&&h.safe.length?`<div class="safe-box">✓ Seguro para: ${h.safe.map(s=>esc(s)).join(', ')}</div>`:''}
    ${h.restricoes_pais&&h.restricoes_pais.length?`<div class="restricoes-box">${svgIcon('globe')} Restrições regionais:<ul>${h.restricoes_pais.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}
    <div id="modalFichaSlot"></div>
    <div style="display:flex;gap:8px;margin-top:1rem">
                <button class="add-blend-btn" style="flex:1;background:rgba(200,168,75,.15)" onclick="openTimer(${h.id})">${_clockIcon()} Preparar agora</button>
          <button class="add-blend-btn" style="flex:1" onclick="addToTray(${h.id})">${svgIcon('leaf')} Ver no Blend</button>
    </div>
  `;
  document.getElementById('herbModal').classList.add('on');
  loadFichaForHerb(h);
}

// Resolve ficha local (FICHAS_ANCORA) pelo nome ou nome científico da erva
function _fichaAncoraForHerb(h){
  if(typeof FICHAS_ANCORA==='undefined') return null;
  const _n = s=>String(s||'').normalize('NFC').toLowerCase().replace(/[àáâãä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/ç/g,'c').trim();
  const hn = _n(h.n);
  const hl = h.lat ? _n(h.lat.split(' ').slice(0,2).join(' ')) : '';
  for(const [slug, f] of Object.entries(FICHAS_ANCORA)){
    if(_n(f.nome_popular)===hn) return f;
    if(hl && f.nome_cientifico && _n(f.nome_cientifico).startsWith(hl)) return f;
  }
  return null;
}

// Busca a ficha editorial — primeiro no cache local, depois no Supabase.
async function loadFichaForHerb(h){
  const slot = document.getElementById('modalFichaSlot');
  if(!slot) return;
  if(slot.dataset.herbId===String(h.id)) return;
  slot.dataset.herbId = String(h.id);

  // 1. Tentar cache local imediatamente (sem latência)
  const ancora = _fichaAncoraForHerb(h);
  if(ancora){
    slot.innerHTML = `<button class="ficha-cta" onclick="openFichaAncora(${JSON.stringify(ancora.slug)})">Ver ficha completa<span class="ficha-cta-arrow">→</span></button>`;
    return;
  }

  // 2. Fallback: Supabase
  if(typeof ervaria==='undefined') return;
  try {
    const ficha = await ervaria.loadFichaByLatin(h.lat);
    if(!ficha) return;
    slot.innerHTML = `<button class="ficha-cta" onclick="openFicha(${JSON.stringify(ficha.slug||'')})">Ver ficha completa<span class="ficha-cta-arrow">→</span></button>`;
  } catch(_) {}
}

// Abre ficha a partir do cache local FICHAS_ANCORA
function openFichaAncora(slug){
  if(typeof FICHAS_ANCORA==='undefined' || !FICHAS_ANCORA[slug]){ toast('Ficha indisponível'); return; }
  _currentFicha = FICHAS_ANCORA[slug];
  renderFichaModal(_currentFicha);
}

let _currentFicha = null;
async function openFicha(slug){
  // 1. Tentar cache local
  if(typeof FICHAS_ANCORA!=='undefined' && FICHAS_ANCORA[slug]){
    _currentFicha = FICHAS_ANCORA[slug];
    renderFichaModal(_currentFicha);
    return;
  }
  // 2. Supabase
  if(typeof ervaria==='undefined'){ toast('Ficha indisponível'); return; }
  let ficha = null;
  try { ficha = await ervaria.loadFichaBySlug(slug); } catch(_) {}
  if(!ficha){ toast('Ficha indisponível'); return; }
  _currentFicha = ficha;
  renderFichaModal(ficha);
}

function closeFicha(){
  const ov = document.getElementById('fichaOverlay');
  if(ov) ov.classList.remove('on');
  _currentFicha = null;
}

function renderFichaModal(f){
  let ov = document.getElementById('fichaOverlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'fichaOverlay';
    ov.className = 'ficha-overlay';
    ov.onclick = (e)=>{ if(e.target===ov) closeFicha(); };
    document.body.appendChild(ov);
  }
  const id = f.identificacao || {};
  const car = f.caracterizacao || {};
  const pr = f.preparo || {};
  const ps = f.perfil_sensorial || {};
  const ac = f.acoes_e_seguranca || {};
  const cu = f.cultura || {};
  const rg = f.regulacao || {};
  const mk = f.marketplace || {};
  const _nrm = s=>String(s||'').normalize('NFC').toLowerCase().trim();
  let fichaHerb = HERBS.find(h=>
    _nrm(h.n)===_nrm(f.nome_popular)||
    (h.lat&&f.nome_cientifico&&_nrm(f.nome_cientifico).startsWith(_nrm(h.lat.split(' ').slice(0,2).join(' '))))
  );
  if(!fichaHerb&&f.nome_popular){
    const _stableId=n=>{let h=5381;for(let i=0;i<n.length;i++)h=((h<<5)+h)^n.charCodeAt(i);return(h>>>0)%90000+10000;};
    fichaHerb={id:_stableId(f.nome_popular),n:f.nome_popular,lat:f.nome_cientifico||'',icon:'🌿',cat:'',ef:'',tags:[],safe:[],avoid:[],temp:pr.temperatura_ideal||'',tempo:pr.tempo_de_infusao||'',dose:pr.quantidade||'',freq:pr.melhor_momento||'',tagline:f.tagline||''};
    if(!HERBS.find(h=>h.id===fichaHerb.id))HERBS.push(fichaHerb);
  }
  const fichaHerbId = fichaHerb ? fichaHerb.id : null;
  const listMaybe = (v) => Array.isArray(v) ? v.map(x=>`<li>${esc(x)}</li>`).join('') : (v?`<li>${esc(v)}</li>`:'');
  const paragraphs = (v) => Array.isArray(v) ? v.map(x=>`<p>${esc(x)}</p>`).join('') : (v?`<p>${esc(v)}</p>`:'');
  const dlList = (arr, keyA='label', keyB='texto') => Array.isArray(arr)
    ? arr.map(x=>`<div class="ficha-kv"><dt>${esc(x[keyA])}</dt><dd>${esc(x[keyB])}</dd></div>`).join('')
    : '';
  const gustativo = Array.isArray(ps.gustativo) ? ps.gustativo : [];
  const trig = Array.isArray(ps.trigeminal) ? ps.trigeminal : [];
  const evid = Array.isArray(ac.evidencia) ? ac.evidencia : [];

  ov.innerHTML = `
    <article class="ficha-card" role="dialog" aria-label="Ficha ${esc(f.nome_popular||'')}">
      <button class="ficha-close" onclick="closeFicha()" aria-label="Fechar">✕</button>

      <header class="ficha-hero">
        <h1 class="ficha-title">${esc(f.nome_popular||'')}</h1>
        <div class="ficha-latin">${esc(f.nome_cientifico||'')}</div>
        ${f.tagline?`<blockquote class="ficha-tagline">${esc(f.tagline)}</blockquote>`:''}
        ${Array.isArray(f.destaques)&&f.destaques.length?`
          <ul class="ficha-destaques">
            ${f.destaques.map(d=>`<li><strong>${esc(d.label)}</strong> ${esc(d.texto)}</li>`).join('')}
          </ul>`:''}
        ${fichaHerbId!==null?`
          <div class="ficha-action-row">
            <button data-fav-herb="${fichaHerbId}" class="ficha-fav-btn${favorites.includes(fichaHerbId)?' on':''}" onclick="toggleFichaFav(${fichaHerbId})">
              ${favorites.includes(fichaHerbId)?'♥ Favorito':'♡ Favoritar'}
            </button>
            <button data-blend-herb="${fichaHerbId}" class="modal-blend-toggle${blendTray.includes(fichaHerbId)?' in-tray':''}" onclick="toggleTrayModal(${fichaHerbId})" style="flex:1">
              ${blendTray.includes(fichaHerbId)?'✓ Selecionado para blend':'＋ Selecionar para blend'}
            </button>
          </div>`:''}
      </header>

      ${ac.alerta_critico?`
        <section class="ficha-alert" role="alert">
          <div class="ficha-alert-title">⚠ ${esc(ac.alerta_critico.titulo||'Alerta crítico')}</div>
          ${ac.alerta_critico.titulo2?`<div class="ficha-alert-sub">${esc(ac.alerta_critico.titulo2)}</div>`:''}
          <div class="ficha-alert-body">${esc(ac.alerta_critico.corpo||'')}</div>
        </section>`:''}

      <section class="ficha-section">
        <h2>Identificação</h2>
        <dl class="ficha-dl">
          ${id.nome_cientifico?`<div class="ficha-kv"><dt>Nome científico</dt><dd><em>${esc(id.nome_cientifico)}</em></dd></div>`:''}
          ${id.familia_botanica?`<div class="ficha-kv"><dt>Família</dt><dd>${esc(id.familia_botanica)}</dd></div>`:''}
          ${id.tipo_botanico?`<div class="ficha-kv"><dt>Tipo</dt><dd>${esc(id.tipo_botanico)}</dd></div>`:''}
          ${id.parte_usada?`<div class="ficha-kv"><dt>Parte usada</dt><dd>${esc(id.parte_usada)}</dd></div>`:''}
        </dl>
        ${Array.isArray(id.sinonimos)&&id.sinonimos.length?`
          <div class="ficha-sub">Sinônimos</div>
          <ul class="ficha-bullets">${listMaybe(id.sinonimos)}</ul>`:''}
      </section>

      <section class="ficha-section">
        <h2>Caracterização</h2>
        <dl class="ficha-dl">
          ${car.sabor_dominante?`<div class="ficha-kv"><dt>Sabor</dt><dd>${esc(car.sabor_dominante)}</dd></div>`:''}
          ${car.aroma?`<div class="ficha-kv"><dt>Aroma</dt><dd>${esc(car.aroma)}</dd></div>`:''}
          ${car.cor_da_infusao?`<div class="ficha-kv"><dt>Cor da infusão</dt><dd>${esc(car.cor_da_infusao)}</dd></div>`:''}
          ${car.intensidade?`<div class="ficha-kv"><dt>Intensidade</dt><dd>${esc(car.intensidade)}</dd></div>`:''}
          ${car.notas?`<div class="ficha-kv"><dt>Notas</dt><dd>${esc(car.notas)}</dd></div>`:''}
          ${car.bioma_de_origem?`<div class="ficha-kv"><dt>Bioma</dt><dd>${esc(car.bioma_de_origem)}</dd></div>`:''}
        </dl>
        ${Array.isArray(car.distribuicao_geografica)&&car.distribuicao_geografica.length?`
          <div class="ficha-sub">Distribuição geográfica</div>
          <ul class="ficha-bullets">${listMaybe(car.distribuicao_geografica)}</ul>`:''}
      </section>

      <section class="ficha-section">
        <h2>Preparo</h2>
        <dl class="ficha-dl">
          ${pr.temperatura_ideal?`<div class="ficha-kv"><dt>Temperatura</dt><dd>${esc(pr.temperatura_ideal)}</dd></div>`:''}
          ${pr.tempo_de_infusao?`<div class="ficha-kv"><dt>Tempo de infusão</dt><dd>${esc(pr.tempo_de_infusao)}</dd></div>`:''}
          ${pr.quantidade?`<div class="ficha-kv"><dt>Quantidade</dt><dd>${esc(pr.quantidade)}</dd></div>`:''}
          ${pr.metodo?`<div class="ficha-kv"><dt>Método</dt><dd>${esc(pr.metodo)}</dd></div>`:''}
          ${pr.reinfusoes?`<div class="ficha-kv"><dt>Reinfusões</dt><dd>${esc(pr.reinfusoes)}</dd></div>`:''}
          ${pr.melhor_momento?`<div class="ficha-kv"><dt>Melhor momento</dt><dd>${esc(pr.melhor_momento)}</dd></div>`:''}
          ${pr.combina_com?`<div class="ficha-kv"><dt>Combina com</dt><dd>${esc(pr.combina_com)}</dd></div>`:''}
        </dl>
        ${f.preparo_ritual?`
          <div class="ficha-sub">${esc(f.preparo_ritual.titulo||'Preparo cerimonial')}</div>
          <p>${esc(f.preparo_ritual.texto||'')}</p>`:''}
      </section>

      ${f.usos_topicos?`
      <section class="ficha-section">
        <h2>Usos tópicos</h2>
        ${f.usos_topicos.evidencia?`<p><strong>Evidência:</strong> ${esc(f.usos_topicos.evidencia)}</p>`:''}
        ${Array.isArray(f.usos_topicos.aplicacoes)?f.usos_topicos.aplicacoes.map(a=>`
          <div class="ficha-sub">${esc(a.titulo||'')}</div>
          <p>${esc(a.texto||'')}</p>`).join(''):''}
        ${f.usos_topicos.contraindicacoes?`<p class="ficha-warn-inline">${esc(f.usos_topicos.contraindicacoes)}</p>`:''}
      </section>`:''}

      <section class="ficha-section">
        <h2>Ações e segurança</h2>
        ${Array.isArray(ac.acoes_principais)&&ac.acoes_principais.length?`
          <div class="ficha-sub">Ações principais</div>
          <ul class="ficha-bullets">${listMaybe(ac.acoes_principais)}</ul>`:''}
        ${Array.isArray(ac.componentes_ativos)&&ac.componentes_ativos.length?`
          <div class="ficha-sub">Componentes ativos</div>
          <dl class="ficha-dl">${dlList(ac.componentes_ativos)}</dl>`:''}
        ${evid.length?`
          <div class="ficha-sub">Indicações com evidência</div>
          <table class="ficha-table">
            <caption>Evidência clínica e populacional</caption>
            <thead><tr><th>Indicação</th><th>Evidência</th><th>População</th></tr></thead>
            <tbody>${evid.map(e=>`<tr><td>${esc(e.indicacao)}</td><td>${esc(e.evidencia)}</td><td>${esc(e.populacao)}</td></tr>`).join('')}</tbody>
          </table>`:''}
        ${Array.isArray(ac.contraindicacoes)&&ac.contraindicacoes.length?`
          <div class="ficha-sub">Contraindicações</div>
          <ul class="ficha-bullets">${listMaybe(ac.contraindicacoes)}</ul>`:''}
        ${Array.isArray(ac.interacoes)&&ac.interacoes.length?`
          <div class="ficha-sub">Interações</div>
          <dl class="ficha-dl">${dlList(ac.interacoes)}</dl>`:''}
        ${ac.efeitos_adversos?`<div class="ficha-sub">Efeitos adversos</div><p>${esc(ac.efeitos_adversos)}</p>`:''}
        ${ac.dose_maxima?`<div class="ficha-sub">Dose máxima</div><p>${esc(ac.dose_maxima)}</p>`:''}
        ${Array.isArray(ac.fontes)&&ac.fontes.length?`
          <div class="ficha-sub">Fontes</div>
          <ul class="ficha-bullets ficha-sources">${listMaybe(ac.fontes)}</ul>`:''}
      </section>

      <section class="ficha-section">
        <h2>Perfil sensorial</h2>
        ${gustativo.length?`
          <table class="ficha-table">
            <caption>Perfil gustativo</caption>
            <thead><tr><th>Dimensão</th><th>Intensidade</th><th>Observação</th></tr></thead>
            <tbody>${gustativo.map(g=>`<tr><td>${esc(g.dimensao)}</td><td>${esc(g.intensidade)}</td><td>${esc(g.observacao)}</td></tr>`).join('')}</tbody>
          </table>`:''}
        ${ps.olfativo_familia?`<div class="ficha-sub">Olfativo — ${esc(ps.olfativo_familia)}</div>`:''}
        ${Array.isArray(ps.olfativo_descritores)&&ps.olfativo_descritores.length?`
          <ul class="ficha-bullets">${listMaybe(ps.olfativo_descritores)}</ul>`:''}
        ${trig.length?`
          <table class="ficha-table">
            <caption>Perfil trigeminal</caption>
            <thead><tr><th>Receptor</th><th>Ativação</th><th>Molécula</th></tr></thead>
            <tbody>${trig.map(t=>`<tr><td>${esc(t.receptor)}</td><td>${esc(t.ativacao)}</td><td>${esc(t.molecula)}</td></tr>`).join('')}</tbody>
          </table>`:''}
        ${ps.tatil?`<div class="ficha-sub">Tátil</div><p>${esc(ps.tatil)}</p>`:''}
        ${ps.descricao_integrada?`<blockquote class="ficha-pullquote">${esc(ps.descricao_integrada)}</blockquote>`:''}
      </section>

      <section class="ficha-section">
        <h2>Cultura</h2>
        ${cu.historia?`<div class="ficha-sub">História</div>${paragraphs(cu.historia)}`:''}
        ${cu.cerimonial?`<div class="ficha-sub">Cerimonial</div><p>${esc(cu.cerimonial)}</p>`:''}
        ${cu.brasil?`<div class="ficha-sub">No Brasil</div>${paragraphs(cu.brasil)}`:''}
        ${cu.curiosidade?`<blockquote class="ficha-pullquote">${esc(cu.curiosidade)}</blockquote>`:''}
      </section>

      <section class="ficha-section">
        <h2>Regulação e origem</h2>
        <dl class="ficha-dl">
          ${rg.eixo_botanico_tpc?`<div class="ficha-kv"><dt>Eixo botânico</dt><dd>${esc(rg.eixo_botanico_tpc)}</dd></div>`:''}
          ${rg.status_anvisa?`<div class="ficha-kv"><dt>ANVISA</dt><dd>${Array.isArray(rg.status_anvisa)?rg.status_anvisa.map(esc).join(' '):esc(rg.status_anvisa)}</dd></div>`:''}
          ${rg.status_ema?`<div class="ficha-kv"><dt>EMA</dt><dd>${esc(rg.status_ema)}</dd></div>`:''}
          ${rg.status_fda?`<div class="ficha-kv"><dt>FDA</dt><dd>${esc(rg.status_fda)}</dd></div>`:''}
          ${rg.certificacao_organica?`<div class="ficha-kv"><dt>Certificação orgânica</dt><dd>${Array.isArray(rg.certificacao_organica)?rg.certificacao_organica.map(esc).join(' '):esc(rg.certificacao_organica)}</dd></div>`:''}
          ${rg.sazonalidade?`<div class="ficha-kv"><dt>Sazonalidade</dt><dd>${Array.isArray(rg.sazonalidade)?rg.sazonalidade.map(esc).join(' '):esc(rg.sazonalidade)}</dd></div>`:''}
        </dl>
      </section>

      ${mk && (mk.fornecedores||mk.faixa_de_preco||mk.formatos)?`
      <section class="ficha-section ficha-section-mute">
        <h2>Marketplace</h2>
        <p class="ficha-mute">Reservado — preencher quando o marketplace do Ervatório for ativado.</p>
        <dl class="ficha-dl">
          ${mk.disponivel_a_venda?`<div class="ficha-kv"><dt>Disponível</dt><dd>${esc(mk.disponivel_a_venda)}</dd></div>`:''}
          ${mk.fornecedores?`<div class="ficha-kv"><dt>Fornecedores</dt><dd>${esc(mk.fornecedores)}</dd></div>`:''}
          ${mk.faixa_de_preco?`<div class="ficha-kv"><dt>Faixa de preço</dt><dd>${Array.isArray(mk.faixa_de_preco)?mk.faixa_de_preco.map(esc).join(' '):esc(mk.faixa_de_preco)}</dd></div>`:''}
          ${mk.formatos?`<div class="ficha-kv"><dt>Formatos</dt><dd>${esc(mk.formatos)}</dd></div>`:''}
        </dl>
      </section>`:''}

      <footer class="ficha-foot">
        <span>Ervatório · Ficha ${esc(f.nome_popular||'')} · v${esc(f.schema_version||'1.1')}</span>
      </footer>
    </article>`;
  ov.classList.add('on');
}

function closeModal(e){
  if(!e||e.target===document.getElementById('herbModal'))
    document.getElementById('herbModal').classList.remove('on');
}

// ── FAVORITES ──
function toggleFav(e,id){
  e.stopPropagation();
  if(favorites.includes(id)) favorites=favorites.filter(f=>f!==id);
  else { favorites.push(id); if(typeof trackAction==='function') trackAction('fav-herb', id); }
  localStorage.setItem('erb_favs',JSON.stringify(favorites));
  renderHerbs();
  const now=favorites.includes(id);
  document.querySelectorAll(`[data-fav-herb="${id}"]`).forEach(btn=>{
    btn.textContent=now?'♥ Favorito':'♡ Favoritar';
    btn.classList.toggle('on',now);
  });
  toast(now?'Adicionado aos favoritos':'Removido dos favoritos');
}

function renderFavs(){
  const grid=document.getElementById('favGrid');
  const favHerbs=HERBS.filter(h=>favorites.includes(h.id));
  if(!favHerbs.length){ grid.innerHTML='<div class="no-results">Nenhum favorito ainda. Explore as ervas e clique em ♥</div>'; }
  else { grid.innerHTML=favHerbs.map(h=>`
    <div class="fav-card" onclick="openHerbModal(${h.id})">
      ${h.img
        ? `<img class="fav-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'fav-icon\\'>${h.icon}</div>'">`
        : `<div class="fav-icon">${h.icon}</div>`
      }
      <div style="flex:1;min-width:0">
        <div class="fav-name">${esc(h.n)}</div>
        <div class="fav-lat">${esc(h.lat)}</div>
        <div class="fav-ef">${esc(h.ef.substring(0,50))}...</div>
      </div>
      <button class="fav-blend-btn${blendTray.includes(h.id)?' in-tray':''}" data-blend-herb="${h.id}" onclick="event.stopPropagation();toggleTrayModal(${h.id})" title="Adicionar ao blend">
        ${blendTray.includes(h.id)?'✓':'＋'}
      </button>
    </div>`).join(''); }
  const sr=document.getElementById('savedRecipes');
  if(savedRecipes.length){
    sr.innerHTML=`<div class="sec-title" style="font-size:1.1rem;margin-bottom:.75rem">Blends Salvos</div>`+
    savedRecipes.map((r,i)=>`
      <div class="recipe-card">
        <div class="recipe-header">
          <div class="recipe-name">${esc(r.name)}</div>
          <div class="recipe-tagline">${esc(r.tagline)}</div>
        </div>
        <div class="recipe-body">
          ${r.ingredients.map(ing=>`<div class="ing-row"><div><div class="ing-name">${esc(ing.n)}</div></div><div class="ing-amount">${esc(ing.amount)}</div></div>`).join('')}
          <button onclick="deleteSavedRecipe(${i})" title="Excluir receita" style="margin-top:.75rem;background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer;display:inline-flex;align-items:center;gap:5px">${svgIcon('trash')} Remover</button>
        </div>
      </div>`).join('');
  } else { sr.innerHTML=''; }
}

function deleteSavedRecipe(i){
  const removed=savedRecipes[i];
  savedRecipes.splice(i,1);
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(removed && typeof ervaria!=='undefined') ervaria.deleteRecipeRemote(removed.name);
  renderFavs();
}

// Favoritar a partir de uma ficha (overlay ou página completa)
function toggleFichaFav(id){
  if(favorites.includes(id)) favorites=favorites.filter(f=>f!==id);
  else favorites.push(id);
  localStorage.setItem('erb_favs',JSON.stringify(favorites));
  renderHerbs();
  const now=favorites.includes(id);
  document.querySelectorAll(`[data-fav-herb="${id}"]`).forEach(btn=>{
    btn.textContent=now?'♥ Favorito':'♡ Favoritar';
    btn.classList.toggle('on',now);
  });
  toast(now?'Adicionado aos favoritos':'Removido dos favoritos');
}

// ── BLEND TRAY ──
function toggleTrayModal(id){
  const inTray=blendTray.includes(id);
  if(inTray){ blendTray=blendTray.filter(i=>i!==id); }
  else { blendTray.push(id); }
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray();
  const now=blendTray.includes(id);
  document.querySelectorAll(`[data-blend-herb="${id}"]`).forEach(btn=>{
    if(btn.classList.contains('hc-blend')){
      btn.textContent=now?'✓':'＋';
      btn.classList.toggle('on',now);
    } else if(btn.classList.contains('fav-blend-btn')){
      btn.textContent=now?'✓':'＋';
      btn.classList.toggle('in-tray',now);
    } else {
      btn.textContent=now?'✓ Selecionado para blend':'＋ Selecionar para blend';
      btn.classList.toggle('in-tray',now);
    }
  });
  if(now) toastLink('Adicionado ao blend','Ver blend →',()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
  else toast('Removido do blend');
}

function addToTray(id){
  if(!blendTray.includes(id)) blendTray.push(id);
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray(); closeModal();
  goPage('blends');
  if(typeof switchBlendTab==='function') switchBlendTab('assistente');
  toast('Erva adicionada ao blend!');
}

function renderTray(){
  const items=document.getElementById('trayItems');
  if(!blendTray.length){ items.innerHTML='<span class="tray-empty">Selecione ervas nas fichas do Ervatório para montar seu blend</span>'; return; }
  const herbs=HERBS.filter(h=>blendTray.includes(h.id));
  items.innerHTML=herbs.map(h=>`
    <span class="tray-item">${h.icon} ${esc(h.n)}
      <button class="tray-remove" onclick="removeTray(${h.id})">✕</button>
    </span>`).join('')+
      `<button class="tray-open-manual" onclick="importTrayToManual()">${svgIcon('leaf')} Abrir no construtor →</button>`;
}

function importTrayToManual(){
  ctrBlend=blendTray.filter(id=>HERBS.find(h=>h.id===id)).map(id=>({id,qty:1}));
  goPage('blends');
  if(typeof switchBlendTab==='function') switchBlendTab('manual');
  renderCtrBlend(); renderCtrHerbs();
  toast('Ervas carregadas no construtor!');
}

function removeTray(id){ blendTray=blendTray.filter(i=>i!==id); localStorage.setItem('erb_tray',JSON.stringify(blendTray)); renderTray(); }

// ── WIZARD ──
const WIZ_SINTOMAS=['Insônia','Ansiedade','Dor de estômago','Gases','Estresse','Gripe/Tosse','Dor de cabeça','Cansaço','Foco','Pressão alta','TPM','Emagrecimento'];
const WIZ_HORA=['Ao acordar','Manhã','Pós-refeição','Tarde','À noite','Antes de dormir'];
const WIZ_SABOR=['Doce','Suave','Cítrico','Amargo','Picante','Floral'];

function buildWizard(){
  const ss=document.getElementById('wizSintomas');
  WIZ_SINTOMAS.forEach(s=>{
    const b=document.createElement('button');
    b.className='wizard-chip'+(wizState.sintomas.includes(s)?' on':'');
    b.textContent=s;
    b.onclick=()=>{
      if(wizState.sintomas.includes(s)) wizState.sintomas=wizState.sintomas.filter(x=>x!==s);
      else wizState.sintomas.push(s);
      b.classList.toggle('on');
    };
    ss.appendChild(b);
  });
  const sh=document.getElementById('wizHora');
  WIZ_HORA.forEach(h=>{
    const b=document.createElement('button');
    b.className='wizard-chip'+(wizState.hora===h?' on':'');
    b.textContent=h;
    b.onclick=()=>{ wizState.hora=h; sh.querySelectorAll('.wizard-chip').forEach(x=>x.classList.remove('on')); b.classList.add('on'); };
    sh.appendChild(b);
  });
  const sv=document.getElementById('wizSabor');
  WIZ_SABOR.forEach(s=>{
    const b=document.createElement('button');
    b.className='wizard-chip'+(wizState.sabor===s?' on':'');
    b.textContent=s;
    b.onclick=()=>{ wizState.sabor=s; sv.querySelectorAll('.wizard-chip').forEach(x=>x.classList.remove('on')); b.classList.add('on'); };
    sv.appendChild(b);
  });
}

// ── BLEND RECIPES ──
const BLEND_DB = {
  'Insônia':{ name:'Infusão do Silêncio', tagline:'Serenidade profunda para noites difíceis',
    ings:[{id:1,n:'Camomila',amount:'1 col. sopa cheia'},{id:3,n:'Maracujá',amount:'1 col. sopa'},{id:4,n:'Melissa',amount:'1 col. sopa'}],
    steps:['Ferva a água até 85°C (não ferver muito).','Misture as ervas numa infusora.','Cubra e deixe em infusão por 10 minutos.','Coe e beba morno, 40 min antes de dormir.','Evite telas e luzes fortes após tomar.'],
    effects:['Sedação suave','Reduz ruminação mental','Sem dependência'],
    obs:'Potencialize com aromaterapia de lavanda no quarto.' },
  'Ansiedade':{ name:'Blend da Calma Profunda', tagline:'Para momentos de tensão e nervosismo',
    ings:[{id:3,n:'Maracujá',amount:'2 col. sopa'},{id:13,n:'Alfazema',amount:'1 col. sopa flores'},{id:4,n:'Melissa',amount:'1 col. sopa'}],
    steps:['Aqueça água a 85°C.','Adicione as ervas e cubra bem.','Infusão de 8-10 minutos.','Coe, adicione mel se desejar.','Beba lentamente, respirando fundo.'],
    effects:['Ansiolítico natural','Sem sonolência forte','Ação em 20-30 min'],
    obs:'Use 2-3x ao dia em períodos de estresse intenso.' },
  'Dor de estômago':{ name:'Elixir do Conforto Gástrico', tagline:'Alívio suave e aromático para o estômago',
    ings:[{id:1,n:'Camomila',amount:'1 col. sopa cheia'},{id:9,n:'Hortelã',amount:'1 col. sopa'},{id:10,n:'Erva-doce',amount:'1/2 col. sopa'}],
    steps:['Ferva água a 90°C.','Junte as três ervas juntas.','Cubra e infuse por 8 minutos.','Coe e beba morno em pequenos goles.','Deite de lado direito após tomar.'],
    effects:['Antiespasmódico','Alivia gases e cólicas','Anti-inflamatório da mucosa'],
    obs:'Para gastrite: substituir hortelã por espinheira santa.' },
  'Gases':{ name:'Blend Carminativo', tagline:'Liberte os gases e alivie o desconforto',
    ings:[{id:10,n:'Erva-doce',amount:'1 col. sopa'},{id:9,n:'Hortelã',amount:'1 col. sopa'},{id:11,n:'Canela',amount:'1 pedaço pequeno'}],
    steps:['Aqueça a 90°C.','Junte as ervas.','Infusão coberta por 7 minutos.','Coe e beba ainda quente.','Massageie a barriga em círculos.'],
    effects:['Carminativo potente','Relaxa musculatura intestinal','Efeito em 15-20 min'],
    obs:'Excelente após refeições com leguminosas.' },
  'Estresse':{ name:'Chai da Serenidade', tagline:'Conforto quente para dias pesados',
    ings:[{id:19,n:'Erva Cidreira',amount:'2 col. sopa'},{id:17,n:'Capim-Limão',amount:'2 folhas frescas'},{id:1,n:'Camomila',amount:'1 col. sopa'}],
    steps:['Ferva água a 88°C.','Amasse levemente o capim-limão antes.','Infuse coberto por 8 minutos.','Adicione mel a gosto.','Beba com calma, longe das telas.'],
    effects:['Reduz cortisol','Calmante sem sedação','Aroma terapêutico'],
    obs:'Combine com 5 minutos de respiração lenta.' },
  'Foco':{ name:'Poção do Foco Profundo', tagline:'Clareza mental e concentração sustentada',
    ings:[{id:6,n:'Chá Verde',amount:'1 col. sopa'},{id:8,n:'Alecrim',amount:'1 col. sopa'},{id:11,n:'Canela',amount:'1/2 col. chá'}],
    steps:['Aqueça água a 75°C (não ferver).','Junte as ervas.','Infusão curta: 4 minutos apenas.','Coe e beba morno.','Tomar 30 min antes de estudar ou trabalhar.'],
    effects:['L-teanina + cafeína: foco calmo','Sem ansiedade','Melhora memória de trabalho'],
    obs:'Ideal pela manhã. Evitar após 15h.' },
  'Cansaço':{ name:'Tônico Revigorante', tagline:'Energia limpa e sustentada para o dia',
    ings:[{id:5,n:'Gengibre',amount:'4 fatias frescas'},{id:11,n:'Canela',amount:'1 pau pequeno'},{id:17,n:'Capim-Limão',amount:'2 folhas'}],
    steps:['Ferva água a 95°C.','Adicione gengibre e canela primeiro.','Cozinhe por 5 minutos em fogo baixo.','Desligue, adicione capim-limão.','Infuse tampado por 5 min. Coe.'],
    effects:['Termogênico','Circulação ativa','Energia sem pico'],
    obs:'Com raspas de limão e mel: sabor excepcional.' },
  'Gripe/Tosse':{ name:'Antigripal Poderoso', tagline:'Combate a gripe com força da natureza',
    ings:[{id:5,n:'Gengibre',amount:'5 fatias frescas'},{id:16,n:'Guaco',amount:'2 col. sopa'},{id:28,n:'Tomilho',amount:'1 col. sopa'}],
    steps:['Ferva água a 100°C.','Adicione todas as ervas.','Infusão coberta por 12 minutos.','Coe, adicione mel + limão.','Tomar 3-4x ao dia na fase aguda.'],
    effects:['Broncodilatador','Expectorante','Antiviral natural'],
    obs:'Potencializar com inalação de vapor de eucalipto.' },
  'Emagrecimento':{ name:'Blend Queima-Gordura', tagline:'Acelera o metabolismo de forma natural',
    ings:[{id:6,n:'Chá Verde',amount:'1 col. sopa'},{id:21,n:'Carqueja',amount:'1 col. sopa'},{id:7,n:'Hibisco',amount:'1 col. sopa'}],
    steps:['Aqueça água a 80°C.','Misture as três ervas.','Infusão de 5-7 minutos.','Coe e beba sem adoçar.','Tomar 30 min antes das refeições.'],
    effects:['Termogênico','Inibe absorção de carboidratos','Diurético suave'],
    obs:'Associar com caminhada de 30 min diários.' },
  'Pressão alta':{ name:'Infusão Hipotensora', tagline:'Apoio natural para pressão equilibrada',
    ings:[{id:7,n:'Hibisco',amount:'2 col. sopa'},{id:4,n:'Melissa',amount:'1 col. sopa'},{id:17,n:'Capim-Limão',amount:'2 folhas'}],
    steps:['Ferva água a 90°C.','Adicione as ervas.','Infusão coberta por 10 minutos.','Coe e beba sem adoçar (mel mínimo).','3 xícaras ao dia por 6+ semanas.'],
    effects:['Hipotensor suave','Vasodilatador','Ansiolítico complementar'],
    obs:'NÃO substituir medicação. Monitorar PA regularmente.' },
  'TPM':{ name:'Blend da Lua', tagline:'Conforto e equilíbrio no período menstrual',
    ings:[{id:1,n:'Camomila',amount:'2 col. sopa'},{id:4,n:'Melissa',amount:'1 col. sopa'},{id:10,n:'Erva-doce',amount:'1 col. sopa'}],
    steps:['Ferva água a 88°C.','Misture as ervas com carinho.','Infusão de 10 minutos coberta.','Adicione mel e canela a gosto.','3x ao dia nos dias de maior desconforto.'],
    effects:['Antiespasmódico uterino','Alivia irritabilidade','Anti-inflamatório'],
    obs:'Adicionar folha de amora para menopausa.' },
  'default':{ name:'Blend Equilibrante', tagline:'Harmonia e bem-estar para o dia a dia',
    ings:[{id:19,n:'Erva Cidreira',amount:'2 col. sopa'},{id:17,n:'Capim-Limão',amount:'2 folhas'},{id:5,n:'Gengibre',amount:'2 fatias'}],
    steps:['Ferva água a 88°C.','Junte as ervas.','Infusão coberta por 8 minutos.','Coe e personalize com mel ou limão.'],
    effects:['Equilíbrio geral','Digestivo','Calmante suave'],
    obs:'Ajuste as proporções ao seu gosto e necessidade.' },
};

function getSaborAdj(sabor,rec){
  const adj={
    'Doce':'Adicione 1 col. chá de alcaçuz ou canela para adoçar naturalmente, sem açúcar.',
    'Suave':'Reduza as quantidades em 30% e infuse por menos tempo (5 min) para sabor mais delicado.',
    'Cítrico':'Adicione casca de limão siciliano (1 tira) durante a infusão. Espete no final.',
    'Amargo':'Adicione 1/4 col. de carqueja ou boldo. Beba puro.',
    'Picante':'Adicione 2 fatias de gengibre fresco e uma pitada de pimenta caiena.',
    'Floral':'Adicione 1 col. sopa de camomila ou rosas secas para perfumar.',
  };
  return adj[sabor]||'';
}

function getHoraAdj(hora){
  const adj={
    'Ao acordar':'Em jejum, com água a 85°C. Espere 20 min para o café.',
    'Manhã':'Com café da manhã leve. Evitar combinação com café.',
    'Pós-refeição':'15-20 min após comer, ainda morno.',
    'Tarde':'Temperatura ambiente ou gelado é ótimo.',
    'À noite':'Beba 1h antes de dormir. Luz baixa no ambiente.',
    'Antes de dormir':'30-40 min antes de deitar. Celular fora do alcance.',
  };
  return adj[hora]||'';
}

function generateBlend(){
  if(typeof trackAction==='function') trackAction('create-blend');
  const sintoma = wizState.sintomas[0]||'default';
  const obs = document.getElementById('wizObs').value;
  const rec = BLEND_DB[sintoma]||BLEND_DB['default'];
  const saborTip = getSaborAdj(wizState.sabor, rec);
  const horaTip = getHoraAdj(wizState.hora);
  const obsWarnings = obs.toLowerCase();
  let alertBox='';
  if(obsWarnings.includes('grávid')||obsWarnings.includes('gestante')) alertBox=`<div class="warn-box">⚠ Gestante detectada: Camomila, Erva Cidreira e Capim-Limão são seguros. Evite arruda, alfazema em doses altas e ervas estimulantes.</div>`;
  else if(obsWarnings.includes('pressão alta')||obsWarnings.includes('hipertens')) alertBox=`<div class="warn-box">⚠ Hipertensão detectada: Evite guaraná e estimulantes fortes. Hibisco e melissa são excelentes complementos.</div>`;
  else if(obsWarnings.includes('sem cafeína')||obsWarnings.includes('cafeina')) alertBox=`<div class="warn-box">ℹ Sem cafeína: esta combinação não contém cafeína. Você pode tomar à noite.</div>`;

  document.getElementById('blendResult').innerHTML=`
    ${alertBox}
    <div class="recipe-card">
      <div class="recipe-header">
        <div class="recipe-name">${esc(rec.name)}</div>
        <div class="recipe-tagline">${esc(rec.tagline)}</div>
      </div>
      <div class="recipe-body">
        <div class="recipe-ing-title">Ingredientes e Quantidades</div>
        ${rec.ings.map(ing=>`
          <div class="ing-row">
            <div>
              <div class="ing-name">${esc(ing.n)}</div>
              <div class="ing-latin" style="font-size:.7rem;color:var(--muted);font-style:italic">${esc(HERBS.find(h=>h.id===ing.id)?.lat||'')}</div>
            </div>
            <div class="ing-amount">${esc(ing.amount)}</div>
          </div>`).join('')}
        <div style="padding:8px 0;border-bottom:0.5px solid rgba(255,255,255,.04);color:var(--cream2);font-size:.82rem">
          <span style="color:var(--muted)">Água:</span> 250-300ml &nbsp;|&nbsp; <span style="color:var(--muted)">Temp:</span> 85-90°C &nbsp;|&nbsp; <span style="color:var(--muted)">Infusão:</span> 8-10 min
        </div>
        <div class="steps-section">
          <div class="recipe-ing-title">Modo de Preparo</div>
          ${rec.steps.map((s,i)=>`<div class="step"><div class="step-num">${i+1}</div><div class="step-text">${esc(s)}</div></div>`).join('')}
          ${saborTip?`<div class="step"><div class="step-num">✦</div><div class="step-text"><strong style="color:var(--gold2)">Sabor ${esc(wizState.sabor)}:</strong> ${esc(saborTip)}</div></div>`:''}
          ${horaTip?`<div class="step"><div class="step-num">⏰</div><div class="step-text"><strong style="color:var(--gold2)">${esc(wizState.hora)||'Uso geral'}:</strong> ${esc(horaTip)}</div></div>`:''}
        </div>
        <div class="effect-badges">
          ${rec.effects.map(e=>`<span class="eff-badge">${esc(e)}</span>`).join('')}
        </div>
        ${rec.obs?`<div style="margin-top:.75rem;font-size:.78rem;color:var(--muted);font-style:italic;line-height:1.5">${svgIcon('bulb')} ${esc(rec.obs)}</div>`:''}
        <div style="display:flex;gap:8px;margin-top:1rem">
          <button class="save-recipe-btn" style="flex:1" onclick="saveRecipe('${esc(rec.name)}')">♥ Salvar</button>
          <button class="save-recipe-btn" style="flex:1;background:rgba(255,255,255,.04)" onclick="sendWizardToManual(${JSON.stringify(rec.ings.map(i=>i.id))})">${svgIcon('leaf')} Editar no construtor</button>
        </div>
      </div>
    </div>`;
}

function sendWizardToManual(ids){
  ctrBlend=ids.filter(id=>HERBS.find(h=>h.id===id)).map(id=>({id,qty:1}));
  switchBlendTab('manual');
  renderCtrBlend(); renderCtrHerbs();
  toast('Blend carregado no construtor!');
}

function saveRecipe(name){
  const sintoma=wizState.sintomas[0]||'default';
  const rec=BLEND_DB[sintoma]||BLEND_DB['default'];
  if(savedRecipes.find(r=>r.name===rec.name)){ toast('Blend já foi salvo!'); return; }
  const entry={name:rec.name,tagline:rec.tagline,ingredients:rec.ings};
  savedRecipes.unshift(entry);
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(typeof ervaria!=='undefined') ervaria.pushRecipe(entry);
  toast('Blend salvo nos favoritos!');
  document.querySelector('.save-recipe-btn').innerHTML='✓ Salvo <span class="saved-tag">✓</span>';
}

// ── SUPPLIERS ──
const SUP_TYPES=['Todos','Produtor Orgânico','Ervateiro Tradicional','Distribuidor Nacional','Orgânico & Biodinâmico','Produtor Regional','Importador Especializado'];

function renderSuppliers(){
  const sf=document.getElementById('supFilter');
  sf.innerHTML='';
  SUP_TYPES.forEach(t=>{
    const b=document.createElement('button');
    b.className='fchip'+(activeSup===t?' on':'');
    b.textContent=t;
    b.onclick=()=>{ activeSup=t; renderSuppliers(); };
    sf.appendChild(b);
  });
  const list=SUPPLIERS.filter(s=>activeSup==='Todos'||s.type===activeSup);
  document.getElementById('supGrid').innerHTML=list.map(s=>`
    <div class="sup-card">
      <div class="sup-header">
        <div>
          <div class="sup-name">${esc(s.name)}</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:2px">${esc(s.city)}</div>
        </div>
        <span class="sup-type" style="background:${s.color}22;border-color:${s.color}55;color:${s.color}">${esc(s.type.split(' ')[0])}</span>
      </div>
      <div class="sup-body">
        <div class="sup-row"><span>Desde</span>${esc(s.since)}</div>
        <div class="sup-row"><span>Certificação</span>${esc(s.cert)}</div>
        <div class="sup-row"><span>Envio</span>${esc(s.ship)}</div>
        <div class="sup-row"><span>Pedido mínimo</span>${esc(s.minOrder)}</div>
        <div class="sup-herbs">
          ${s.herbs.map(h=>`<span class="sup-herb-tag">${esc(h)}</span>`).join('')}
        </div>
        <button class="shop-btn" onclick="filterShopBySup(${s.id})">Ver produtos na loja →</button>
      </div>
    </div>`).join('');
}

function filterShopBySup(supId){
  const sup=(typeof SUPPLIERS!=='undefined')?SUPPLIERS.find(s=>s.id===supId):null;
  if(typeof mktCatActive!=='undefined') mktCatActive='Todos';
  if(typeof mktSearchVal!=='undefined') mktSearchVal=sup?sup.name.toLowerCase():'';
  const searchInput=document.getElementById('mktSearch');
  if(searchInput) searchInput.value=sup?sup.name:'';
  goPage('marketplace');
  document.querySelectorAll('.nav-tab').forEach(t=>{ t.classList.toggle('on', (t.getAttribute('onclick')||'').includes("goPage('marketplace'")); });
}

function updateCartCount(){
  const total=cart.reduce((s,c)=>s+c.qty,0);
  const el=document.getElementById('mktCartCount');
  if(el) el.textContent=total?`(${total})`:'';
}

function openCart(){
  const ol=document.getElementById('cartOverlay');
  ol.classList.toggle('on');
  if(ol.classList.contains('on')) renderCart();
}

function closeCartOverlay(e){ if(e.target===document.getElementById('cartOverlay')) openCart(); }

function renderCart(){
  const ci=document.getElementById('cartItems');
  const cf=document.getElementById('cartFooter');
  if(!cart.length){ ci.innerHTML='<div class="empty-cart">Seu carrinho está vazio</div>'; cf.innerHTML=''; return; }
  ci.innerHTML=cart.map(c=>`
    <div class="cart-item">
      <div class="cart-item-icon">${c.icon}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(c.name)}</div>
        <div class="cart-item-sup">${esc(c.seller||c.sup||'')} · ${esc(c.unit)}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
          <span class="qty-val">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">R$ ${(c.price*c.qty).toFixed(2)}</div>
    </div>`).join('');
  const sub=cart.reduce((s,c)=>s+c.price*c.qty,0);
  const frete=sub>150?0:15.9;
  const paymentsOn=window.SITE_SETTINGS!=null?window.SITE_SETTINGS.payments_enabled===true:window.ERVATORIO_CONFIG?.PAYMENTS_ENABLED!==false;
  const maintMsg=window.ERVATORIO_CONFIG?.PAYMENTS_DISABLED_MSG||'Pagamentos em manutenção';
  const checkoutBlock=paymentsOn
    ? `<button class="checkout-btn" onclick="openCart();openCheckout()">Finalizar pedido →</button>`
    : `<div style="margin-top:.75rem;padding:.75rem;background:rgba(200,168,75,.08);border:1px solid rgba(200,168,75,.25);border-radius:8px;text-align:center;font-size:.78rem;color:var(--gold2);line-height:1.4">⏳ ${esc(maintMsg)}</div>`;
  cf.innerHTML=`<div class="cart-total">
    <div class="total-row"><span>Subtotal</span><span>R$ ${sub.toFixed(2)}</span></div>
    <div class="total-row"><span>Frete</span><span>${frete===0?'Grátis':'R$ '+frete.toFixed(2)}</span></div>
    ${frete>0?`<div style="font-size:.68rem;color:var(--muted);text-align:right">Frete grátis acima de R$ 150</div>`:''}
    <div class="total-final"><span>Total</span><span>R$ ${(sub+frete).toFixed(2)}</span></div>
    ${checkoutBlock}
    <button onclick="clearCart()" style="width:100%;margin-top:.5rem;background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer">Esvaziar carrinho</button>
  </div>`;
}

function changeQty(id,delta){
  const item=cart.find(c=>c.id===id);
  if(item){ item.qty+=delta; if(item.qty<=0) cart=cart.filter(c=>c.id!==id); }
  localStorage.setItem('erb_cart',JSON.stringify(cart));
  updateCartCount(); renderCart();
  if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
}
function clearCart(){
  cart=[]; localStorage.setItem('erb_cart','[]');
  updateCartCount(); renderCart();
  if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
}

// ════════════════════════════════════════
// ── RODA DOS CHÁS ──
// ════════════════════════════════════════
const RODA_LAYERS = [
  {id:'sintoma', label:'Sintoma'},
  {id:'sistema', label:'Sistema'},
  {id:'momento', label:'Momento'},
  {id:'sabor',   label:'Sabor'},
];
const RODA_DATA = {
  sintoma:[
    {name:'Insônia',color:'#1e3d5c',herbs:[{n:'Valeriana',icon:'🌸',ef:'Sedativa potente'},{n:'Maracujá',icon:'🍃',ef:'Ansiolítico natural'},{n:'Camomila',icon:'🌼',ef:'Apigenina / GABA'},{n:'Melissa',icon:'🍃',ef:'Inibe excitação neural'},{n:'Lúpulo',icon:'🌿',ef:'Sedativo forte'}],combo:['Valeriana + Maracujá','Camomila + Melissa'],prep:{temp:'85°C',tempo:'10 min',dose:'2 col / 250ml',freq:'1x à noite'}},
    {name:'Ansiedade',color:'#2d5a4a',herbs:[{n:'Maracujá',icon:'🍃',ef:'Ansiolítico clínico'},{n:'Alfazema',icon:'💜',ef:'Reduz ondas beta'},{n:'Ashwagandha',icon:'🌿',ef:'Reduz cortisol 30%'},{n:'Melissa',icon:'🍃',ef:'Eleva serotonina'},{n:'Tília',icon:'🌸',ef:'Age em 30 min'}],combo:['Maracujá + Melissa','Alfazema + Ashwagandha'],prep:{temp:'85°C',tempo:'8 min',dose:'2 col / 250ml',freq:'2-3x ao dia'}},
    {name:'Foco',color:'#3a2d6b',herbs:[{n:'Ginkgo Biloba',icon:'🍃',ef:'Circulação cerebral'},{n:'Chá Verde',icon:'🍵',ef:'L-teanina + cafeína'},{n:'Alecrim',icon:'🌿',ef:'1,8-cineol cognitivo'},{n:'Bacopa',icon:'🌱',ef:'Memória longo prazo'},{n:'Erva-mate',icon:'🌿',ef:'Mateína + vitaminas B'}],combo:['Ginkgo + Chá Verde','Alecrim + Bacopa'],prep:{temp:'75°C',tempo:'4 min',dose:'1 col / 200ml',freq:'manhã'}},
    {name:'Digestão',color:'#5a3a1a',herbs:[{n:'Boldo',icon:'🍃',ef:'Estimula bile'},{n:'Hortelã',icon:'🌿',ef:'Antiespasmódico'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa clássica'},{n:'Gengibre',icon:'🫚',ef:'Procinético'},{n:'Alcachofra',icon:'🌱',ef:'Colerético'}],combo:['Boldo + Alcachofra','Hortelã + Erva-doce'],prep:{temp:'90°C',tempo:'7 min',dose:'1 col / 250ml',freq:'após refeições'}},
    {name:'Energia',color:'#6b5a2d',herbs:[{n:'Guaraná',icon:'🫐',ef:'Estimulante potente'},{n:'Ginseng',icon:'🌿',ef:'Tônico nervoso'},{n:'Erva-mate',icon:'🌿',ef:'Energia sustentada'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Canela',icon:'🌿',ef:'Glicemia estável'}],combo:['Guaraná + Canela','Ginseng + Gengibre'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col / 250ml',freq:'manhã'}},
    {name:'Gripe',color:'#2d4a3a',herbs:[{n:'Guaco',icon:'🍃',ef:'Broncodilatador ANVISA'},{n:'Gengibre',icon:'🫚',ef:'Antiviral natural'},{n:'Tomilho',icon:'🌿',ef:'Antisséptico pulmonar'},{n:'Sabugueiro',icon:'🌸',ef:'Encurta gripe 2-4d'},{n:'Pitanga',icon:'🍃',ef:'Antifebril nativo'}],combo:['Guaco + Gengibre','Tomilho + Sabugueiro'],prep:{temp:'95°C',tempo:'10 min',dose:'2 col / 300ml',freq:'3-4x ao dia'}},
    {name:'Pressão Alta',color:'#6b2d3a',herbs:[{n:'Hibisco',icon:'🌺',ef:'-7mmHg sistólica'},{n:'Alho',icon:'🧄',ef:'Vasodilatador'},{n:'Melissa',icon:'🍃',ef:'Relaxa artérias'},{n:'Cúrcuma',icon:'🫚',ef:'Elasticidade vascular'},{n:'Cavalinha',icon:'🌾',ef:'Diurética'}],combo:['Hibisco + Melissa','Alho + Cúrcuma'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col / 300ml',freq:'2-3x ao dia'}},
    {name:'Emagrecimento',color:'#2d5a2d',herbs:[{n:'Chá Verde',icon:'🍵',ef:'EGCG queima gordura'},{n:'Carqueja',icon:'🌿',ef:'Termogênico'},{n:'Hibisco',icon:'🌺',ef:'Inibe amilase'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Garcinia',icon:'🍃',ef:'Inibe lipase'}],combo:['Chá Verde + Gengibre','Carqueja + Hibisco'],prep:{temp:'80°C',tempo:'6 min',dose:'1 col / 250ml',freq:'antes das refeições'}},
  ],
  sistema:[
    {name:'Nervoso',color:'#3a2d6b',herbs:[{n:'Valeriana',icon:'🌸',ef:'Sedativa SNC'},{n:'Ginkgo',icon:'🍃',ef:'Circulação cerebral'},{n:'Melissa',icon:'🍃',ef:'Inibe MAO-B'},{n:'Ashwagandha',icon:'🌿',ef:'Reduz cortisol'},{n:'Bacopa',icon:'🌱',ef:'Memória'}],combo:['Ginkgo + Bacopa','Valeriana + Melissa'],prep:{temp:'85°C',tempo:'8 min',dose:'1 col',freq:'2x dia'}},
    {name:'Digestivo',color:'#5a3a1a',herbs:[{n:'Boldo',icon:'🍃',ef:'Hepático'},{n:'Hortelã',icon:'🌿',ef:'Antiespasmódico'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa'},{n:'Alcachofra',icon:'🌱',ef:'Colerética'},{n:'Gengibre',icon:'🫚',ef:'Procinético'}],combo:['Boldo + Alcachofra','Hortelã + Erva-doce'],prep:{temp:'90°C',tempo:'8 min',dose:'1 col',freq:'após refeições'}},
    {name:'Cardiovascular',color:'#6b2d3a',herbs:[{n:'Hibisco',icon:'🌺',ef:'Hipotensor'},{n:'Alho',icon:'🧄',ef:'Vasodilatador'},{n:'Cúrcuma',icon:'🫚',ef:'Artérias'},{n:'Castanha Índia',icon:'🍃',ef:'Venoso'},{n:'Ginkgo',icon:'🍃',ef:'Microcirculação'}],combo:['Hibisco + Alho','Cúrcuma + Gengibre'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'2x dia'}},
    {name:'Respiratório',color:'#1e4a3a',herbs:[{n:'Guaco',icon:'🍃',ef:'Broncodilatador'},{n:'Tomilho',icon:'🌿',ef:'Expectorante'},{n:'Eucalipto',icon:'🌿',ef:'Descongestionante'},{n:'Alcaçuz',icon:'🌿',ef:'Suaviza mucosa'},{n:'Sabugueiro',icon:'🌸',ef:'Antiviral'}],combo:['Guaco + Tomilho','Eucalipto + Hortelã'],prep:{temp:'95°C',tempo:'10 min',dose:'2 col',freq:'3x dia'}},
    {name:'Hormonal',color:'#6b3a5a',herbs:[{n:'Maca Peruana',icon:'🌾',ef:'Equilibra hormônios'},{n:'Folha de Amora',icon:'🍃',ef:'Fitoestrogênios'},{n:'Sálvia',icon:'🌿',ef:'Menopausa'},{n:'Dong Quai',icon:'🌸',ef:'MTC feminina'},{n:'Pata de Vaca',icon:'🍃',ef:'Hipoglicemiante'}],combo:['Maca + Dong Quai','Folha Amora + Sálvia'],prep:{temp:'88°C',tempo:'10 min',dose:'2 col',freq:'2x dia'}},
    {name:'Renal',color:'#2d4a6b',herbs:[{n:'Cavalinha',icon:'🌾',ef:'Diurética potente'},{n:'Quebra Pedra',icon:'🌿',ef:'Cálculos'},{n:'Cana do Brejo',icon:'🌱',ef:'ITU e rins'},{n:'Dente-de-leão',icon:'🌼',ef:'Diurético suave'},{n:'Bardana',icon:'🌿',ef:'Depurativo'}],combo:['Cavalinha + Quebra Pedra','Dente-de-leão + Bardana'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'3x dia'}},
  ],
  momento:[
    {name:'Ao Acordar',color:'#7a5c2a',herbs:[{n:'Gengibre + Limão',icon:'🫚',ef:'Alcaliniza e ativa'},{n:'Chá Verde',icon:'🍵',ef:'Energia focada'},{n:'Canela',icon:'🌿',ef:'Regula glicemia'},{n:'Hortelã',icon:'🌿',ef:'Desperta sentidos'},{n:'Alecrim',icon:'🌿',ef:'Circulação cerebral'}],combo:['Gengibre + Limão + Mel','Chá Verde + Hortelã'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col',freq:'em jejum'}},
    {name:'Pré-Treino',color:'#5a3a1a',herbs:[{n:'Guaraná',icon:'🫐',ef:'Energia e resistência'},{n:'Gengibre',icon:'🫚',ef:'Termogênico'},{n:'Erva-mate',icon:'🌿',ef:'+24% VO2max'},{n:'Pimenta Caiena',icon:'🌶',ef:'Capsaicina'},{n:'Maca Peruana',icon:'🌾',ef:'Desempenho'}],combo:['Guaraná + Gengibre','Erva-mate + Pimenta'],prep:{temp:'80°C',tempo:'5 min',dose:'1 col',freq:'30min antes'}},
    {name:'Pós-Refeição',color:'#3a4a1a',herbs:[{n:'Hortelã',icon:'🌿',ef:'Digestiva'},{n:'Erva-doce',icon:'🌾',ef:'Carminativa'},{n:'Boldo',icon:'🍃',ef:'Estimula bile'},{n:'Gengibre',icon:'🫚',ef:'Procinético'},{n:'Louro',icon:'🍃',ef:'Carminativo'}],combo:['Hortelã + Erva-doce','Boldo + Gengibre'],prep:{temp:'90°C',tempo:'7 min',dose:'1 col',freq:'logo após comer'}},
    {name:'Tarde',color:'#2d4a2d',herbs:[{n:'Chá Verde',icon:'🍵',ef:'Foco + calma'},{n:'Rooibos',icon:'🍃',ef:'Sem cafeína'},{n:'Alecrim',icon:'🌿',ef:'Clareza mental'},{n:'Tulsi',icon:'🌱',ef:'Anti-estresse'},{n:'Hibisco',icon:'🌺',ef:'Refrescante'}],combo:['Chá Verde + Hortelã','Rooibos + Hibisco'],prep:{temp:'80°C',tempo:'5 min',dose:'1 col',freq:'14h-16h'}},
    {name:'À Noite',color:'#1a2a4a',herbs:[{n:'Camomila',icon:'🌼',ef:'Calmante universal'},{n:'Melissa',icon:'🍃',ef:'Mente quieta'},{n:'Maracujá',icon:'🍃',ef:'Ansiolítico'},{n:'Alfazema',icon:'💜',ef:'Ondas beta'},{n:'Valeriana',icon:'🌸',ef:'Insônia'}],combo:['Camomila + Melissa','Maracujá + Valeriana'],prep:{temp:'85°C',tempo:'10 min',dose:'2 col',freq:'1h antes dormir'}},
    {name:'Detox',color:'#2a3a1a',herbs:[{n:'Cúrcuma + Pimenta',icon:'🫚',ef:'Anti-inflamatório'},{n:'Dente-de-leão',icon:'🌼',ef:'Fígado e rins'},{n:'Alcachofra',icon:'🌱',ef:'Bile e detox'},{n:'Cardo Mariano',icon:'🌸',ef:'Hepatoprotetor'},{n:'Boldo',icon:'🍃',ef:'Colagogo'}],combo:['Gengibre + Limão + Cúrcuma','Dente-de-leão + Alcachofra'],prep:{temp:'90°C',tempo:'10 min',dose:'2 col',freq:'em jejum'}},
  ],
  sabor:[
    {name:'Amargo',color:'#2d4a2d',herbs:[{n:'Boldo',icon:'🍃',ef:'Amargo hepático'},{n:'Carqueja',icon:'🌿',ef:'Amargo termogênico'},{n:'Alcachofra',icon:'🌱',ef:'Amargo colerético'},{n:'Losna',icon:'🌿',ef:'Estimulante gástrico'},{n:'Dente-de-leão',icon:'🌼',ef:'Amargo tônico'}],combo:['Boldo + Canela','Carqueja + Limão'],prep:{temp:'90°C',tempo:'8 min',dose:'1 col',freq:'pós refeições'}},
    {name:'Doce',color:'#5a3a1a',herbs:[{n:'Alcaçuz',icon:'🌿',ef:'50x mais doce'},{n:'Erva-doce',icon:'🌾',ef:'Anis doce'},{n:'Canela',icon:'🌿',ef:'Doce-especiada'},{n:'Camomila',icon:'🌼',ef:'Floral suave'},{n:'Stevia',icon:'🌱',ef:'Zero calorias'}],combo:['Camomila + Alcaçuz','Erva-doce + Canela'],prep:{temp:'88°C',tempo:'7 min',dose:'1 col',freq:'qualquer hora'}},
    {name:'Cítrico',color:'#4a5a1a',herbs:[{n:'Capim-Limão',icon:'🌾',ef:'Cítrico calmante'},{n:'Erva Cidreira',icon:'🍃',ef:'Limão + calma'},{n:'Melissa',icon:'🍃',ef:'Limão mel'},{n:'Hibisco',icon:'🌺',ef:'Ácido frutado'},{n:'Rosa',icon:'🌹',ef:'Floral cítrico'}],combo:['Capim-limão + Gengibre','Melissa + Hibisco'],prep:{temp:'88°C',tempo:'7 min',dose:'2 col',freq:'qualquer hora'}},
    {name:'Picante',color:'#6b2a1a',herbs:[{n:'Gengibre',icon:'🫚',ef:'Picante termogênico'},{n:'Canela',icon:'🌿',ef:'Doce-picante'},{n:'Cravo',icon:'🌿',ef:'Aromático forte'},{n:'Cardamomo',icon:'🌱',ef:'Especiado exótico'},{n:'Pimenta',icon:'🌶',ef:'Capsaicina'}],combo:['Gengibre + Canela + Cravo','Cardamomo + Cúrcuma'],prep:{temp:'95°C',tempo:'10 min',dose:'1 col',freq:'manhã'}},
    {name:'Floral',color:'#6b3a5a',herbs:[{n:'Camomila',icon:'🌼',ef:'Floral clássico'},{n:'Jasmim',icon:'🌸',ef:'Intenso floral'},{n:'Rosa',icon:'🌹',ef:'Refinado'},{n:'Alfazema',icon:'💜',ef:'Medicinal'},{n:'Tília',icon:'🌸',ef:'Floral mel'}],combo:['Camomila + Rosa','Jasmim + Alfazema'],prep:{temp:'85°C',tempo:'7 min',dose:'2 col',freq:'tarde e noite'}},
    {name:'Mentolado',color:'#1a4a3a',herbs:[{n:'Hortelã',icon:'🌿',ef:'Mentol intenso'},{n:'Eucalipto',icon:'🌿',ef:'Cineol fresco'},{n:'Tomilho',icon:'🌿',ef:'Mentolado herbal'},{n:'Manjericão',icon:'🌿',ef:'Fresco herbáceo'},{n:'Capim-Limão',icon:'🌾',ef:'Cítrico fresco'}],combo:['Hortelã + Eucalipto','Tomilho + Hortelã'],prep:{temp:'85°C',tempo:'5 min',dose:'1 col',freq:'qualquer hora'}},
  ],
};

let rodaActiveLayer='sintoma', rodaHovIdx=-1, rodaSelIdx=-1;
const RODA_COLORS_MAP={sintoma:['#1e3d5c','#2d5a4a','#3a2d6b','#5a3a1a','#6b5a2d','#2d4a3a','#6b2d3a','#2d5a2d'],sistema:['#3a2d6b','#5a3a1a','#6b2d3a','#1e4a3a','#6b3a5a','#2d4a6b'],momento:['#7a5c2a','#5a3a1a','#3a4a1a','#2d4a2d','#1a2a4a','#2a3a1a'],sabor:['#2d4a2d','#5a3a1a','#4a5a1a','#6b2a1a','#6b3a5a','#1a4a3a']};

function initRoda(){
  const lay=document.getElementById('rodaLayers');
  lay.innerHTML='';
  RODA_LAYERS.forEach(l=>{
    const b=document.createElement('button');
    b.className='roda-layer-btn'+(rodaActiveLayer===l.id?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ rodaActiveLayer=l.id; rodaSelIdx=-1; initRoda(); renderRodaPanel(null); };
    lay.appendChild(b);
  });
  rodaHovIdx=-1;
  drawRoda();
}

function drawRoda(){
  const cv=document.getElementById('rodaCanvas');
  if(!cv)return;
  const ctx=cv.getContext('2d');
  const W=340,CX=W/2,CY=W/2,R=162,IR=38;
  // Ajuste retina: canvas em alta resolução com CSS mantendo tamanho lógico
  const dpr=Math.min(window.devicePixelRatio||1,3);
  if(cv.width!==W*dpr){
    cv.width=W*dpr; cv.height=W*dpr;
    cv.style.width=W+'px'; cv.style.height=W+'px';
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,W);
  // Suavização de texto
  ctx.imageSmoothingEnabled=true;
  if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality='high';
  const slices=RODA_DATA[rodaActiveLayer];
  const cols=RODA_COLORS_MAP[rodaActiveLayer];
  const n=slices.length, arc=2*Math.PI/n, start=-Math.PI/2;
  slices.forEach((s,i)=>{
    const a0=start+i*arc, a1=a0+arc;
    const sel=rodaSelIdx===i, hov=rodaHovIdx===i;
    ctx.beginPath(); ctx.moveTo(CX,CY); ctx.arc(CX,CY,sel?R+5:R,a0,a1); ctx.closePath();
    const c=cols[i]||'#3a3a3a';
    ctx.fillStyle=sel?lightenW(c,.4):hov?lightenW(c,.2):c; ctx.fill();
    ctx.strokeStyle=sel?'rgba(200,168,75,.7)':'rgba(11,10,8,.65)'; ctx.lineWidth=sel?1.5:1; ctx.stroke();
    if(sel){ctx.beginPath();ctx.moveTo(CX,CY);ctx.arc(CX,CY,R+4,a0+.02,a1-.02);ctx.closePath();ctx.strokeStyle='rgba(240,217,138,.3)';ctx.lineWidth=2;ctx.stroke();}
    const mA=a0+arc/2, lr=(R+IR)/2;
    const lx=CX+lr*Math.cos(mA), ly=CY+lr*Math.sin(mA);
    ctx.save(); ctx.translate(lx,ly); ctx.rotate(mA+Math.PI/2);
    ctx.fillStyle=sel?'#f5dd95':hov?'#ead083':'rgba(245,235,215,.92)';
    const fs = n>8 ? 11 : n>6 ? 12 : 13;
    ctx.font=`${sel?'600':'500'} ${fs}px 'Jost',system-ui,sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    // Sombra sutil para contraste sobre as fatias
    ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=2; ctx.shadowOffsetY=.5;
    const parts=s.name.split(' ');
    if(parts.length>1){ctx.fillText(parts[0],0,-fs*0.6);ctx.fillText(parts.slice(1).join(' '),0,fs*0.6);}
    else ctx.fillText(s.name,0,0);
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.restore();
  });
  // outer glow ring
  ctx.beginPath();ctx.arc(CX,CY,R+7,0,Math.PI*2);ctx.strokeStyle='rgba(200,168,75,.1)';ctx.lineWidth=1;ctx.stroke();
  // center
  ctx.beginPath();ctx.arc(CX,CY,IR,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--bg').trim()||'#1a3a2a';ctx.fill();
  ctx.strokeStyle='rgba(200,168,75,.45)';ctx.lineWidth=1.5;ctx.stroke();
  // center text
  const sel=rodaSelIdx>=0?slices[rodaSelIdx]:null;
  const lbl=document.getElementById('rodaCenter');
  if(lbl){lbl.querySelector('.roda-center-label').textContent=sel?sel.name:'Toque\num setor';}
}

function getRodaIdx(mx,my){
  const cv=document.getElementById('rodaCanvas');
  if(!cv)return-1;
  const CX=170,CY=170,R=162,IR=38;
  const dx=mx-CX,dy=my-CY,d=Math.sqrt(dx*dx+dy*dy);
  if(d<IR||d>R+8)return-1;
  let a=Math.atan2(dy,dx)+Math.PI/2; if(a<0)a+=2*Math.PI; if(a>=2*Math.PI)a-=2*Math.PI;
  const n=RODA_DATA[rodaActiveLayer].length;
  return Math.floor(a/(2*Math.PI/n))%n;
}

function initRodaEvents(){
  const cv=document.getElementById('rodaCanvas');
  if(!cv||cv._hasEvents)return; cv._hasEvents=true;
  cv.addEventListener('mousemove',e=>{ const r=cv.getBoundingClientRect(); rodaHovIdx=getRodaIdx(e.clientX-r.left,e.clientY-r.top); cv.style.cursor=rodaHovIdx>=0?'pointer':'default'; drawRoda(); });
  cv.addEventListener('mouseleave',()=>{ rodaHovIdx=-1; drawRoda(); });
  cv.addEventListener('click',e=>{ const r=cv.getBoundingClientRect(); const i=getRodaIdx(e.clientX-r.left,e.clientY-r.top); if(i>=0){rodaSelIdx=i===rodaSelIdx?-1:i; drawRoda(); renderRodaPanel(i>=0?RODA_DATA[rodaActiveLayer][i]:null);} });
  cv.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.touches[0],r=cv.getBoundingClientRect(); const i=getRodaIdx(t.clientX-r.left,t.clientY-r.top); if(i>=0){rodaSelIdx=i===rodaSelIdx?-1:i; drawRoda(); renderRodaPanel(i>=0?RODA_DATA[rodaActiveLayer][i]:null);} },{passive:false});
}

// override initRoda to attach events after draw
const _origInitRoda=window.initRoda;
window.initRoda=function(){
  const lay=document.getElementById('rodaLayers'); if(!lay)return;
  lay.innerHTML='';
  RODA_LAYERS.forEach(l=>{
    const b=document.createElement('button');
    b.className='roda-layer-btn'+(rodaActiveLayer===l.id?' on':'');
    b.textContent=l.label;
    b.onclick=()=>{ rodaActiveLayer=l.id; rodaSelIdx=-1; window.initRoda(); renderRodaPanel(null); };
    lay.appendChild(b);
  });
  rodaHovIdx=-1; drawRoda(); initRodaEvents();
};

function _rodaPrepSpans(prep){
  const s='font-size:.72rem;padding:3px 10px;background:rgba(255,255,255,.04);border:0.5px solid var(--faint);border-radius:6px;color:var(--muted);display:inline-flex;align-items:center;gap:5px';
  return `<span style="${s}">${svgIcon('thermometer')} ${esc(prep.temp)}</span><span style="${s}">${_clockIcon()} ${esc(prep.tempo)}</span><span style="${s}">${svgIcon('spoon')} ${esc(prep.dose)}</span><span style="${s}">${svgIcon('calendar')} ${esc(prep.freq)}</span>`;
}
function _clockIcon(){return '<svg class="ui-ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-.15em"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';}

function calcRodaComboPrep(names){
  const herbs=names.map(n=>HERBS.find(h=>h.n===n)).filter(Boolean);
  const temps=herbs.map(h=>parseInt(String(h.temp).replace(/[^\d]/g,''))).filter(n=>n>0);
  const times=herbs.map(h=>parseInt(h.tempo)).filter(n=>n>0);
  const minTemp=temps.length?Math.min(...temps):90;
  const maxTime=times.length?Math.max(...times):8;
  const dose=names.length>1?`1 col de cada / 250ml`:(herbs[0]?.dose||'1-2 col / 250ml');
  const freq=herbs[0]?.freq||'2-3x ao dia';
  return {temp:`${minTemp}°C`,tempo:`${maxTime} min`,dose,freq};
}

function toggleRodaHerb(name){
  if(!window._rodaHerbSelection)window._rodaHerbSelection=new Set();
  if(_rodaHerbSelection.has(name))_rodaHerbSelection.delete(name);
  else _rodaHerbSelection.add(name);
  document.querySelectorAll('#rodaPanel .roda-herb-item').forEach(el=>{
    const sel=_rodaHerbSelection.has(el.dataset.herb);
    el.classList.toggle('selected',sel);
    const icon=el.querySelector('.roda-herb-sel-icon');
    if(icon)icon.textContent=sel?'✓':'+';
  });
  const prep=_rodaHerbSelection.size>0?calcRodaComboPrep([..._rodaHerbSelection]):window._rodaCurrentSlice?.prep;
  if(prep){
    const ps=document.getElementById('rodaPrepSection');
    if(ps)ps.innerHTML=_rodaPrepSpans(prep);
    const lbl=document.getElementById('rodaPrepLabel');
    if(lbl)lbl.textContent=_rodaHerbSelection.size>0?'Preparo da combinação selecionada':'Preparo';
  }
}

function renderRodaPanel(slice){
  const p=document.getElementById('rodaPanel');
  if(!slice){p.innerHTML='<div class="roda-empty"><div style="opacity:.3;margin-bottom:.75rem;color:var(--gold2)">'+svgIcon('tea',32)+'</div><div>Selecione um setor da roda para ver as ervas recomendadas</div></div>';return;}
  window._rodaCurrentSlice=slice;
  window._rodaHerbSelection=new Set();
  const colDot=RODA_COLORS_MAP[rodaActiveLayer][RODA_DATA[rodaActiveLayer].indexOf(slice)]||'#c8a84b';
  p.innerHTML=`<div class="roda-result">
    <div class="roda-result-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:10px;height:10px;border-radius:50%;background:${colDot};flex-shrink:0"></div>
        <div class="roda-result-name">${slice.name}</div>
      </div>
    </div>
    <div style="font-size:.65rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem">Ervas recomendadas <span style="opacity:.5;font-style:italic;text-transform:none;letter-spacing:0">— toque para selecionar</span></div>
    ${slice.herbs.map(h=>{
      const match=HERBS.find(x=>x.n===h.n);
      const img=match&&match.img;
      const visual=img
        ? `<img class="roda-herb-img" src="${img}" data-responsive="${img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'roda-herb-icon\\'>${h.icon}</div>'">`
        : `<div class="roda-herb-icon">${h.icon}</div>`;
      return `
      <div class="roda-herb-item" data-herb="${esc(h.n)}" onclick="toggleRodaHerb('${esc(h.n)}')">
        ${visual}
        <div style="flex:1"><div class="roda-herb-name">${esc(h.n)}</div><div class="roda-herb-ef">${esc(h.ef)}</div></div>
        <span class="roda-herb-sel-icon">+</span>
      </div>`;
    }).join('')}
    <div class="roda-combo">
      <div class="roda-combo-title">Combinações sugeridas</div>
      ${slice.combo.map(c=>`<span class="roda-combo-chip">${svgIcon('tea')} ${esc(c)}</span>`).join('')}
    </div>
    <div class="roda-prep">
      <div id="rodaPrepLabel" class="roda-combo-title" style="margin-bottom:.4rem">Preparo</div>
      <div id="rodaPrepSection" style="display:flex;flex-wrap:wrap;gap:6px">${_rodaPrepSpans(slice.prep)}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:.75rem">
      <button class="roda-start-btn" style="flex:1" onclick="openTimerFromRoda(window._rodaCurrentSlice)">⏱ Preparar agora</button>
      <button class="roda-start-btn" style="flex:1;background:rgba(255,255,255,.04);border-color:var(--faint)" onclick="sendRodaToBlend()">＋ Blend</button>
    </div>
    ${(rodaActiveLayer==='sintoma'||rodaActiveLayer==='sistema')?`
    <div class="roda-disclaimer" role="note">
      As ervas do Ervatório são curadoria botânica para o bem-estar e o prazer sensorial. Elas não substituem medicamentos nem orientação médica. Em caso de dúvidas, sintomas ou condições de saúde, consulte um profissional de saúde.
    </div>`:''}
  </div>`;
}

function findHerbAndOpen(name){
  const h=HERBS.find(x=>x.n===name||name.includes(x.n));
  if(h) openHerbModal(h.id);
}

function sendRodaToBlend(){
  const slice=window._rodaCurrentSlice;
  if(!slice) return;
  const sel=window._rodaHerbSelection&&_rodaHerbSelection.size>0;
  const names=sel?[..._rodaHerbSelection]:slice.herbs.map(h=>h.n||h);
  const ids=names.map(n=>{
    const h=HERBS.find(x=>x.n===n||(n&&n.includes&&n.includes(x.n)));
    return h?h.id:null;
  }).filter(Boolean);
  ids.forEach(id=>{ if(!blendTray.includes(id)) blendTray.push(id); });
  localStorage.setItem('erb_tray',JSON.stringify(blendTray));
  renderTray();
  toastLink(`${ids.length} erva${ids.length!==1?'s':''} adicionada${ids.length!==1?'s':''} ao blend`,'Ver blend →',()=>{ goPage('blends'); if(typeof switchBlendTab==='function') switchBlendTab('assistente'); });
}

function openTimerFromRoda(slice){
  const sel=window._rodaHerbSelection&&_rodaHerbSelection.size>0;
  const names=sel?[..._rodaHerbSelection]:null;
  const prep=sel?calcRodaComboPrep(names):slice.prep;
  const title=sel?names.join(' + '):slice.name;
  const mins=parseInt(prep.tempo)||8;
  const herbDesc=sel?`${names.join(', ')} — ${prep.dose}`:`${prep.dose}`;
  const steps=[
    {title:`Aqueça a água`,desc:`Ferva e deixe esfriar até ${prep.temp}. Nunca use água fervendo em ervas delicadas.`,duration:0},
    {title:`Adicione as ervas`,desc:`${herbDesc}. Coloque na infusora ou diretamente na xícara.`,duration:0},
    {title:`Infusão`,desc:`Tampa a xícara para não perder os óleos essenciais. Aguarde ${prep.tempo}.`,duration:mins*60},
    {title:`Coe e aproveite`,desc:`Coe, adicione mel ou limão se desejar. Beba morno. Frequência: ${prep.freq}.`,duration:0},
  ];
  launchTimer(title, steps);
}

// ════════════════════════════════════════
// ── PERFIL ──
// ════════════════════════════════════════
const PERFIL_SAUDE_OPTS=['Hipertensão','Diabetes','Ansiedade','Insônia','Gastrite','Grávida','Amamentando','Criança','Sem restrições'];
const PERFIL_OBJ_OPTS=['Melhorar sono','Reduzir ansiedade','Mais energia','Focar mais','Emagrecer','Digestão','Imunidade','Desintoxicar','Beleza da pele'];
const PERFIL_SABOR_OPTS=['Doce','Suave','Cítrico','Amargo','Picante','Floral','Mentolado'];
const PERFIL_MOMENTO_OPTS=['Ao acordar','Manhã','Tarde','Noite','Antes de dormir','Pós-refeição'];

let perfilState = safeLoad('erb_perfil', {nome:"",saude:[],objetivos:[],sabores:[],momentos:[],restricoes:""});

function renderPerfil(){
  document.getElementById('perfilNome').value=perfilState.nome||'';
  document.getElementById('perfilRestricoes').value=perfilState.restricoes||'';
  renderChipGroup('perfilSaude',PERFIL_SAUDE_OPTS,'saude');
  renderChipGroup('perfilObjetivos',PERFIL_OBJ_OPTS,'objetivos');
  renderChipGroup('perfilSabores',PERFIL_SABOR_OPTS,'sabores');
  renderChipGroup('perfilMomentos',PERFIL_MOMENTO_OPTS,'momentos');
  renderPerfilRecomendacoes();
}

function renderChipGroup(containerId, opts, key){
  const el=document.getElementById(containerId);
  el.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('button');
    b.className='perfil-chip'+(perfilState[key]?.includes(o)?' on':'');
    b.textContent=o;
    b.onclick=()=>{
      if(!perfilState[key])perfilState[key]=[];
      if(perfilState[key].includes(o)) perfilState[key]=perfilState[key].filter(x=>x!==o);
      else perfilState[key].push(o);
      b.classList.toggle('on');
      renderPerfilRecomendacoes();
    };
    el.appendChild(b);
  });
}

function savePerfil(){
  perfilState.nome=document.getElementById('perfilNome').value;
  perfilState.restricoes=document.getElementById('perfilRestricoes').value;
  localStorage.setItem('erb_perfil',JSON.stringify(perfilState));
  toast(`Perfil de ${perfilState.nome||'usuário'} salvo!`);
  renderPerfilRecomendacoes();
}

function renderPerfilRecomendacoes(){
  const el=document.getElementById('perfilRecomendacoes');
  if(!el)return;
  const obj=perfilState.objetivos||[];
  const saude=perfilState.saude||[];
  const momentos=perfilState.momentos||[];
  if(!obj.length&&!saude.length){el.innerHTML='';return;}

  // Smart recs based on profile
  const recs=[];
  if(obj.includes('Melhorar sono')||obj.includes('Reduzir ansiedade')) recs.push({name:'Blend da Noite',herbs:'Camomila + Maracujá + Melissa',why:'Baseado nos seus objetivos de sono e ansiedade',color:'#1e3d5c'});
  if(obj.includes('Mais energia')||obj.includes('Focar mais')) recs.push({name:'Blend do Foco',herbs:'Chá Verde + Alecrim + Ginkgo',why:'Para energia e concentração ao longo do dia',color:'#3a2d6b'});
  if(obj.includes('Digestão')) recs.push({name:'Digestivo Diário',herbs:'Boldo + Hortelã + Erva-doce',why:'Apoio à sua digestão pós-refeição',color:'#5a3a1a'});
  if(obj.includes('Emagrecer')) recs.push({name:'Blend Metabólico',herbs:'Chá Verde + Carqueja + Hibisco',why:'Termogênico e sacietogênico natural',color:'#2d5a2d'});
  if(obj.includes('Imunidade')) recs.push({name:'Blend Imunidade',herbs:'Equinácea + Cúrcuma + Gengibre',why:'Para fortalecer suas defesas',color:'#2d4a3a'});
  if(saude.includes('Hipertensão')) recs.push({name:'Hipotensor Suave',herbs:'Hibisco + Melissa + Capim-Limão',why:'Seguro para hipertensão, 3x ao dia',color:'#6b2d3a'});
  if(saude.includes('Gastrite')) recs.push({name:'Protetor Gástrico',herbs:'Espinheira Santa + Camomila + Alcaçuz',why:'Antiácido e cicatrizante natural',color:'#5a3a1a'});
  if(saude.includes('Grávida')) recs.push({name:'Blend Seguro Gestação',herbs:'Camomila + Erva Cidreira + Capim-Limão',why:'Ervas seguras e comprovadas na gestação',color:'#2d5a4a'});

  const warnings=[];
  if(saude.includes('Hipertensão')) warnings.push('Evite guaraná e estimulantes fortes.');
  if(saude.includes('Grávida')) warnings.push('Evite arruda, alfazema em doses altas e valeriana.');
  if(saude.includes('Diabetes')) warnings.push('Prefira ervas sem açúcar. Pata de vaca e canela são aliadas.');

  const nome=perfilState.nome?`, ${perfilState.nome}`:'';
  el.innerHTML=`
    <div class="perfil-rec-title">Recomendações para você${nome}</div>
    ${warnings.length?`<div class="warn-box" style="margin-bottom:1rem">⚠ ${warnings.join(' ')}</div>`:''}
    ${recs.map(r=>`
      <div class="perfil-rec-card">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:.4rem">
          <div style="width:8px;height:8px;border-radius:50%;background:${r.color}"></div>
          <div style="font-size:.88rem;font-weight:400;color:var(--cream)">${r.name}</div>
        </div>
        <div style="font-size:.82rem;color:var(--gold2);margin-bottom:3px;display:flex;align-items:center;gap:6px">${svgIcon('tea')} ${esc(r.herbs)}</div>
        <div style="font-size:.75rem;color:var(--muted)">${r.why}</div>
      </div>`).join('')}
    ${momentos.length?`<div style="margin-top:.75rem;font-size:.75rem;color:var(--muted)">Momentos favoritos: ${momentos.join(', ')}</div>`:''}`;
}

// ══��═════════════════════════════════════
// ── TIMER DE PREPARO ──
// ════════════════════════════════════════
let timerState={steps:[],current:0,remaining:0,total:0,running:false,interval:null,herbName:''};

function openTimer(herbId){
  const h=HERBS.find(x=>x.id===herbId);
  if(!h)return;
  const mins=parseInt(h.tempo)||8;
  const steps=[
    {title:'Aqueça a água',      desc:`Ferva e deixe esfriar até ${h.temp}. Água muito quente destrói compostos ativos.`,duration:0},
    {title:'Meça as ervas',      desc:`Use ${h.dose}. Ervas frescas: prefira ao seco. Infusora limpa.`,duration:0},
    {title:'Infusão',            desc:`Tampa bem a xícara para não perder os óleos essenciais. Aguarde exatamente ${h.tempo}.`,duration:mins*60},
    {title:'Coe e finalize',     desc:`Retire as ervas. Adicione mel ou limão se quiser. Ideal: ${h.freq}.`,duration:0},
  ];
  document.getElementById('herbModal').classList.remove('on');
  launchTimer(h.n, steps);
}

function launchTimer(name, steps){
  timerState={steps,current:0,remaining:steps[0].duration,total:steps[0].duration,running:false,interval:null,herbName:name};
  document.getElementById('timerModal').classList.add('on');
  renderTimerStep();
}

function closeTimerModal(e){
  if(!e||e.target===document.getElementById('timerModal')){
    clearInterval(timerState.interval); timerState.running=false;
    document.getElementById('timerModal').classList.remove('on');
  }
}

function renderTimerStep(){
  const {steps,current,herbName}=timerState;
  const step=steps[current];
  const hasTimer=step.duration>0;
  const isLast=current===steps.length-1;
  const dots=steps.map((_,i)=>`<div class="timer-step-dot ${i<current?'done':i===current?'active':''}"></div>`).join('');

  document.getElementById('timerContent').innerHTML=`
    <div class="modal-handle"></div>
    <button class="modal-close" onclick="closeTimerModal()">✕</button>
    <div class="timer-wrap">
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.75rem;letter-spacing:.06em">${esc(herbName)}</div>
      <div class="timer-step-indicator">${dots}</div>
      <div style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem">Passo ${current+1} de ${steps.length}</div>
      <div class="timer-step-title">${esc(step.title)}</div>
      <div class="timer-step-desc">${esc(step.desc)}</div>
      ${hasTimer?`
        <div class="timer-ring-wrap">
          <canvas id="timerRing" width="160" height="160"></canvas>
          <div class="timer-ring-time" id="timerDisplay">${formatTime(step.duration)}</div>
          <div class="timer-ring-label" id="timerLabel">aguardando</div>
        </div>
        <div class="timer-controls">
          <button class="timer-btn primary" id="timerPlayBtn" onclick="toggleTimer()">▶ Iniciar</button>
          <button class="timer-btn" onclick="resetTimer()">↺ Reset</button>
        </div>`:''}
      <button class="timer-next-btn" id="timerNextBtn" onclick="timerNext()" ${hasTimer&&timerState.remaining>0&&!timerState.running?'':''}>${isLast?'Concluído ✓':'Próximo →'}</button>
    </div>`;
  if(hasTimer) drawTimerRing(1);
}

function formatTime(s){ return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

function drawTimerRing(progress){
  const cv=document.getElementById('timerRing'); if(!cv)return;
  const ctx=cv.getContext('2d'),CX=80,CY=80,R=68,LW=6;
  ctx.clearRect(0,0,160,160);
  // bg ring
  ctx.beginPath();ctx.arc(CX,CY,R,0,Math.PI*2);ctx.strokeStyle='rgba(200,168,75,.1)';ctx.lineWidth=LW;ctx.stroke();
  // progress ring
  const start=-Math.PI/2, end=start+(2*Math.PI*progress);
  ctx.beginPath();ctx.arc(CX,CY,R,start,end);
  ctx.strokeStyle=progress>0.2?'#c8a84b':'#e08060';ctx.lineWidth=LW;ctx.lineCap='round';ctx.stroke();
}

function toggleTimer(){
  const step=timerState.steps[timerState.current];
  if(!step.duration)return;
  if(timerState.running){
    clearInterval(timerState.interval); timerState.running=false;
    document.getElementById('timerPlayBtn').textContent='▶ Continuar';
    document.getElementById('timerLabel').textContent='pausado';
  } else {
    timerState.running=true;
    document.getElementById('timerPlayBtn').textContent='⏸ Pausar';
    document.getElementById('timerLabel').textContent='infusando...';
    timerState.interval=setInterval(()=>{
      timerState.remaining--;
      const prog=timerState.remaining/timerState.total;
      drawTimerRing(prog);
      const disp=document.getElementById('timerDisplay'); if(disp)disp.textContent=formatTime(timerState.remaining);
      if(timerState.remaining<=0){
        clearInterval(timerState.interval); timerState.running=false;
        const lbl=document.getElementById('timerLabel'); if(lbl)lbl.textContent='pronto!';
        const btn=document.getElementById('timerPlayBtn'); if(btn)btn.textContent='✓ Concluído';
        toast(`${timerState.herbName} — infusão concluída!`);
        drawTimerRing(0);
      }
    },1000);
  }
}

function resetTimer(){
  clearInterval(timerState.interval); timerState.running=false;
  timerState.remaining=timerState.steps[timerState.current].duration;
  timerState.total=timerState.remaining;
  renderTimerStep();
}

function timerNext(){
  clearInterval(timerState.interval); timerState.running=false;
  const {steps,current}=timerState;
  if(current>=steps.length-1){
    // Complete
    document.getElementById('timerContent').innerHTML=`
      <div class="modal-handle"></div>
      <button class="modal-close" onclick="closeTimerModal()">✕</button>
      <div class="timer-complete">
        <div class="timer-complete-icon" style="color:var(--gold2)">${svgIcon('tea',44)}</div>
        <div class="timer-complete-title">Chá pronto!</div>
        <div class="timer-complete-sub">Seu ${esc(timerState.herbName)} está preparado.<br>Beba com calma e aproveite os benefícios.</div>
        <button class="timer-next-btn" style="margin-top:1.5rem" onclick="closeTimerModal()">Fechar</button>
      </div>`;
    return;
  }
  timerState.current++;
  timerState.remaining=steps[timerState.current].duration;
  timerState.total=timerState.remaining;
  renderTimerStep();
}
let toastTimer;
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.onclick=null; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2500); }
function toastLink(msg,linkLabel,cb){ const t=document.getElementById('toast'); t.innerHTML=`${esc(msg)} <span style="color:var(--gold2);text-decoration:underline;cursor:pointer">${esc(linkLabel)}</span>`; t.onclick=()=>{ t.classList.remove('show'); cb(); }; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>{t.classList.remove('show');t.onclick=null;},3500); }

// ════════════════════════════════════════
// ── CONSTRUTOR DE BLEND ──
// ════════════════════════════════════════
const HERB_META = {
  1: {type:'flower',role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:5,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  2: {type:'root',  role:'base', intensity:4,tempMin:82,tempMax:90,timeMin:8,timeMax:15,qty:'1 col. sopa',unit:'g',grams:3},
  3: {type:'leaf',  role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  4: {type:'leaf',  role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:5,timeMax:8, qty:'1 col. sopa',unit:'g',grams:2},
  5: {type:'root',  role:'accent',intensity:4,tempMin:88,tempMax:98,timeMin:8,timeMax:15,qty:'3-4 fatias',unit:'fatias',grams:5},
  6: {type:'leaf',  role:'base', intensity:3,tempMin:70,tempMax:80,timeMin:2,timeMax:4, qty:'1 col. sopa',unit:'g',grams:2},
  7: {type:'flower',role:'heart',intensity:3,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'2 col. sopa',unit:'g',grams:3},
  8: {type:'leaf',  role:'accent',intensity:3,tempMin:85,tempMax:95,timeMin:4,timeMax:7, qty:'1 col. sopa',unit:'g',grams:2},
  9: {type:'leaf',  role:'heart',intensity:3,tempMin:80,tempMax:90,timeMin:4,timeMax:7, qty:'1 col. sopa',unit:'g',grams:2},
  10:{type:'seed',  role:'accent',intensity:2,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  11:{type:'bark',  role:'accent',intensity:3,tempMin:90,tempMax:100,timeMin:8,timeMax:15,qty:'1 pau pequeno',unit:'pau',grams:3},
  12:{type:'root',  role:'accent',intensity:3,tempMin:88,tempMax:98,timeMin:8,timeMax:12,qty:'1 col. chá',unit:'g',grams:2},
  13:{type:'flower',role:'heart',intensity:2,tempMin:80,tempMax:88,timeMin:6,timeMax:10,qty:'1 col. sopa flores',unit:'g',grams:2},
  14:{type:'leaf',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:4,timeMax:8, qty:'1 col. sopa',unit:'g',grams:2},
  15:{type:'leaf',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1-2 col. sopa',unit:'g',grams:3},
  16:{type:'leaf',  role:'base', intensity:3,tempMin:88,tempMax:98,timeMin:8,timeMax:12,qty:'2 col. sopa',unit:'g',grams:3},
  17:{type:'leaf',  role:'heart',intensity:2,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'2 folhas frescas',unit:'folhas',grams:3},
  18:{type:'leaf',  role:'base', intensity:2,tempMin:82,tempMax:90,timeMin:8,timeMax:12,qty:'1-2 col. sopa',unit:'g',grams:2},
  19:{type:'leaf',  role:'heart',intensity:2,tempMin:82,tempMax:90,timeMin:5,timeMax:8, qty:'2 col. sopa',unit:'g',grams:3},
  20:{type:'leaf',  role:'base', intensity:2,tempMin:85,tempMax:92,timeMin:8,timeMax:12,qty:'1 col. sopa',unit:'g',grams:2},
  21:{type:'leaf',  role:'accent',intensity:4,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
  22:{type:'leaf',  role:'base', intensity:2,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1 col. sopa',unit:'g',grams:2},
  23:{type:'flower',role:'accent',intensity:2,tempMin:85,tempMax:95,timeMin:4,timeMax:7, qty:'1-2 col. sopa',unit:'g',grams:2},
  24:{type:'flower',role:'heart',intensity:2,tempMin:82,tempMax:90,timeMin:6,timeMax:10,qty:'1-2 col. sopa',unit:'g',grams:2},
  25:{type:'leaf',  role:'base', intensity:2,tempMin:90,tempMax:100,timeMin:4,timeMax:7, qty:'1-2 col. sopa',unit:'g',grams:3},
  26:{type:'root',  role:'base', intensity:3,tempMin:85,tempMax:95,timeMin:8,timeMax:12,qty:'1 col. chá pó',unit:'g',grams:2},
  27:{type:'seed',  role:'accent',intensity:5,tempMin:78,tempMax:85,timeMin:4,timeMax:6, qty:'1/2 col. chá',unit:'g',grams:1},
  28:{type:'leaf',  role:'heart',intensity:3,tempMin:85,tempMax:95,timeMin:6,timeMax:10,qty:'1 col. sopa',unit:'g',grams:2},
};
const SYNERGIES=[
  {ids:[1,4],label:'Dupla calmante clássica',text:'Camomila + Melissa: apigenina e ácido rosmarínico atuam sinergicamente nos receptores GABA, amplificando o efeito sedativo suave.'},
  {ids:[1,3],label:'Sono profundo',text:'Camomila + Maracujá: ação complementar — camomila relaxa o corpo, maracujá acalma a mente ansiosa.'},
  {ids:[2,3],label:'Sedativo potente',text:'Valeriana + Maracujá: combinação estudada clinicamente. Potência próxima a benzodiazepínicos suaves sem risco de dependência.'},
  {ids:[5,11],label:'Termogênico poderoso',text:'Gengibre + Canela: ambos ativam o metabolismo por vias diferentes, efeito cumulativo.'},
  {ids:[6,8],label:'Foco máximo',text:'Chá Verde + Alecrim: L-teanina equilibra a estimulação do 1,8-cineol do alecrim. Foco sem ansiedade.'},
  {ids:[12,5],label:'Anti-inflamatório duplo',text:'Cúrcuma + Gengibre: inibem COX-2 e LOX por caminhos distintos. Efeito 2-3x superior ao isolado.'},
  {ids:[7,9],label:'Detox refrescante',text:'Hibisco + Hortelã: hibisco elimina toxinas, hortelã refresca. Ótimo gelado.'},
  {ids:[14,15],label:'Detox hepático completo',text:'Boldo + Alcachofra: a dupla mais eficaz para fígado sobrecarregado.'},
  {ids:[4,19],label:'Calmante cítrico',text:'Melissa + Erva Cidreira: ambas têm citral como composto-chave. Potência calmante dobrada.'},
  {ids:[1,10],label:'Digestivo e calmante',text:'Camomila + Erva-doce: combinação tradicional para adultos e crianças. Anti-espasmódica e calmante.'},
];
const CONFLICTS=[
  {ids:[6,2],text:'Chá Verde (cafeína) + Valeriana (sedativa): efeitos opostos que se anulam.'},
  {ids:[27,2],text:'Guaraná (estimulante forte) + Valeriana: cafeína reduz o efeito sedativo.'},
  {ids:[6,3],text:'Chá Verde + Maracujá: cafeína pode contrabalancear o ansiolítico. Use só de manhã.'},
  {ids:[14,11],text:'Boldo + Canela em doses altas: ambos têm cumarina. Monitorar em uso prolongado.'},
];

let ctrBlend=[], ctrCatFilter='Todos';

function renderCtrHerbs(){
  const q=(document.getElementById('ctrSearch')?.value||'').toLowerCase();
  const list=HERBS.filter(h=>{
    if(q&&!(h.n+h.ef+h.tags.join(' ')).toLowerCase().includes(q))return false;
    if(ctrCatFilter!=='Todos'&&h.cat!==ctrCatFilter)return false;
    return true;
  });
  const el=document.getElementById('ctrHerbList'); if(!el)return;
  el.innerHTML=list.map(h=>{
    const inB=ctrBlend.some(b=>b.id===h.id);
    const visual = h.img
      ? `<img class="ctr-herb-row-img" src="${h.img}" data-responsive="${h.img}" alt="${esc(h.n)}" loading="lazy" decoding="async" onerror="this.outerHTML='<div class=\\'ctr-herb-row-icon\\'>${h.icon}</div>'">`
      : `<div class="ctr-herb-row-icon">${h.icon}</div>`;
    return `<div class="ctr-herb-row ${inB?'in-blend':''}" onclick="toggleCtrHerb(${h.id})">
      ${visual}
      <div style="flex:1;min-width:0"><div class="ctr-herb-row-name">${esc(h.n)}</div><div class="ctr-herb-row-cat">${esc(h.cat)}</div></div>
      <button class="ctr-herb-add">${inB?'✓':'+'}</button>
    </div>`;
  }).join('');
}

function buildCtrFilters(){
  const el=document.getElementById('ctrFilters'); if(!el)return;
  el.innerHTML='';
  ['Todos','Calmante','Sono','Digestivo','Estimulante','Respiratório','Metabólico','Cognitivo','Hormonal','Pele'].forEach(c=>{
    const b=document.createElement('button');
    b.className='ctr-fchip'+(ctrCatFilter===c?' on':'');
    b.textContent=c;
    b.onclick=()=>{ctrCatFilter=c;buildCtrFilters();renderCtrHerbs();};
    el.appendChild(b);
  });
}

function toggleCtrHerb(id){
  const idx=ctrBlend.findIndex(b=>b.id===id);
  if(idx>=0)ctrBlend.splice(idx,1); else ctrBlend.push({id,qty:1});
  renderCtrBlend(); renderCtrHerbs();
}

function changeCtrQty(id,delta){
  const item=ctrBlend.find(b=>b.id===id); if(!item)return;
  item.qty=Math.max(0.5,Math.min(4,item.qty+delta*0.5));
  renderCtrBlend();
}

function removeCtrHerb(id){
  ctrBlend=ctrBlend.filter(b=>b.id!==id);
  renderCtrBlend(); renderCtrHerbs();
}

function getQtyLabel(qty,meta){
  if(!meta||!meta.unit)return qty+' col.';
  if(meta.unit==='fatias')return Math.round(qty*3)+' fatias';
  if(meta.unit==='pau')return qty<1?'½ pau':'1 pau';
  if(meta.unit==='folhas')return Math.round(qty*2)+' folhas';
  if(qty===0.5)return '½ col.';
  if(qty===1)return '1 col.';
  return qty+' col.';
}

function renderCtrBlend(){
  const empty=document.getElementById('ctrBlendEmpty');
  const items=document.getElementById('ctrBlendItems');
  const analysis=document.getElementById('ctrAnalysis');
  if(!items)return;
  if(!ctrBlend.length){
    if(empty)empty.style.display='block';
    items.innerHTML='';
    if(analysis)analysis.style.display='none';
    return;
  }
  if(empty)empty.style.display='none';
  if(analysis)analysis.style.display='block';
  items.innerHTML=ctrBlend.map(b=>{
    const h=HERBS.find(x=>x.id===b.id);
    const m=HERB_META[b.id]||{};
    return `<div class="ctr-blend-item">
      <span style="font-size:1.1rem">${h.icon}</span>
      <div class="ctr-blend-item-info">
        <div class="ctr-blend-item-name">${esc(h.n)}</div>
        <div class="ctr-blend-item-ef">${esc(h.ef.split(',')[0])}</div>
      </div>
      <div class="ctr-blend-qty">
        <button class="ctr-qty-btn" onclick="changeCtrQty(${b.id},-1)">−</button>
        <span class="ctr-qty-val">${getQtyLabel(b.qty,m)}</span>
        <button class="ctr-qty-btn" onclick="changeCtrQty(${b.id},1)">+</button>
      </div>
      <button class="ctr-blend-rm" onclick="removeCtrHerb(${b.id})">✕</button>
    </div>`;
  }).join('');
  analyzeBlend();
}

function analyzeBlend(){
  if(!ctrBlend.length)return;
  const herbs=ctrBlend.map(b=>({...HERBS.find(x=>x.id===b.id),...HERB_META[b.id]||{},qty:b.qty}));

  // Smart temperature: minimum (protect delicate)
  const smartTemp=Math.min(...herbs.map(h=>h.tempMin||85));
  const tempLabel=smartTemp<=75?'70-75°C':smartTemp<=82?'80-85°C':smartTemp<=88?'85-90°C':'90-95°C';

  // Smart time: weighted average by herb type
  const tw={root:1.3,bark:1.4,seed:1.1,leaf:1.0,flower:0.8,resin:1.2};
  const smartTime=Math.round(herbs.map(h=>((h.timeMin+h.timeMax)/2)*(tw[h.type]||1)).reduce((a,b)=>a+b,0)/herbs.length);

  // Dose
  const totalG=herbs.reduce((s,h)=>s+(h.grams||2)*h.qty,0);

  // Characteristics radar
  const chars={Calmante:0,Estimulante:0,Digestivo:0,'Anti-inflam.':0,Detox:0,Amargo:0};
  herbs.forEach(h=>{
    const t=h.tags||[];
    if(t.some(x=>['calmante','ansiedade','sono'].includes(x)))chars.Calmante+=h.qty*20;
    if(t.some(x=>['energia','estimulante','termogênico','foco'].includes(x)))chars.Estimulante+=h.qty*20;
    if(t.some(x=>['digestivo','gases','estômago','bile'].includes(x)))chars.Digestivo+=h.qty*20;
    if(t.some(x=>['anti-inflamatório','articulações','inflamação'].includes(x)))chars['Anti-inflam.']+=h.qty*20;
    if(t.some(x=>['fígado','detox','diurético'].includes(x)))chars.Detox+=h.qty*20;
    if(['Boldo','Carqueja','Alcachofra','Losna'].includes(h.n))chars.Amargo+=h.qty*25;
  });
  const maxC=Math.max(...Object.values(chars),1);
  const cCol={Calmante:'#1e3d5c',Estimulante:'#6b5a2d',Digestivo:'#5a3a1a','Anti-inflam.':'#3a2d6b',Detox:'#2d5a2d',Amargo:'#2d4a2d'};
  document.getElementById('ctrCharBox').innerHTML=Object.entries(chars).map(([k,v])=>{
    const p=Math.min(100,Math.round(v/maxC*100));
    return `<div class="ctr-char-row"><span class="ctr-char-label">${k}</span><div class="ctr-char-bar-wrap"><div class="ctr-char-bar" style="width:${p}%;background:${cCol[k]}"></div></div><span class="ctr-char-val">${p}%</span></div>`;
  }).join('');

  // Effects
  const allTags=[...new Set(herbs.flatMap(h=>h.tags||[]))];
  const eCls={calmante:'positive',sono:'positive',digestivo:'positive','anti-inflamatório':'positive',ansiedade:'positive',energia:'neutral',foco:'neutral',estimulante:'neutral',termogênico:'caution',gripe:'positive',imunidade:'positive'};
  document.getElementById('ctrEffects').innerHTML=allTags.slice(0,12).map(t=>`<span class="ctr-effect-tag ctr-effect-${eCls[t]||'neutral'}">${esc(t)}</span>`).join('');

  // Warnings
  const ids=ctrBlend.map(b=>b.id);
  const conflicts=CONFLICTS.filter(c=>c.ids.every(id=>ids.includes(id)));
  const avoids=herbs.filter(h=>h.avoid&&h.avoid.length).map(h=>`${h.n}: ${h.avoid.slice(0,2).join(', ')}`);
  document.getElementById('ctrWarnings').innerHTML=(conflicts.length||avoids.length)?`<div class="warn-box" style="margin-bottom:1rem">${conflicts.map(c=>`⚠ <strong>Conflito:</strong> ${esc(c.text)}`).join('<br>')}${avoids.length?`<div style="margin-top:${conflicts.length?'.5rem':'0'}">ℹ Contraindicações: ${avoids.map(a=>esc(a)).join(' · ')}</div>`:''}</div>`:'';

  // Synergies
  document.getElementById('ctrSynergies').innerHTML=SYNERGIES.filter(s=>s.ids.every(id=>ids.includes(id))).map(s=>`<div class="ctr-synergy-box"><div class="ctr-synergy-title">✦ Sinergia: ${esc(s.label)}</div><div class="ctr-synergy-text">${esc(s.text)}</div></div>`).join('');

  // Smart recipe — sort roots first, flowers last
  const tOrd={root:1,bark:2,seed:3,resin:3,leaf:4,flower:5};
  const sorted=[...herbs].sort((a,b)=>(tOrd[a.type]||4)-(tOrd[b.type]||4));
  const tLbl={root:'raiz — infuse mais tempo',bark:'casca — resistente ao calor',seed:'semente',leaf:'folha — delicada',flower:'flor — adicionar por último'};
  document.getElementById('ctrRecipeBox').innerHTML=`
    <div class="ctr-recipe-total"><span>Total do blend</span><span>${Math.round(totalG)}g / 300ml · ${smartTime} min · ${tempLabel}</span></div>
    ${sorted.map((h,i)=>`<div class="ctr-recipe-row">
      <div class="ctr-recipe-order">${i+1}</div>
      <div style="flex:1"><div class="ctr-recipe-herb">${esc(h.n)} ${h.icon}</div><span class="ctr-recipe-herb-type">${esc(tLbl[h.type]||h.type)}</span></div>
      <div class="ctr-recipe-amount">${getQtyLabel(h.qty,h)}</div>
    </div>`).join('')}`;

  // Prep steps
  const hasRoots=herbs.some(h=>['root','bark'].includes(h.type));
  const hasFlowers=herbs.some(h=>h.type==='flower');
  const freq=herbs.some(h=>['Calmante','Sono'].includes(h.cat))?'1-2x ao dia, preferencialmente à noite':herbs.some(h=>h.cat==='Estimulante')?'1x pela manhã':'2-3x ao dia';
  const prepSteps=[
    `Ferva a água e deixe esfriar até ${tempLabel}.`,
    hasRoots?`Adicione primeiro as raízes/cascas: ${sorted.filter(h=>['root','bark'].includes(h.type)).map(h=>h.n).join(', ')}.`:'',
    `Adicione ${hasRoots?'em seguida ':''}as folhas/sementes${sorted.filter(h=>['leaf','seed'].includes(h.type)).length?': '+sorted.filter(h=>['leaf','seed'].includes(h.type)).map(h=>h.n).join(', '):'.'}.`,
    hasFlowers?`Adicione por último as flores: ${sorted.filter(h=>h.type==='flower').map(h=>h.n).join(', ')}.`:'',
    `Tampe e infuse por ${smartTime} min.`,
    `Coe e sirva morno. ${freq}.`,
  ].filter(Boolean);
  document.getElementById('ctrPrepBox').innerHTML=`
    <div class="ctr-prep-grid">
      <div class="ctr-prep-item"><div class="ctr-prep-val">${tempLabel}</div><div class="ctr-prep-key">Temperatura</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${smartTime} min</div><div class="ctr-prep-key">Infusão</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${Math.round(totalG)}g</div><div class="ctr-prep-key">Peso total</div></div>
      <div class="ctr-prep-item"><div class="ctr-prep-val">${freq.split(',')[0]}</div><div class="ctr-prep-key">Frequência</div></div>
    </div>
    <div class="ctr-prep-steps">${prepSteps.map((s,i)=>`<div class="ctr-prep-step"><div class="ctr-prep-step-num">${i+1}</div><div>${s}</div></div>`).join('')}</div>`;

  window._ctrComputed={smartTemp,smartTime,sorted,freq,herbs,totalG};
}

function startBlendTimer(){
  if(!ctrBlend.length){toast('Adicione pelo menos uma erva');return;}
  const c=window._ctrComputed; if(!c)return;
  const name=document.getElementById('ctrBlendName')?.value||'Meu Blend';
  const {smartTemp,smartTime,sorted,freq}=c;
  const tempLabel=smartTemp<=75?'~70°C':smartTemp<=82?'~80°C':smartTemp<=88?'~85°C':'~90°C';
  const tOrd={root:1,bark:2,seed:3,resin:3,leaf:4,flower:5};
  const groups=[];
  sorted.forEach(h=>{
    const last=groups[groups.length-1];
    if(last&&last.type===h.type)last.herbs.push(h);
    else groups.push({type:h.type,herbs:[h]});
  });
  const steps=[{title:'Aqueça a água',desc:`Ferva e deixe esfriar até ${tempLabel}. Separe todas as ${sorted.length} ervas e a infusora.`,duration:0}];
  const multiGroup=groups.length>1;
  if(multiGroup){
    const roots=groups.filter(g=>['root','bark'].includes(g.type));
    const mids=groups.filter(g=>['seed','leaf','resin'].includes(g.type));
    const flowers=groups.filter(g=>g.type==='flower');
    if(roots.length){
      const t=Math.round(smartTime*0.6);
      steps.push({title:`Adicione raízes: ${roots.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:roots.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n')+'.\nRaízes precisam de mais tempo para liberar os compostos.',duration:t*60});
    }
    if(mids.length){
      const t=Math.round(smartTime*(roots.length?0.35:0.8));
      steps.push({title:`Adicione: ${mids.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:mids.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n'),duration:t*60});
    }
    if(flowers.length){
      const t=Math.min(4,Math.round(smartTime*0.25));
      steps.push({title:`Adicione flores: ${flowers.flatMap(g=>g.herbs).map(h=>h.n).join(' + ')}`,desc:flowers.flatMap(g=>g.herbs).map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n')+'.\nFlores liberam rápido — apenas '+t+' min finais.',duration:t*60});
    }
  } else {
    steps.push({title:`Adicione todas as ervas`,desc:sorted.map(h=>`${h.icon} ${h.n}: ${getQtyLabel(h.qty,HERB_META[h.id]||{})}`).join('\n'),duration:smartTime*60});
  }
  steps.push({title:'Coe e sirva',desc:`Retire as ervas e coe.\n${freq}.`,duration:0});
  launchTimer(name,steps);
}

function saveBlendFromCtr(){
  if(!ctrBlend.length){toast('Adicione pelo menos uma erva');return;}
  const name=document.getElementById('ctrBlendName')?.value||'Blend sem nome';
  const ings=ctrBlend.map(b=>{const h=HERBS.find(x=>x.id===b.id);const m=HERB_META[b.id]||{};return{id:b.id,n:h.n,amount:getQtyLabel(b.qty,m)};});
  if(savedRecipes.find(r=>r.name===name)){toast('Já existe um blend com esse nome');return;}
  savedRecipes.unshift({name,tagline:`${ctrBlend.length} ervas · blend personalizado`,ingredients:ings,fromCtr:true});
  localStorage.setItem('erb_recipes',JSON.stringify(savedRecipes));
  if(typeof trackAction==='function') trackAction('save-blend');
  toast(`"${name}" salvo nos favoritos!`);
}

// ── override goPage to handle all pages ──
// Pages accessible without login
const PUBLIC_PAGES = ['search','ervatorio','ficha','blends','blend','sabores','guia-sensorial','roda','chazerias','ferramentas','ferramenta','familias','familia','quiz','chas','mundo','receitas','jogo','caminho'];

// Esconde a landing e expõe o container do app. Idempotente.
// Usado por goPage() e pelo hash handler para que deep links
// (#ervatorio, #ficha/:slug etc.) não fiquem cobertos pela landing.
function hideLanding(){
  var lp = document.getElementById('landingPage');
  var ac = document.getElementById('appContainer');
  if (lp) lp.style.display = 'none';
  if (ac) ac.style.display = 'block';
}

function goPage(id,btn,slug){
  // Cerimônia foi integrada em #page-chas — redireciona deep links antigos.
  if(id==='cerimonia') id='chas';
  // Criar Blend foi unificado em Blends com sub-abas (Prontos/Assistente/Manual).
  // Deep links antigos para 'criarblend' caem na aba Assistente.
  var _blendOpenTab = null;
  if(id==='criarblend'){ id='blends'; _blendOpenTab='assistente'; }
  // Gate: quem já entrou no app (login real OU "continuar sem login") pode
  // navegar livremente entre as páginas. Features que exigem conta real
  // (sync de favoritos, salvar blend no cloud, etc.) checam ervaria.user
  // individualmente dentro de cada renderizador.
  const baseId = id.split('/')[0];
  const hasEntered = (window.ervaria && ervaria.user)
                  || localStorage.getItem('erb_auth')
                  || localStorage.getItem('erb_entered');
  if(!PUBLIC_PAGES.includes(baseId) && !hasEntered){
    ervaria.showAuthModal();
    return;
  }
  hideLanding();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('on'));
  document.getElementById('page-'+id).classList.add('on');
  if(btn)btn.classList.add('on');
  if(id==='favs')renderFavs();
  if(id==='suppliers')renderSuppliers();
  if(id==='roda')window.initRoda();
  if(id==='perfil')renderPerfil();
  if(id==='blends'){
    // Inicializa todas as sub-abas (barato o bastante para rodar sempre)
    buildWizard();renderTray();
    // Default: abre na aba Prontos. Se viemos de 'criarblend' legado, abre em Assistente.
    if(typeof switchBlendTab==='function') switchBlendTab(_blendOpenTab || 'prontos');
  }
  if(id==='chas'){initChas();initCerimonia();}
  if(id==='guia-sensorial'&&typeof initFlavorWheel==='function')initFlavorWheel();
  if(id==='marketplace')initMkt();
  if(id==='mundo')initMundo();
  // Ervatorio v1.1 pages
  if(id==='ervatorio' && typeof renderIndiceCatalogo==='function') renderIndiceCatalogo();
  if(id==='ficha' && slug && typeof renderFichaPage==='function') renderFichaPage(slug);
  // NB: o render da biblioteca é disparado pela switchBlendTab('prontos') acima.
  if(id==='blend' && slug && typeof renderBlendPage==='function') renderBlendPage(slug);
  if(id==='roda-funcional' && typeof renderRodaFuncional==='function') renderRodaFuncional();
  if(id==='chazerias' && typeof initChazerias==='function') initChazerias();
  if(id==='ferramentas' && typeof initFerramentas==='function') initFerramentas();
  if(id==='ferramenta' && typeof initFerramentas==='function') initFerramentas(slug);
  if(id==='familias' && typeof initFamilias==='function') initFamilias();
  if(id==='familia' && slug && typeof initFamilia==='function') initFamilia(slug);
  if(id==='quiz' && typeof initQuiz==='function') initQuiz(slug);
  if(id==='receitas' && typeof initReceitas==='function'){ initReceitas(); if(typeof trackAction==='function') trackAction('visit-receitas'); }
  if(id==='caminho' && typeof initCaminho==='function') initCaminho();
  if(id==='jogo' && typeof initJogo==='function') initJogo();

  // i18n + SEO — update on every navigation
  window._currentPage = id;
  if(typeof applyI18n==='function') applyI18n();
  if(typeof updateSEO==='function') updateSEO(id);

  // Registra a navegação no histórico do browser para que o botão Voltar funcione.
  if(!window._goPageFromHistory){
    var newHash='#'+id+(slug?'/'+slug:'');
    if(window.location.hash!==newHash)
      history.pushState({page:id,slug:slug||null},''  ,newHash);
    else
      history.replaceState({page:id,slug:slug||null},'',newHash);
  }
}

// Hash route handler for parameterized Ervatorio v1.1 routes
(function(){
  // Inclui as rotas SPA novas: ferramentas, ferramenta/<slug>, familias, familia/<slug>,
  // chazerias, quiz, quiz/resultado/<slug>
  var SPA_ROUTE_RE = /^#(ficha|blend|ervatorio|blends|roda-funcional|ferramentas|ferramenta|familias|familia|chazerias|quiz|chas|mundo|receitas|jogo)(\/.+)?$/;
  function handleHash(){
    var hash = window.location.hash || '';
    if(SPA_ROUTE_RE.test(hash)) hideLanding();
    var m;
    if((m = hash.match(/^#ficha\/([a-z0-9-]+)$/))) {
      goPage('ficha', null, m[1]);
    } else if((m = hash.match(/^#blend\/([a-z0-9-]+)$/))) {
      goPage('blend', null, m[1]);
    } else if((m = hash.match(/^#ferramenta\/([a-z0-9-]+)$/))) {
      goPage('ferramenta', null, m[1]);
    } else if((m = hash.match(/^#familia\/([a-z0-9-]+)$/))) {
      goPage('familia', null, m[1]);
    } else if((m = hash.match(/^#quiz\/(.+)$/))) {
      goPage('quiz', null, m[1]);
    } else if(hash === '#ervatorio') {
      goPage('ervatorio');
    } else if(hash === '#blends') {
      goPage('blends');
    } else if(hash === '#roda-funcional') {
      goPage('roda-funcional');
    } else if(hash === '#ferramentas') {
      goPage('ferramentas');
    } else if(hash === '#familias') {
      goPage('familias');
    } else if(hash === '#chazerias') {
      goPage('chazerias');
    } else if(hash === '#quiz') {
      goPage('quiz');
    }
  }
  window.addEventListener('hashchange', handleHash);
  // Handle initial load with hash
  if(window.location.hash && SPA_ROUTE_RE.test(window.location.hash)){
    hideLanding();
    setTimeout(handleHash, 300);
  }
})();

// Botão Voltar/Avançar do browser
window.addEventListener('popstate', function(e){
  var state=e.state;
  if(state&&state.page){
    window._goPageFromHistory=true;
    try{ goPage(state.page, null, state.slug||undefined); }
    finally{ window._goPageFromHistory=false; }
  } else {
    // Sem estado — voltou para antes da primeira navegação no app:
    // mostra a landing page novamente.
    var lp=document.getElementById('landingPage');
    var ac=document.getElementById('appContainer');
    if(lp) lp.style.display='';
    if(ac) ac.style.display='none';
  }
});

function switchBlendTab(tab){
  const pronto=document.getElementById('blendPanelPronto');
  const assist=document.getElementById('blendPanelAssist');
  const manual=document.getElementById('blendPanelManual');
  const tabP=document.getElementById('blendTabPronto');
  const tabA=document.getElementById('blendTabAssist');
  const tabM=document.getElementById('blendTabManual');
  // Default safe defaults when algum elemento não existe (ex.: renderização parcial).
  [pronto,assist,manual].forEach(el=>{ if(el) el.style.display='none'; });
  [tabP,tabA,tabM].forEach(el=>{ if(el) el.classList.remove('on'); });
  if(tab==='prontos'){
    if(pronto) pronto.style.display='';
    if(tabP) tabP.classList.add('on');
    if(typeof renderBibliotecaBlends==='function') renderBibliotecaBlends();
  } else if(tab==='manual'){
    if(manual) manual.style.display='';
    if(tabM) tabM.classList.add('on');
    buildCtrFilters();renderCtrHerbs();renderCtrBlend();
  } else {
    // assistente (default)
    if(assist) assist.style.display='';
    if(tabA) tabA.classList.add('on');
  }
}

// ════════════════════════════════════════
// ── CHÁS TRADICIONAIS ──
// ════════════════════════════════════�����══
const CHAS_DATA = [
  {
    id:'branco', name:'Chá Branco', emoji:'🤍', img:'images/chas/branco.png', tagline:'O mais sutil — antioxidante puro', oxidation:5,
    color:'#e8dcc8', textColor:'#3a2a1a', textColorLight:'#3a2a1a', bgColor:'rgba(232,220,200,.12)',
    tagline:'O mais puro e delicado — colhido antes do despertar',
    latin:'Camellia sinensis — brotos jovens, pré-floração',
    sabores:['Mel suave','Floral','Melão','Fruta fresca','Levemente adocicado'],
    temp:'65-75°C', tempo:'2-4 min', dose:'2-3 col. sopa / 200ml', cafeina:'Baixo (15-30mg)',
    beneficios:['Rico em catequinas antioxidantes','Maior concentração de EGCG entre os chás','Anti-aging celular','Leve termogênico','Proteção cardiovascular'],
    historia:[
      {year:'618 d.C.', text:'Originário da Dinastia Tang, na China. Oferecido como tributo ao imperador, representava pureza e status imperial.'},
      {year:'960 d.C.', text:'Na Dinastia Song tornou-se ápice da cultura do chá. A cerimônia Gongfu foi desenvolvida para honrar sua delicadeza.'},
      {year:'Século XIX', text:'Chegou à Europa através da Rota da Seda. Considerado mais valioso que o ouro em alguns mercados.'},
      {year:'Hoje', text:'Fujian (China) e Darjeeling (Índia) produzem os mais apreciados. Bai Hao Yinzhen ("Agulha de Prata") é o mais nobre.'},
    ],
    preparo:['Aqueça a água até 65-70°C. Nunca água fervendo — destrói os compostos delicados.','Use 2-3 colheres de sopa cheias para 200ml.','Infuse por 2-3 minutos. Pode reutilizar as folhas até 3 vezes.','Sirva sem leite ou açúcar — a sutileza é sua essência.','A segunda infusão é frequentemente a melhor.'],
    curiosidades:'As folhas do chá branco são cobertas por finos pelos brancos (Bai Hao). Esses pelos são proteção natural contra insetos — e concentram polifenóis. É o único chá que pode ser infusionado com água fria (cold brew 8h).',
    regioes:['Fujian, China (Bai Hao Yinzhen, Bai Mudan)','Darjeeling, Índia','Sri Lanka','Nepal'],
    variedades:[
      {n:'Bai Hao Yinzhen',emoji:'🥇',orig:'Fujian, China',d:'Agulha de Prata — o mais nobre. Apenas brotos cobertos de finos pelos brancos.'},
      {n:'Bai Mudan',emoji:'🌸',orig:'Fujian, China',d:'Peônia Branca — broto + duas folhas jovens. Mais corpo que o Yinzhen.'},
      {n:'Shou Mei',emoji:'🍂',orig:'Fujian, China',d:'Sobrancelha Longeva — folhas maduras. Sabor mais encorpado e adocicado.'},
      {n:'Ceylon White',emoji:'🇱🇰',orig:'Sri Lanka',d:'Silver Tips do Sri Lanka. Mais acessível, notas de mel e baunilha.'},
    ],
    harmonizacao:['Frutos do mar delicados','Sushi e sashimi','Queijo ricota ou brie','Frutas tropicais frescas','Mousse de baunilha','Macaron de flores'],
    momento:'Tarde — silêncio e contemplação depois do almoço',
  },
  {
    id:'verde', name:'Chá Verde', emoji:'🍃', img:'images/chas/verde.png', tagline:'Energia limpa e foco natural', oxidation:10,
    color:'#4a7a3a', textColor:'#e8f5e0', textColorLight:'#1a4a1a', bgColor:'rgba(74,122,58,.15)',
    tagline:'O guardião da saúde — dois mil anos de sabedoria',
    latin:'Camellia sinensis — folhas fixadas rapidamente ao calor',
    sabores:['Gramíneo','Vegetal','Algas marinhas','Castanho suave','Erva fresca'],
    temp:'70-80°C', tempo:'2-3 min', dose:'1-2 col. sopa / 200ml', cafeina:'Médio (25-50mg)',
    beneficios:['EGCG: antioxidante mais estudado do mundo','L-teanina: foco calmo sem ansiedade','Termogênico — aumenta queima de gordura','Neuroprotetor a longo prazo','Reduz risco cardiovascular'],
    historia:[
      {year:'2737 a.C.', text:'Lenda: o imperador Shennong descobriu o chá quando folhas caíram em sua água quente. Reconheceu suas propriedades medicinais.'},
      {year:'618 d.C.', text:'Lu Yu escreveu o Chajing (Clássico do Chá) — primeiro livro dedicado à arte do chá. Fundação da cultura do chá verde japonês.'},
      {year:'1191 d.C.', text:'O monge Eisai levou o chá verde para o Japão. Origem do matcha e da cerimônia japonesa (Chanoyu).'},
      {year:'Século XX', text:'Estudos científicos confirmam os benefícios do EGCG. Japão exporta Gyokuro, Sencha, Matcha para o mundo.'},
    ],
    preparo:['Água a 75-80°C. Para Gyokuro premium, use 60°C.','1 colher de sopa por 200ml. Para matcha: 1 col. chá em pó.','Infuse por 2-3 minutos. Evite mais — fica amargo.','Para matcha: bata em Z com o chasen até espumar.','Pode infusionar 2-3 vezes. A segunda é mais suave.'],
    curiosidades:'O Japão produz mais de 80 estilos diferentes de chá verde. Matcha é pó de folhas inteiras — você ingere toda a folha. Gyokuro é cultivado à sombra nas últimas semanas, concentrando L-teanina e tornando o sabor mais doce.',
    regioes:['Uji, Japão (Matcha, Gyokuro)','Shizuoka, Japão (Sencha)','Fujian, China (Dragonwell/Longjing)','Zhejiang, China','Darjeeling, Índia'],
    variedades:[
      {n:'Matcha',emoji:'🍵',orig:'Uji, Kyoto',d:'Tencha moída em pedra. Você ingere a folha inteira. 137× mais EGCG que Sencha.'},
      {n:'Gyokuro',emoji:'👑',orig:'Uji, Kyoto',d:'20 dias à sombra antes da colheita. Umami intenso. O mais premium japonês.'},
      {n:'Sencha',emoji:'🌿',orig:'Shizuoka',d:'O cotidiano japonês. 80% da produção. Vegetal, limpo, gramíneo.'},
      {n:'Hojicha',emoji:'🍂',orig:'Kyoto',d:'Sencha torrado. Caramelo, nozes. Quase sem cafeína — perfeito à noite.'},
      {n:'Longjing',emoji:'🐉',orig:'Zhejiang, China',d:'Dragon Well — folhas planas salteadas em wok. Castanha tostada, suave.'},
      {n:'Genmaicha',emoji:'🌾',orig:'Japão',d:'Sencha com arroz tostado. Notas de pipoca. Acessível e extremamente saboroso.'},
    ],
    harmonizacao:['Sushi e temaki','Edamame e gyoza','Queijo de cabra fresco','Torrada com azeite','Sorvete de matcha','Wagashi japonês'],
    momento:'Manhã — foco sem ansiedade; ou antes de meditação',
  },
  {
    id:'amarelo', name:'Chá Amarelo', emoji:'💛', img:'images/chas/amarelo.png', tagline:'O raro tesouro imperial da China', oxidation:15,
    color:'#a87a2a', textColor:'#fff8e0', textColorLight:'#5a3a0a', bgColor:'rgba(168,122,42,.12)',
    tagline:'O raro tesouro — o segredo mais guardado da China',
    latin:'Camellia sinensis — smothering lento, oxidação controlada',
    sabores:['Mel suave','Milho','Floral discreto','Amendoado','Mais suave que o verde'],
    temp:'70-80°C', tempo:'2-3 min', dose:'2 col. sopa / 200ml', cafeina:'Médio (20-40mg)',
    beneficios:['Mais fácil para estômagos sensíveis que o chá verde','Rico em antioxidantes','Processo único de "fechamento" reduz amargor','Melhora digestão','Propriedades anti-inflamatórias'],
    historia:[
      {year:'Dinastia Tang', text:'Reservado exclusivamente para o imperador e sua corte. Produção era segredo de Estado, punível com morte divulgar.'},
      {year:'Século XVIII', text:'Algumas regiões abandonaram a produção. O conhecimento do processo quase se perdeu completamente.'},
      {year:'Século XX', text:'Produção quase extinta. Apenas 3 estilos sobrevivem: Junshan Yinzhen, Meng Ding Huangya e Huo Shan Huangya.'},
      {year:'Hoje', text:'Um dos chás mais raros e caros do mundo. Produção anual de alguns estilos não ultrapassa 500kg.'},
    ],
    preparo:['Água a 75°C — mais delicado que o verde.','2 colheres de sopa para 200ml.','Infuse por 2-3 minutos. As folhas podem ser reinfusionadas.','O processo de men huan (abafamento) lhe dá cor amarelada única.','Aprecie a diferença sutil em relação ao chá verde.'],
    curiosidades:'O processo smothering (Men Huan) envolve embrulhar as folhas ainda quentes para iniciar leve oxidação controlada. Isso remove o sabor gramíneo e cria o perfil único. Junshan Yinzhen é cultivado apenas na Ilha Junshan, no Lago Dongting.',
    regioes:['Ilha Junshan, Hunan (Junshan Yinzhen)','Sichuan (Meng Ding Huangya)','Anhui (Huo Shan Huangya)'],
    variedades:[
      {n:'Junshan Yinzhen',emoji:'🥇',orig:'Ilha Junshan, Hunan',d:'O mais nobre. < 500kg/ano. Só na Ilha Junshan no Lago Dongting. Imperial.'},
      {n:'Meng Ding Huangya',emoji:'⛰',orig:'Monte Meng, Sichuan',d:'Segunda variedade. Amendoado, mel suave. Cultivado acima de 1000m.'},
      {n:'Huo Shan Huangya',emoji:'🌿',orig:'Anhui',d:'A mais acessível. Sabor entre verde e branco, toques adocicados.'},
    ],
    harmonizacao:['Peixe branco grelhado','Frango suave no vapor','Legumes salteados','Tofu sedoso','Sobremesas de limão ou mel'],
    momento:'Meio-dia — apreciação lenta, contemplativa',
  },
  {
    id:'oolong', name:'Chá Oolong', emoji:'🔵', img:'images/chas/oolong.png', tagline:'Complexidade entre o verde e o preto', oxidation:50,
    color:'#2d5a7a', textColor:'#e0f0ff', textColorLight:'#1a3a5a', bgColor:'rgba(45,90,122,.15)',
    tagline:'O chá azul — entre dois mundos, com a melhor de cada',
    latin:'Camellia sinensis — oxidação parcial 15-85%',
    sabores:['Floral intenso','Pêssego','Mel de flores','Frutado suave','Torrado suave (oxidado)'],
    temp:'85-95°C', tempo:'3-5 min', dose:'1 col. sopa / 200ml', cafeina:'Médio-alto (30-50mg)',
    beneficios:['Equilibra benefícios do verde e do preto','Controle glicêmico — estudado para diabetes','Termogênico eficaz','Saúde óssea','Reduz triglicerídeos'],
    historia:[
      {year:'Século XVII', text:'Originário de Fujian. O nome "oolong" (dragão negro) vem de uma lenda: um catador viu uma cobra e fugiu. Ao voltar, as folhas já tinham oxidado parcialmente — e o resultado era sublime.'},
      {year:'Século XVIII', text:'Taiwan começa a cultivar oolong trazido de Fujian. A ilha torna-se célebre pelo High Mountain Oolong.'},
      {year:'Século XIX', text:'Chás oolong de Formosa (Taiwan) tornaram-se os mais apreciados da Europa e América.'},
      {year:'Hoje', text:'Taiwan produz os mais renomados: Ali Shan, Li Shan, Da Yu Ling. Fujian é famoso pelo Tie Guan Yin e Da Hong Pao.'},
    ],
    preparo:['Água a 90-95°C para oolongs oxidados; 85°C para os florais.','1 colher de sopa rasa por 200ml.','Primeira infusão: 3-4 min. Oolongs de qualidade suportam 5-7 infusões.','No estilo Gongfu: copos pequenos, infusões rápidas (30s-2min) revelam perfis diferentes.','Observe a evolução do sabor a cada infusão.'],
    curiosidades:'Um oolong de alta qualidade (como Da Yu Ling, a 2600m de altitude) pode custar R$800-2000 por 100g. Cada infusão revela notas diferentes — a 3ª e 4ª são frequentemente as mais complexas. O grau de oxidação define tudo: 15% = quase verde; 85% = quase preto.',
    regioes:['Alishan e Li Shan, Taiwan (High Mountain)','Wuyi, Fujian, China (Da Hong Pao, Shui Xian)','Anxi, Fujian (Tie Guan Yin)','Darjeeling, Índia'],
    variedades:[
      {n:'Tie Guan Yin',emoji:'🙏',orig:'Anxi, Fujian',d:'Deusa da Misericórdia. Floral, orquídea, cremoso. O oolong mais icônico do mundo.'},
      {n:'Da Hong Pao',emoji:'🏔',orig:'Wuyi, Fujian',d:'Manto Vermelho. Das arbustos mais famosos do mundo. Rochoso, mineral, torrado.'},
      {n:'Ali Shan',emoji:'⛰',orig:'Ali Shan (1400m), Taiwan',d:'High Mountain. Cremoso, manteigoso, floral. Revela-se em 5-7 infusões.'},
      {n:'Oriental Beauty',emoji:'����',orig:'Hsinchu, Taiwan',d:'Picadas de cigarrinhas criam terpenos únicos. Mel, pêssego, moscatel.'},
      {n:'Dan Cong',emoji:'🎵',orig:'Fenghuang, Guangdong',d:'Oolong Fênix. Dezenas de cultivares nomeados por aromas (lichia, gengibre).'},
    ],
    harmonizacao:['Carnes grelhadas e dim sum','Queijo meia-cura','Frutas frescas e secas','Chocolate amargo 70%','Castanhas e nozes','Macarons florais'],
    momento:'Tarde — ritual contemplativo, múltiplas infusões',
  },
  {
    id:'preto', name:'Chá Preto', emoji:'🖤', img:'images/chas/preto.png', tagline:'Corpo, presença e energia duradoura', oxidation:100,
    color:'#3a1a0a', textColor:'#f5d8c0', textColorLight:'#3a1a0a', bgColor:'rgba(58,26,10,.2)',
    tagline:'O favorito do mundo — força, profundidade, história',
    latin:'Camellia sinensis — oxidação total, sabor robusto',
    sabores:['Malte','Caramelo','Terra','Chocolate amargo','Tanino marcante','Notas de frutas secas'],
    temp:'90-100°C', tempo:'3-5 min', dose:'1-2 col. sopa / 250ml', cafeina:'Alto (40-70mg)',
    beneficios:['Estimulante natural — mais cafeína que o verde','L-teanina presente (menor que verde)','Saúde intestinal — prebiótico','Reduz LDL colesterol','Antioxidantes theaflavinas'],
    historia:[
      {year:'Século XVII', text:'Criado como chá para exportação — resistia melhor às longas viagens marítimas. A oxidação total preservava o chá por meses.'},
      {year:'1823', text:'Robert Bruce descobre o chá Assam na Índia — plantas nativas diferentes das chinesas. Início da produção colonial britânica.'},
      {year:'1869', text:'Fungo destrói plantações de café no Sri Lanka. Os ingleses substituem por chá — criando o famoso Ceylon Tea.'},
      {year:'Hoje', text:'O chá mais consumido no mundo. Assam, Darjeeling e Ceylon definem o mercado global. Base do Chai indiano e do English Breakfast.'},
    ],
    preparo:['Água a 95-100°C — o único chá que suporta água fervendo.','1-2 colheres de sopa por 250ml.','Infuse por 3-5 minutos. Além disso fica amargo.','Com leite: adicione o leite antes da água (tradição britânica).','Com especiarias (Masala Chai): gengibre, canela, cardamomo, cravo.'],
    curiosidades:'Darjeeling First Flush (colheita de março-abril) é o "Champagne dos chás" — tem certificação geográfica. Assam é base do famoso English Breakfast. Pu-erh não é exatamente preto — tem sua própria categoria. O chá com leite foi introduzido para proteger porcelanas finas do choque térmico.',
    regioes:['Assam, Índia (forte, maltado)','Darjeeling, Índia (floral, Champagne dos chás)','Sri Lanka / Ceylon','Keemun, China (fumado, notas de vinho)','Nilgiri, Índia'],
    variedades:[
      {n:'Darjeeling First Flush',emoji:'🏔',orig:'Darjeeling (800-2200m)',d:'Champagne dos chás. Colheita março-abril. Floral, muscatel, leve.'},
      {n:'Assam CTC',emoji:'💪',orig:'Vale do Assam',d:'Forte, maltado, encorpado. Base do English Breakfast. Rei dos saquinhos globais.'},
      {n:'Lapsang Souchong',emoji:'🔥',orig:'Wuyi, Fujian',d:'Defumado com pinheiro. O chá mais polarizador — ama-se ou odeia-se.'},
      {n:'Ceylon UVA',emoji:'🇱🇰',orig:'Uva Province, Sri Lanka',d:'Aromático, mentolado, adstringente limpo. Ideal com leite ou puro.'},
      {n:'Keemun',emoji:'🍷',orig:'Anhui, China',d:'Notas de vinho tinto e chocolate. Base do English Breakfast original.'},
    ],
    harmonizacao:['Scones com creme e geleia','Bolo de chocolate','Queijo cheddar e gouda','Ovos mexidos no café da manhã','Carnes assadas','Biscoito de gengibre'],
    momento:'Manhã — despertar e energia; com leite é o breakfast perfeito',
  },
  {
    id:'puerh', name:'Chá Escuro (Pu-erh)', emoji:'🟤', img:'images/chas/puerh.png', tagline:'O vinho dos chás — fermentado único', oxidation:100,
    color:'#2a1a0a', textColor:'#e8d0b0', textColorLight:'#2a1a0a', bgColor:'rgba(42,26,10,.2)',
    tagline:'O chá que envelhece como vinho — fermentado, profundo, raro',
    latin:'Camellia sinensis — fermentação microbiana pós-colheita',
    sabores:['Terra molhada','Cogumelo','Madeira','Couro envelhecido','Tabaco suave','Compostagem mineral'],
    temp:'95-100°C', tempo:'3-5 min', dose:'5-8g / 150ml', cafeina:'Médio-alto (30-60mg)',
    beneficios:['Único chá com probióticos vivos (fermentado)','Mais estudado para redução de colesterol','Digestivo poderoso — usado após refeições gordurosas','Saúde hepática','Emagrecimento — estudos em animais promissores'],
    historia:[
      {year:'618 d.C.', text:'Yunnan (China) — tributo ao imperador Tang. A longa viagem pela Rota do Chá-Cavalos transformava naturalmente as folhas por fermentação.'},
      {year:'Século XVII', text:'Comerciantes tibetanos e mongóis trocavam cavalos por tijolos de Pu-erh. A rota Tea Horse Road estendia-se por 2700km.'},
      {year:'1973', text:'Criação do Shu Pu-erh (fermentação acelerada) na fábrica Kunming. Permite produzir em meses o que levaria décadas naturalmente.'},
      {year:'Anos 2000', text:'Pu-erh vintage torna-se investimento. Um bolo (357g) de 1950 pode valer mais de R$500.000. Mercado de especulação em Hong Kong.'},
    ],
    preparo:['Despeje água quente sobre as folhas e jogue fora (lavagem). Pu-erh precisa de rinse.','Água a 95-100°C. 5-8g por 150ml (mais denso que outros chás).','Primeira infusão: 30s. Infusões seguintes: aumente 10s cada vez.','Pode render 10-20 infusões de qualidade.','Armazenado corretamente, melhora por décadas.'],
    curiosidades:'Pu-erh Sheng (cru) envelhece como vinho — ganha complexidade com o tempo. Pu-erh Shu (maduro) tem fermentação acelerada de 45-60 dias em pilhas úmidas. Os microrganismos responsáveis incluem Aspergillus niger. Um bolo vintage de boa procedência é investimento comparável a vinhos de Bordeaux.',
    regioes:['Xishuangbanna, Yunnan (antigos bosques)','Menghai, Yunnan (fábricas tradicionais)','Yiwu, Yunnan (Pu-erh premium)','Jingmai, Yunnan (árvores centenárias)'],
    variedades:[
      {n:'Sheng Pu-erh',emoji:'🌱',orig:'Yunnan',d:'Pu-erh cru. Envelhece décadas. Sabor evolui de vegetal/amargo para doce complexo.'},
      {n:'Shu Pu-erh',emoji:'🍂',orig:'Yunnan',d:'Pu-erh maduro. Fermentação acelerada 45-60 dias. Pronto para beber imediatamente.'},
      {n:'Bingcha (Bolo)',emoji:'💿',orig:'Yunnan',d:'Pu-erh prensado em disco (357g). Clássico. Quanto mais antigo, mais valioso.'},
      {n:'Gushu (Árvore Antiga)',emoji:'🌳',orig:'Yunnan',d:'De árvores centenárias ou milenares. Sabor mais complexo e duradouro.'},
    ],
    harmonizacao:['Carnes gordurosas — churrasco, pato confitado','Queijo azul ou curado','Chocolate amargo 85%+','Dim sum e dumplings','Cogumelos salteados','Sobremesas de caramelo escuro'],
    momento:'Após refeições — digestivo poderoso; ou ritual matinal profundo',
  },
];

let chaActiveId='verde';

function initChas(){
  const intro=document.getElementById('chaFamilyIntro');
  intro.innerHTML=`<strong style="color:var(--gold2);font-family:'Cormorant Garamond',serif;font-size:1rem">Camellia sinensis</strong> — uma única planta, seis universos distintos. O que diferencia cada chá não é a espécie, mas o processo: quanto tempo as folhas oxidam após a colheita. Este processo transforma compostos, sabores, aromas e benefícios completamente. Cada família é um mundo a descobrir.`;
  buildChaTabs();
  renderChaDetail(chaActiveId);
}

function buildChaTabs(){
  const el=document.getElementById('chaTabs'); if(!el)return;
  el.innerHTML='';
  CHAS_DATA.forEach(c=>{
    const b=document.createElement('button');
    b.className='cha-tab'+(chaActiveId===c.id?' on':'');
    b.style.color=chaActiveId===c.id?c.color:'';
    b.style.borderColor=chaActiveId===c.id?c.color:'';
    b.innerHTML=`${c.emoji} ${c.name}`;
    b.onclick=()=>{chaActiveId=c.id;buildChaTabs();renderChaDetail(c.id);};
    el.appendChild(b);
  });
}

function renderChaDetail(id){
  const c=CHAS_DATA.find(x=>x.id===id); if(!c)return;
  if(typeof trackAction==='function') trackAction('view-cha', id);
  const el=document.getElementById('chaDetail'); if(!el)return;
  const isLight=document.body.classList.contains('light');
  const txtColor=isLight?(c.textColorLight||c.color):c.textColor;
  el.innerHTML=`
    <div class="cha-header" style="background:${c.bgColor};border:0.5px solid ${c.color}44;color:${txtColor}">
      ${c.img?`<div class="cha-header-img"><img src="${c.img}" alt="${c.name}" loading="lazy" onerror="this.parentNode.style.display='none'"></div>`:''}
      <div style="font-size:2.5rem;margin-bottom:.5rem">${c.emoji}</div>
      <div class="cha-header-name" style="color:${c.color}">${c.name}</div>
      <div class="cha-header-latin">${c.latin}</div>
      <div class="cha-header-tagline">${c.tagline}</div>
      <div class="cha-oxidation-bar">
        <span class="cha-oxidation-label">Oxidação 0%</span>
        <div class="cha-oxidation-track"><div class="cha-oxidation-fill" style="width:${c.oxidation}%;background:${c.color}"></div></div>
        <span class="cha-oxidation-label">${c.oxidation}%</span>
      </div>
    </div>

    <div class="cha-grid">
      <div class="cha-card">
        <div class="cha-card-label">Perfil de sabor</div>
        <div class="cha-flavor-wheel">${c.sabores.map(s=>`<span class="cha-flavor-tag">${s}</span>`).join('')}</div>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Preparo ideal</div>
        <table class="cha-compare-table">
          <tr><td style="color:var(--muted)">Temperatura</td><td><strong>${c.temp}</strong></td></tr>
          <tr><td style="color:var(--muted)">Tempo</td><td><strong>${c.tempo}</strong></td></tr>
          <tr><td style="color:var(--muted)">Dose</td><td><strong>${c.dose}</strong></td></tr>
          <tr><td style="color:var(--muted)">Cafeína</td><td><strong>${c.cafeina}</strong></td></tr>
        </table>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Benefícios</div>
        <div class="cha-card-content">${c.beneficios.map(b=>`<div style="display:flex;gap:6px;margin-bottom:.3rem"><span style="color:${c.color||'var(--gold)'};flex-shrink:0">✦</span><span>${b}</span></div>`).join('')}</div>
      </div>
      <div class="cha-card">
        <div class="cha-card-label">Regiões produtoras</div>
        <div class="cha-card-content">${c.regioes.map(r=>`<div style="padding:3px 0;border-bottom:0.5px solid rgba(255,255,255,.04)">${r}</div>`).join('')}</div>
      </div>
    </div>

    ${c.variedades?`
    <div class="cha-section-label">Variedades Notáveis</div>
    <div class="cha-variedades-grid">
      ${c.variedades.map(v=>`<div class="cha-var-card" style="border-top:2px solid ${c.color||'var(--gold)'}">
        <div class="cha-var-emoji">${v.emoji}</div>
        <div class="cha-var-name">${v.n}</div>
        <div class="cha-var-orig" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('pin')} ${esc(v.orig)}</div>
        <div class="cha-var-desc">${v.d}</div>
      </div>`).join('')}
    </div>`:''}

    ${c.harmonizacao?`
    <div class="cha-section-label">Harmonização</div>
    <div class="cha-harmonizacao-row">
      ${c.harmonizacao.map(h=>`<span class="cha-harm-tag">${h}</span>`).join('')}
    </div>`:''}

    ${c.momento?`
    <div class="cha-momento-block" style="border-left:3px solid ${c.color||'var(--gold)'}">
      <span class="cha-momento-label">Melhor momento</span>
      <span class="cha-momento-val">${c.momento}</span>
    </div>`:''}

    <div class="cha-section-label">Como preparar</div>
    <div class="cha-prep-steps" style="margin-bottom:1.5rem">
      ${c.preparo.map((s,i)=>`<div class="cha-prep-step">
        <div class="cha-prep-num" style="background:${c.color||'var(--gold)'}22;border:0.5px solid ${c.color||'var(--gold)'}44;color:${c.color||'var(--gold)'}">${i+1}</div>
        <div class="cha-prep-text">${s}</div>
      </div>`).join('')}
    </div>

    <div class="cha-section-label">História & Origem</div>
    ${c.historia.map(h=>`<div class="cha-history-block" style="border-left-color:${c.color||'var(--gold)'}"><div class="cha-history-year">${h.year}</div>${h.text}</div>`).join('')}

    <div class="cha-section-label" style="margin-top:.75rem">Curiosidades</div>
    <div style="background:var(--bg3);border:0.5px solid var(--faint);border-radius:var(--r-lg);padding:1rem 1.25rem;font-size:.82rem;color:var(--cream2);line-height:1.7;font-style:italic">"${c.curiosidades}"</div>

    <div style="display:flex;gap:8px;margin-top:1.25rem">
      <button class="roda-start-btn" onclick="openTimerCha('${c.id}')">⏱ Preparar ${c.name} agora</button>
    </div>`;
}

function openTimerCha(id){
  const c=CHAS_DATA.find(x=>x.id===id); if(!c)return;
  const steps=[
    {title:'Aqueça a água',desc:`Para ${c.name}: ${c.temp}. Use termômetro para precisão — a temperatura é crucial.`,duration:0},
    {title:'Prepare o recipiente',desc:`Aqueça a xícara ou bule com um pouco de água quente e descarte. Isso mantém a temperatura estável durante a infusão.`,duration:0},
    {title:'Meça as folhas',desc:`Use ${c.dose}. Para ${c.name}, a proporção é fundamental para equilibrar sabor e suavidade.`,duration:0},
    {title:'Infusão',desc:`Despeje a água sobre as folhas. ${c.name}: ${c.tempo} de infusão. Cubra para preservar aromas.`,duration:parseInt(c.tempo)*60},
    {title:'Sirva e aproveite',desc:`Coe com cuidado. ${c.name} pode ser reinfusionado — segunda e terceira infusões revelam perfis diferentes.`,duration:0},
  ];
  launchTimer(c.name,steps);
}

// ════════════════════════════════════════
// ── CERIMÔNIA DO CHÁ ──
// ════════════════════════════════════════
const CER_TABS_DATA = [
  {id:'oque', label:'O que é'},
  {id:'tipos', label:'Tipos de Cerimônia'},
  {id:'utensílios', label:'Utensílios'},
  {id:'como', label:'Como Fazer'},
  {id:'onde', label:'Onde Participar'},
];
let cerActiveTab='oque';

function initCerimonia(){
  buildCerTabs();
  renderCerContent(cerActiveTab);
}

function buildCerTabs(){
  const el=document.getElementById('cerTabs'); if(!el)return;
  el.innerHTML='';
  CER_TABS_DATA.forEach(t=>{
    const b=document.createElement('button');
    b.className='cer-tab'+(cerActiveTab===t.id?' on':'');
    b.textContent=t.label;
    b.onclick=()=>{cerActiveTab=t.id;buildCerTabs();renderCerContent(t.id);};
    el.appendChild(b);
  });
}

function renderCerContent(tab){
  const el=document.getElementById('cerContent'); if(!el)return;
  if(tab==='oque') el.innerHTML=`
    <div class="cer-intro">"A cerimônia do chá não é sobre o chá. É sobre tudo o que acontece quando você para — o silêncio, a presença, a beleza do efêmero."</div>
    <div class="cer-section">
      <div class="cer-section-title">O que é a cerimônia do chá</div>
      <div class="cer-item"><div class="cer-item-name">Chanoyu — Japão</div><div class="cer-item-desc">A "Via do Chá" japonesa. Baseada nos princípios do Zen budismo: Wa (harmonia), Kei (respeito), Sei (pureza) e Jaku (tranquilidade). Sen Rikyū codificou seus princípios no século XVI. Não é apenas preparar chá — é uma forma de meditação ativa.</div></div>
      <div class="cer-item"><div class="cer-item-name">Gongfu Cha — China</div><div class="cer-item-desc">A "Arte de Fazer Chá com Habilidade". Múltiplas infusões rápidas em bule pequeno (Yixing). Cada infusão revela uma faceta diferente do chá. Popular em Fujian, Guangdong e Taiwan. Filosofia Taoísta de harmonizar com a natureza.</div></div>
      <div class="cer-item"><div class="cer-item-name">Cha Dao — Filosofia do Chá</div><div class="cer-item-desc">Além de qualquer cerimônia específica — o "caminho do chá" como prática de vida. Cada xícara como oportunidade de presença plena. Cultivada por mestres como Lu Yu (China, século VIII) e Sen Rikyū (Japão, século XVI).</div></div>
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Os quatro princípios universais</div>
      ${[{n:'Harmonia (Wa/He)',t:'Sintonia entre as pessoas, o ambiente e o chá. O espaço, os gestos e os objetos devem criar um todo coerente.'},{n:'Respeito (Kei/Jing)',t:'Consideração profunda por cada pessoa presente, pelos objetos usados e pelo próprio chá.'},{n:'Pureza (Sei/Jie)',t:'Do espaço, dos utensílios, da mente. A limpeza é ritual — e vai além do físico.'},{n:'Tranquilidade (Jaku/Jing)',t:'O estado de paz interior que emerge quando os outros três princípios estão presentes.'}].map(p=>`<div class="cer-item"><div class="cer-item-name">${p.n}</div><div class="cer-item-desc">${p.t}</div></div>`).join('')}
    </div>`;

  else if(tab==='tipos') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Cerimônias japonesas</div>
      ${[{n:'Chaji — Cerimônia completa',d:'4-5 horas. Inclui refeição Kaiseki, matcha denso (koicha) e leve (usucha). Acontece no chashitsu (casa do chá). A forma mais formal e completa.',det:'Exige preparo intenso. Geralmente realizada para 4-5 convidados especiais.'},{n:'Chakai — Reunião casual',d:'1-2 horas. Mais simples, sem refeição completa. Wagashi (doces japoneses) antes do matcha. A forma mais acessível para iniciantes.',det:'Perfeita para primeiro contato com a cerimônia.'},{n:'Ro e Furo — sazonais',d:'Ro (braseiro interior, novembro-abril) e Furo (fogão portátil, maio-outubro). A cerimônia muda completamente com as estações — utensílios, gestos e estética.',det:'Cada estação tem seu próprio vocabulário estético.'}].map(c=>`<div class="cer-item"><div class="cer-item-name">${c.n}</div><div class="cer-item-desc">${c.d}</div><div class="cer-item-detail">${c.det}</div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Cerimônias chinesas</div>
      ${[{n:'Gongfu Cha — Arte da habilidade',d:'Bule Yixing pequeno (100-150ml), múltiplas infusões curtas (20-40 segundos). Cada infusão é uma revelação diferente do mesmo chá. Ideal para oolongs, Pu-erh e chás premium.',det:'O bule Yixing absorve o sabor do chá ao longo dos anos — nunca lavar com detergente.'},{n:'Grandma Style — o cotidiano',d:'Folhas diretamente na xícara, adicionar água quente quando necessário. O jeito mais simples e praticado diariamente na China. Filosofia: o chá deve ser acessível a todos.',det:'Perfeito para chás verdes e oolongs leves do dia a dia.'},{n:'Cerimônia do Pu-erh',d:'Rinse inicial obrigatório. Bule ou gaiwan. Água fervendo (100°C). As primeiras infusões são rápidas (10-30s), depois aumentam gradualmente. Um bolo de Pu-erh vintage pode render 20+ infusões.',det:'Cada infusão revela um perfil diferente. A 7ª ou 8ª frequentemente é considerada a melhor.'}].map(c=>`<div class="cer-item"><div class="cer-item-name">${c.n}</div><div class="cer-item-desc">${c.d}</div><div class="cer-item-detail">${c.det}</div></div>`).join('')}
    </div>`;

  else if(tab==='utensílios') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Utensílios japoneses (Chanoyu)</div>
      ${[{n:'Chawan — Tigela de matcha',d:'O coração da cerimônia. Feita à mão por ceramistas. Formato assimétrico intencional — a imperfeição é beleza (Wabi-sabi). Aquecida antes do uso.',det:'Preço: R$150 (artesanal) a R$50.000+ (obra assinada)'},{n:'Chasen — Batedor de bambu',d:'80-120 fios de bambu finamente cortados. Bate o matcha em Z até formar espuma. Cada um tem vida útil de 3-6 meses.',det:'Origem: Nara. Família Takayama produz há 500 anos ininterruptamente.'},{n:'Chashaku — Colher de bambu',d:'Medida tradicional: 2 medidas rasas por tigela. Feita de bambu ou marfim (antigas). Carregada por cada mestre como objeto pessoal.',det:'Um chashaku autografado por um mestre pode valer milhares.'},{n:'Chakin — Pano branco',d:'Dobrado precisamente, usado para secar a tigela. A dobra específica é ensinada como técnica separada.',det:'Linho ou algodão branco imaculado.'},{n:'Fukusa — Seda para purificação',d:'Seda colorida para ritual de limpeza dos utensílios. A dobra e o gesto de limpeza são gestos meditativos centrais da cerimônia.',det:'Cor da seda indica escola e gênero do praticante.'}].map(u=>`<div class="cer-item"><div class="cer-item-name">${u.n}</div><div class="cer-item-desc">${u.d}</div><div class="cer-item-detail">${u.det}</div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Utensílios chineses (Gongfu Cha)</div>
      ${[{n:'Bule Yixing — Argila roxa',d:'Argila Zisha de Yixing. Porosa: absorve sabor do chá ao longo dos anos. Um bule bem curado é passado de geração em geração.',det:'Nunca usar com diferentes tipos de chá. Nunca lavar com sabão.'},{n:'Gaiwan — Tigela com tampa',d:'Porcelana com tigela, tampa e pires. Versátil — funciona como bule e xícara. Permite ver as folhas abrirem.',det:'A tampa serve de filtro e permite observar a infusão.'},{n:'Cha Hai — Jarro',d:'Recebe o chá do bule antes de servir. Uniformiza a concentração. Permite avaliar a cor e limpidez.',det:'Também chamado "pitcher" do chá.'},{n:'Xícaras de cheiro e sabor',d:'Par de xícaras: a alta, estreita (para cheirar) e a baixa, aberta (para beber). A transição do aroma para o sabor é uma experiência em si.',det:'Típica da cerimônia de oolong.'},{n:'Tabuleiro de chá',d:'Captura o excesso de água. Bambu, madeira ou pedra. O derramamento intencional é parte da cerimônia — o tabuleiro "bebe" junto com os convidados.',det:'Símbolo de generosidade e abundância.'}].map(u=>`<div class="cer-item"><div class="cer-item-name">${u.n}</div><div class="cer-item-desc">${u.d}</div><div class="cer-item-detail">${u.det}</div></div>`).join('')}
    </div>`;

  else if(tab==='como') el.innerHTML=`
    <div class="cer-intro">"Cada gesto na cerimônia existe por uma razão. Aprenda os gestos e você aprenderá a razão deles."</div>
    <div class="cer-section">
      <div class="cer-section-title">Chanoyu simplificado — passo a passo</div>
      ${[
        {t:'Prepare o espaço',d:'Limpe com atenção. Um vaso com flor simples (chabana). Rolo caligrafia ou pintura (kakemono). Incenso suave aceso antes dos convidados chegarem. O espaço comunica antes do chá.'},
        {t:'Purifique os utensílios',d:'Com o fukusa (seda), limpe o chashaku e a borda da caixinha de matcha. Gesto lento, intencional. "Purifica" o objeto e a mente simultaneamente. É meditação ativa.'},
        {t:'Aqueça a tigela',d:'Despeje água quente no chawan. Aguarde 30 segundos. Descarte. Seque com o chakin dobrado com o padrão correto. A tigela aquecida mantém o matcha na temperatura ideal.'},
        {t:'Prepare o matcha',d:'2 medidas de chashaku de matcha peneirado. 70-80ml de água a 75-80°C. Bata em Z (não em círculos) com o chasen até formar espuma homogênea. O matcha está pronto quando a espuma é cremosa.'},
        {t:'Sirva com presença',d:'Coloque a tigela com a frente (parte mais bela) virada para o convidado. O convidado gira a tigela 90° antes de beber — para não deixar marcas no lado mais bonito. Aprecia a aparência antes de beber.'},
        {t:'Limpe e encerre',d:'Limpe todos os utensílios com calma. O fechamento da cerimônia é tão importante quanto a abertura. Guardar com cuidado é parte do respeito pela próxima vez.'},
      ].map((s,i)=>`<div class="cer-step"><div class="cer-step-num">${i+1}</div><div class="cer-step-content"><div class="cer-step-title">${s.t}</div><div class="cer-step-text">${s.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Gongfu Cha — guia prático</div>
      ${[
        {t:'Prepare o tabuleiro',d:'Coloque bule Yixing, Cha Hai, xícaras e tabuleiro. Ferva a água. O ritual começa com os objetos dispostos com intenção.'},
        {t:'Desperte o bule',d:'Despeje água fervendo sobre o bule e xícaras por fora. Aquece e "desperta" o bule. Descarte a água no tabuleiro.'},
        {t:'Lave o chá (rinse)',d:'Coloque o chá no bule. Despeje água quente rapidamente e descarte. Abre as folhas e remove poeiras. Especialmente importante para Pu-erh.'},
        {t:'Primeiras infusões',d:'Oolongs: 30-45 segundos. Pu-erh Sheng: 15-20s. A cada infusão, aumente 10-15 segundos. Despeje no Cha Hai, distribua uniformemente nas xícaras.'},
        {t:'Aprecie a evolução',d:'Cada infusão é diferente. Observe a cor, o aroma, a textura. Algumas das melhores notas surgem na 4ª ou 5ª infusão. O chá conta sua história ao longo do tempo.'},
      ].map((s,i)=>`<div class="cer-step"><div class="cer-step-num">${i+1}</div><div class="cer-step-content"><div class="cer-step-title">${s.t}</div><div class="cer-step-text">${s.d}</div></div></div>`).join('')}
    </div>`;

  else if(tab==='onde') el.innerHTML=`
    <div class="cer-section">
      <div class="cer-section-title">Casas de chá e cerimônias no Brasil</div>
      ${[
        {icon:'🏮',n:'Museu do Imigrante — São Paulo',loc:'Mooca, São Paulo',d:'Cerimônias japonesas mensais organizadas pela comunidade nipo-brasileira. Inclui degustação e explicação histórica. Uma das mais autênticas fora do Japão.'},
        {icon:'🍵',n:'Liberdade Tea Houses',loc:'Liberdade, São Paulo',d:'Bairro japonês de SP concentra diversas casas de chá autênticas. Algumas realizam cerimônias Gongfu Cha com mestres de Fujian e Taiwan.'},
        {icon:'🌿',n:'Chá Verde Studio',loc:'Jardins, São Paulo',d:'Espaço dedicado à cultura do chá. Cursos de cerimônia japonesa e chinesa. Degustações mensais com chás de origem verificada.'},
        {icon:'🏔',n:'Comunidade Japonesa de Registro',loc:'Vale do Ribeira, São Paulo',d:'Maior comunidade japonesa rural do Brasil. Realizações de Chaji completo em datas especiais. Contato direto com a tradição viva.'},
        {icon:'🎋',n:'Instituto Brasil-Japão',loc:'Várias cidades',d:'Programação cultural regular inclui demonstrações de Chanoyu. Contato via site do Instituto.'},
      ].map(p=>`<div class="cer-place-card"><div class="cer-place-icon">${p.icon}</div><div><div class="cer-place-name">${p.n}</div><div class="cer-place-loc">${p.loc}</div><div class="cer-place-desc">${p.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Experiências internacionais</div>
      ${[
        {icon:'🗾',n:'Urasenke — Kyoto, Japão',loc:'Kyoto, Japão',d:'Uma das três principais escolas de Chanoyu. Aceita visitantes para demonstrações. O lugar mais autêntico para vivenciar a cerimônia em seu contexto original.'},
        {icon:'🏯',n:'Kenroku-en Garden — Kanazawa',loc:'Kanazawa, Japão',d:'Um dos três mais belos jardins japoneses. Casa de chá tradicional dentro do jardim. Demonstrações regulares em inglês e japonês.'},
        {icon:'🐉',n:'Wuyishan Tea Villages — Fujian',loc:'Fujian, China',d:'Berço do oolong. Visitas às plantações e cerimônias Gongfu Cha com os próprios produtores. Experiência imersiva de 2-5 dias.'},
        {icon:'☁️',n:'Ali Shan Tea Houses — Taiwan',loc:'Alishan, Taiwan',d:'A 2200m de altitude, casas de chá servem High Mountain Oolongs colhidos localmente. Uma das experiências de chá mais especiais do mundo.'},
        {icon:'🏔',n:'Darjeeling Tea Estates — Índia',loc:'Darjeeling, Índia',d:'Fazendas históricas como Makaibari e Margaret Hope recebem visitantes. Tour completo da colheita ao processamento, com degustação.'},
      ].map(p=>`<div class="cer-place-card"><div class="cer-place-icon">${p.icon}</div><div><div class="cer-place-name">${p.n}</div><div class="cer-place-loc">${p.loc}</div><div class="cer-place-desc">${p.d}</div></div></div>`).join('')}
    </div>
    <div class="cer-section">
      <div class="cer-section-title">Como começar em casa</div>
      <div class="cer-item"><div class="cer-item-name">Kit mínimo para iniciar</div><div class="cer-item-desc">Chawan (tigela) · Chasen (batedor) · Matcha de qualidade · Água filtrada · Intenção de estar presente. Isso é suficiente. A cerimônia não exige riqueza — exige atenção.</div></div>
      <div class="cer-item"><div class="cer-item-name">Livros recomendados</div><div class="cer-item-desc">"O Livro do Chá" — Kakuzo Okakura (1906, clássico essencial) · "The Way of Tea" — Aaron Fisher · "Tea Horse Road" — Jeff Fuchs · "The Story of Tea" — Mary Lou Heiss</div></div>
    </div>`;
}

// ════════════════════════════════════════
// ── MARKETPLACE ──
// ════════════════════════════════════════
const MKT_PRODUCTS = [
  // Infusões premium
  {id:101,cat:'Infusões',type:'Chá Tradicional',name:'Gyokuro Uji Premium',seller:'TeaImport',icon:'🍵',price:189.90,unit:'30g',desc:'Chá verde japonês cultivado à sombra. Sabor umami intenso, baixo amargor. Colheita First Flush 2024.',badge:'new',stock:'in'},
  {id:102,cat:'Infusões',type:'Chá Tradicional',name:'Ali Shan Oolong High Mountain',seller:'TeaImport',icon:'☁️',price:245.00,unit:'50g',desc:'Cultivado a 2200m. Floral e cremoso. Um dos oolongs mais apreciados do mundo.',badge:'',stock:'in'},
  {id:103,cat:'Infusões',type:'Chá Tradicional',name:'Bai Hao Yinzhen — Agulha de Prata',seller:'TeaImport',icon:'🤍',price:320.00,unit:'25g',desc:'Chá branco mais nobre. Brotos cobertos por pelos brancos. Fujian, China.',badge:'',stock:'in'},
  {id:104,cat:'Infusões',type:'Pu-erh',name:'Menghai Pu-erh Sheng 2018',seller:'TeaImport',icon:'🟤',price:185.00,unit:'100g',desc:'Pu-erh cru com 6 anos de envelhecimento. Terroso, mineral, complexo. Melhor com o tempo.',badge:'',stock:'in'},
  {id:105,cat:'Infusões',type:'Blend Artesanal',name:'Blend Noite Serena',seller:'Ervas & Raízes',icon:'🌙',price:45.90,unit:'60g',desc:'Camomila + Maracujá + Melissa + Alfazema. Blend para sono profundo e noites tranquilas.',badge:'eco',stock:'in'},
  {id:106,cat:'Infusões',type:'Blend Artesanal',name:'Masala Chai Original',seller:'Verde Vivo',icon:'🌶',price:38.90,unit:'80g',desc:'Chá preto Assam + gengibre + cardamomo + canela + cravo + pimenta. Receita indiana tradicional.',badge:'',stock:'in'},
  {id:107,cat:'Infusões',type:'Blend Artesanal',name:'Blend Imunidade Verde',seller:'Ervas & Raízes',icon:'🛡',price:52.00,unit:'70g',desc:'Equinácea + Cúrcuma + Gengibre + Tomilho. Fortalecedor de defesas para o inverno.',badge:'eco',stock:'in'},
  {id:108,cat:'Infusões',type:'Herbal',name:'Rooibos Baunilha & Laranja',seller:'TeaImport',icon:'🍊',price:42.00,unit:'80g',desc:'Rooibos orgânico da África do Sul com baunilha natural e raspas de laranja. Sem cafeína.',badge:'',stock:'in'},

  // Equipamentos
  {id:201,cat:'Equipamentos',type:'Bule',name:'Bule Yixing Zisha Autêntico',seller:'TeaImport',icon:'🫖',price:485.00,unit:'150ml',desc:'Argila Zisha genuína de Yixing. Artesanal. Poroso: absorve o sabor e melhora com o uso. Ideal para oolongs.',badge:'',stock:'in'},
  {id:202,cat:'Equipamentos',type:'Bule',name:'Tetsubin Japonês — Ferro Fundido',seller:'TeaImport',icon:'🔵',price:680.00,unit:'600ml',desc:'Bule de ferro fundido japonês. Mantém temperatura por horas. Não enferrujar em uso regular.',badge:'',stock:'in'},
  {id:203,cat:'Equipamentos',type:'Matcha',name:'Kit Matcha Completo',seller:'TeaImport',icon:'🍵',price:220.00,unit:'kit',desc:'Chawan (tigela), Chasen (batedor 80 fios), Chashaku (colher) e suporte. Tudo para iniciar o ritual.',badge:'new',stock:'in'},
  {id:204,cat:'Equipamentos',type:'Infusor',name:'Infusor Gooseneck Elétrico',seller:'PhytoFarm',icon:'⚡',price:340.00,unit:'1L',desc:'Controle de temperatura preciso (60-100°C). Pescoço de cisne para fluxo suave. Essencial para chás premium.',badge:'',stock:'in'},
  {id:205,cat:'Equipamentos',type:'Acessório',name:'Tabuleiro de Bambu Gongfu',seller:'TeaImport',icon:'🎋',price:175.00,unit:'35x20cm',desc:'Tabuleiro de bambu com reservatório integrado. Inclui 4 xícaras de argilite. Cerimônia completa.',badge:'',stock:'in'},
  {id:206,cat:'Equipamentos',type:'Armazenamento',name:'Lata Washi Paper — set 3',seller:'Ervas & Raízes',icon:'📦',price:95.00,unit:'set 3 latas',desc:'Latas vedadas com papel washi japonês. Protegem da luz e umidade. Capacidade 50-100g cada.',badge:'',stock:'in'},
  {id:207,cat:'Equipamentos',type:'Termômetro',name:'Termômetro Digital para Chá',seller:'PhytoFarm',icon:'🌡',price:85.00,unit:'1 unid',desc:'Leitura instantânea. Essencial para chás brancos e verdes que exigem temperatura precisa.',badge:'',stock:'in'},
  {id:208,cat:'Equipamentos',type:'Balança',name:'Balança de Precisão 0.1g',seller:'PhytoFarm',icon:'⚖️',price:120.00,unit:'1 unid',desc:'Precisão de 0.1g. Para dosagem exata — especialmente para Pu-erh e matcha.',badge:'',stock:'in'},

  // Vivências
  {id:301,cat:'Vivências',type:'Workshop',name:'Cerimônia Chanoyu — São Paulo',seller:'Instituto Brasil-Japão',icon:'🎋',price:180.00,unit:'por pessoa',desc:'Workshop de 3h com mestre certificado. Inclui degustação de matcha e wagashi. Turmas de 8 pessoas.',badge:'exp',stock:'in'},
  {id:302,cat:'Vivências',type:'Curso',name:'Gongfu Cha — 4 aulas',seller:'Chá Verde Studio',icon:'🐉',price:420.00,unit:'4 sessões',desc:'Aprenda a cerimônia chinesa do zero. Inclui bule Gaiwan para praticar em casa. Certificado de conclusão.',badge:'exp',stock:'in'},
  {id:303,cat:'Vivências',type:'Degustação',name:'Oolong Journey — Degustação',seller:'TeaImport',icon:'☁️',price:150.00,unit:'por pessoa',desc:'Degustação guiada de 6 oolongs de Taiwan e Fujian. Do mais leve ao mais torrado. 2 horas.',badge:'new',stock:'in'},
  {id:304,cat:'Vivências',type:'Degustação',name:'Pu-erh Vertical Tasting',seller:'TeaImport',icon:'🟤',price:280.00,unit:'por pessoa',desc:'Degustação vertical de Pu-erh de 2015 a 2005. Aprenda a perceber o envelhecimento. Para entusiastas.',badge:'exp',stock:'in'},
  {id:305,cat:'Vivências',type:'Retiro',name:'Retiro do Chá — Serra da Cantareira',seller:'Chá Verde Studio',icon:'🌿',price:890.00,unit:'fim de semana',desc:'Retiro de 2 dias em sítio. Cerimônia ao amanhecer, blending, meditação com chá. 12 participantes máx.',badge:'exp',stock:'in'},

  // Viagens
  {id:401,cat:'Viagens',type:'Tour Tea',name:'Japão — Rota do Chá Kyoto-Uji',seller:'Tea Travels',icon:'🗾',price:12500.00,unit:'7 dias/pessoa',desc:'Visita às plantações de Uji, cerimônia Urasenke, mercado Nishiki, chashitsu histórico. Guia especializado.',badge:'exp',stock:'in'},
  {id:402,cat:'Viagens',type:'Tour Tea',name:'Taiwan — High Mountain Oolongs',seller:'Tea Travels',icon:'🏔',price:8900.00,unit:'5 dias/pessoa',desc:'Ali Shan, Li Shan, Pinglin. Visitas a produtores independentes. Degustação de altitude. 8 pessoas máx.',badge:'exp',stock:'in'},
  {id:403,cat:'Viagens',type:'Tour Tea',name:'Darjeeling — Colheita First Flush',seller:'Tea Travels',icon:'🌱',price:9800.00,unit:'6 dias/pessoa',desc:'Participação na colheita em fazenda histórica. Processamento artesanal. Degustação de 15 lotes diferentes.',badge:'new',stock:'in'},
  {id:404,cat:'Viagens',type:'Tour Tea',name:'Yunnan — Rota do Pu-erh',seller:'Tea Travels',icon:'🐉',price:11200.00,unit:'8 dias/pessoa',desc:'Xishuangbanna, árvores centenárias, produtores tradicionais, aldeias Dai. A rota mais completa para o Pu-erh.',badge:'exp',stock:'in'},
  {id:405,cat:'Viagens',type:'Tour Tea',name:'Fujian — Oolongs e Wuyishan',seller:'Tea Travels',icon:'⛰',price:9200.00,unit:'6 dias/pessoa',desc:'Anxi (Tie Guan Yin), Wuyi (Da Hong Pao), Fujian coastline. Inclui visita a fábrica artesanal centenária.',badge:'',stock:'in'},

  // Ervas & Acessórios (loja Ervatório — fornecedores cadastrados)
  {id:501,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Camomila Orgânica',seller:'Ervas & Raízes',icon:'🌼',price:12.90,unit:'50g',desc:'Flores de camomila orgânicas, colhidas e secas artesanalmente. Calmante suave para o dia a dia.',badge:'eco',stock:'in',supId:1},
  {id:502,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Melissa Premium',seller:'Ervas & Raízes',icon:'🍃',price:14.50,unit:'30g',desc:'Melissa (erva-cidreira) selecionada. Notas cítricas e suaves, ideal para relaxamento.',badge:'',stock:'in',supId:1},
  {id:503,cat:'Ervas & Acessórios',type:'Blend Artesanal',name:'Blend Serenidade',seller:'Ervas & Raízes',icon:'💜',price:28.90,unit:'60g',desc:'Mix artesanal de camomila, lavanda e melissa. Companhia perfeita para o fim do dia.',badge:'',stock:'in',supId:1},
  {id:504,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Boldo do Chile',seller:'Casa das Plantas',icon:'🍃',price:8.90,unit:'50g',desc:'Boldo chileno tradicional. Digestivo clássico, amargo característico.',badge:'',stock:'in',supId:2},
  {id:505,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Guaco 100% Natural',seller:'Casa das Plantas',icon:'🌿',price:11.90,unit:'40g',desc:'Guaco natural, tradicionalmente usado em infusões para o sistema respiratório.',badge:'',stock:'low',supId:2},
  {id:506,cat:'Ervas & Acessórios',type:'Extrato',name:'Ginkgo Biloba Extrato',seller:'Phytofarm Brasil',icon:'🍃',price:34.90,unit:'30g',desc:'Extrato padronizado de Ginkgo Biloba. Memória, circulação e foco.',badge:'',stock:'in',supId:3},
  {id:507,cat:'Ervas & Acessórios',type:'Pó',name:'Ashwagandha Raiz Pó',seller:'Phytofarm Brasil',icon:'🌿',price:42.90,unit:'100g',desc:'Raiz de Ashwagandha em pó. Adaptógeno ayurvédico tradicional para estresse e energia.',badge:'',stock:'in',supId:3},
  {id:508,cat:'Ervas & Acessórios',type:'Folhas Secas',name:'Valeriana Orgânica',seller:'Phytofarm Brasil',icon:'🌸',price:18.90,unit:'30g',desc:'Raiz de valeriana orgânica. Auxilia no relaxamento e sono profundo.',badge:'eco',stock:'in',supId:3},
  {id:509,cat:'Ervas & Acessórios',type:'Blend Artesanal',name:'Cúrcuma + Pimenta',seller:'Verde Vivo',icon:'🫚',price:22.90,unit:'80g',desc:'Blend de cúrcuma com pimenta-preta para potencializar a absorção de curcumina. Anti-inflamatório.',badge:'',stock:'in',supId:4},
  {id:510,cat:'Ervas & Acessórios',type:'Especiaria',name:'Gengibre Desidratado',seller:'Verde Vivo',icon:'🫚',price:16.90,unit:'100g',desc:'Gengibre desidratado em pedaços. Aquecedor, digestivo, ideal para chás de inverno.',badge:'',stock:'in',supId:4},
  {id:511,cat:'Ervas & Acessórios',type:'Flores',name:'Hibisco Flores Secas',seller:'Verde Vivo',icon:'🌺',price:13.90,unit:'40g',desc:'Flores de hibisco secas. Infusão rubi, notas cítricas, termogênico natural.',badge:'',stock:'in',supId:4},
  {id:512,cat:'Ervas & Acessórios',type:'Chá Tradicional',name:'Chá Verde Sencha',seller:'TeaImport',icon:'🍵',price:38.90,unit:'50g',desc:'Sencha japonês de qualidade diária. Verde vivo, notas herbáceas e levemente vegetais.',badge:'',stock:'in',supId:6},
  {id:513,cat:'Ervas & Acessórios',type:'Herbal',name:'Rooibos Orgânico',seller:'TeaImport',icon:'🍃',price:29.90,unit:'80g',desc:'Rooibos orgânico da África do Sul. Sem cafeína, doce natural, bom a qualquer hora.',badge:'eco',stock:'in',supId:6},
  {id:514,cat:'Ervas & Acessórios',type:'Chá Tradicional',name:'Hibisco Azul',seller:'TeaImport',icon:'💙',price:45.90,unit:'30g',desc:'Butterfly Pea. Muda de cor com limão, rico em antioxidantes. Efeito visual incrível.',badge:'new',stock:'low',supId:6},
  {id:515,cat:'Ervas & Acessórios',type:'Kit',name:'Kit Blend Digestivo',seller:'Verde Vivo',icon:'🌿',price:54.90,unit:'kit 3 ervas',desc:'Trio de ervas digestivas selecionadas: hortelã-pimenta, erva-doce e gengibre.',badge:'',stock:'in',supId:4},
  {id:516,cat:'Ervas & Acessórios',type:'Acessório',name:'Infusor Aço Inox',seller:'Ervas & Raízes',icon:'🫖',price:24.90,unit:'1 unid',desc:'Infusor de aço inox com tampa. Ideal para ervas soltas em xícara ou bule.',badge:'',stock:'in',supId:1},
];

let mktCatActive='Todos', mktSearchVal='';
const MKT_CATS=[{id:'Todos',icon:'✦'},{id:'Ervas & Acessórios',icon:'🌿'},{id:'Infusões',icon:'🍵'},{id:'Equipamentos',icon:'🫖'},{id:'Vivências',icon:'🎋'},{id:'Viagens',icon:'✈️'}];

function initMkt(){
  const catsEl=document.getElementById('mktCats'); if(!catsEl)return;
  catsEl.innerHTML='';
  MKT_CATS.forEach(c=>{
    const b=document.createElement('button');
    b.className='mkt-cat'+(mktCatActive===c.id?' on':'');
    b.innerHTML=`${c.icon} ${c.id}`;
    b.onclick=()=>{mktCatActive=c.id;initMkt();};
    catsEl.appendChild(b);
  });
  renderMkt();
  const mktC=document.getElementById('mktCartCount');
  if(mktC){const total=cart.reduce((s,c)=>s+c.qty,0); mktC.textContent=total?`(${total})`:'';};
}

// Onda 6.1 (backlog #3): produtos is_test ficam fora da vitrine
// pública e do fluxo de compra. Para enxergá-los em staging/QA,
// ligue SHOW_TEST_PRODUCTS:true em js/config.js.
function mktIsVisible(p){
  // Indicação só aparece com o interruptor ligado. Falha para escondido: sem a
  // resposta do banco, `ERV_INTERRUPTORES.indicacao` é undefined e o card não
  // entra — a rota de redirecionamento recusaria o clique de qualquer forma, e
  // um card que não leva a lugar nenhum é pior do que card nenhum.
  if(mktEhIndicacao(p) && window.ERV_INTERRUPTORES?.indicacao !== true) return false;
  return !p.is_test || window.ERVATORIO_CONFIG?.SHOW_TEST_PRODUCTS === true;
}

// ── Indicação: o parceiro vende, nós encaminhamos ──────────────────────
//
// A regra de negócio inteira cabe em três funções, e o que ela decide é o que
// o visitante vê. Quem RECUSA a compra é a `create-order` — isto aqui é UX, e
// a distinção importa porque o carrinho mora no localStorage e é editável.

function mktEhIndicacao(p){
  return p && p.modo_de_venda === 'indicacao';
}

/**
 * O link do card passa pela nossa rota, com o **id do produto**.
 *
 * Nunca a URL do parceiro na query: isso faria um redirecionador aberto, um
 * link que começa no nosso domínio e termina onde o atacante quiser. E nunca o
 * `href` direto para o parceiro, porque aí não há o que medir — e sem medida a
 * comissão vira negociação sobre memória.
 */
function mktLinkDeIndicacao(p){
  const base=window.ERVATORIO_CONFIG?.FUNCTIONS_URL;
  if(!base||!p.dbId)return '';
  return `${base}/indicacao?produto=${encodeURIComponent(p.dbId)}`;
}

/**
 * Por que o card de indicação NÃO mostra preço.
 *
 * Não é economia de espaço: o contrato do Amazon Associates proíbe exibir
 * preço que não venha da API deles em tempo real, e o mesmo vale, com outras
 * palavras, nos programas do Mercado Livre. Preço guardado no nosso banco
 * envelhece — e um preço errado na vitrine é, além de quebra de contrato, a
 * reclamação mais previsível que existe: a pessoa clica esperando um valor e
 * encontra outro.
 *
 * O dia em que houver integração com a API de preço deles, isto muda. Até lá,
 * a ausência é a informação honesta.
 */
function mktRotuloDeIndicacao(p){
  return `Vendido por ${esc(p.parceiro||p.seller||'parceiro')}`;
}

// ── Onda 7 (backlog #45, #48, #52): escassez, ficha e relacionados ──
function mktStockBadge(p){
  if(p.stock==='out')return '<span class="mkt-badge" style="background:rgba(220,90,90,.15);color:#e08080;border:1px solid rgba(220,90,90,.35);margin-left:6px">Esgotado</span>';
  if(p.stock==='low')return '<span class="mkt-badge" style="background:rgba(212,168,90,.15);color:#d4a85a;border:1px solid rgba(212,168,90,.35);margin-left:6px">⚡ Últimas unidades</span>';
  return '';
}

// Link produto → ficha E-E-A-T correspondente (reverso da Onda 6.2).
function mktFichaSlug(p){
  if(typeof FICHAS_ANCORA==='undefined')return null;
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const alvo=norm(p.name);
  for(const [slug,f] of Object.entries(FICHAS_ANCORA)){
    const fn=norm(f.nome_popular);
    if(fn===alvo||alvo.indexOf(fn+' ')===0||fn.indexOf(alvo+' ')===0)return slug;
  }
  return null;
}
function mktFichaLink(p){
  const slug=mktFichaSlug(p);
  if(!slug)return '';
  return `<a href="#ficha/${slug}" onclick="document.getElementById('mktDetailOverlay')?.remove()" style="display:inline-block;font-size:.75rem;color:var(--gold2);text-decoration:underline;margin-bottom:1rem">📖 Ver ficha completa — ciência, preparo e contraindicações</a>`;
}

// "Você também pode gostar": mesma categoria, curadoria simples.
function mktRelatedHtml(p){
  if(typeof MKT_PRODUCTS==='undefined')return '';
  const rel=MKT_PRODUCTS.filter(x=>x.id!==p.id&&mktIsVisible(x)&&x.cat===p.cat).slice(0,4);
  if(!rel.length)return '';
  return `<div style="border-top:0.5px solid var(--faint);margin-top:1.25rem;padding-top:1rem">
    <div style="font-family:'Jost',sans-serif;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:.6rem">Você também pode gostar</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${rel.map(x=>
      `<button onclick="openMktDetail(${x.id})" style="background:rgba(255,255,255,.04);border:0.5px solid var(--faint);border-radius:10px;padding:8px 12px;color:var(--cream2);font-size:.75rem;font-family:'Jost',sans-serif;cursor:pointer;text-align:left">
        ${x.icon} ${esc(x.name)}<br><span style="color:var(--gold2)">R$ ${Number(x.price).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
      </button>`).join('')}</div>
  </div>`;
}

function renderMkt(){
  const q=(document.getElementById('mktSearch')?.value||'').toLowerCase();
  const grid=document.getElementById('mktGrid'); if(!grid)return;
  let list=MKT_PRODUCTS.filter(p=>{
    if(!mktIsVisible(p))return false;
    if(mktCatActive!=='Todos'&&p.cat!==mktCatActive)return false;
    if(q&&!(p.name+p.desc+p.seller+p.type).toLowerCase().includes(q))return false;
    return true;
  });

  // Group by type within category
  if(mktCatActive==='Todos'){
    const groups={};
    list.forEach(p=>{if(!groups[p.cat])groups[p.cat]=[];groups[p.cat].push(p);});
    grid.innerHTML=Object.entries(groups).map(([cat,items])=>`
      <div class="mkt-section-title">${MKT_CATS.find(c=>c.id===cat)?.icon||'✦'} ${cat}</div>
      <div class="mkt-grid">${items.slice(0,4).map(p=>mktCard(p)).join('')}</div>`).join('');
  } else {
    grid.innerHTML=`<div class="mkt-grid">${list.map(p=>mktCard(p)).join('')}</div>`;
  }
}

function mktCard(p){
  const inCart=cart.some(c=>c.id===p.id);
  const typeColor=p.cat==='Infusões'?'#4a8a5a':p.cat==='Equipamentos'?'#4a6a9a':p.cat==='Vivências'?'#9a6a3a':p.cat==='Ervas & Acessórios'?'#5a8a3a':'#6a4a9a';
  const badgeHtml=p.badge==='new'?'<span class="mkt-badge mkt-badge-new">Novo</span>':p.badge==='exp'?'<span class="mkt-badge mkt-badge-exp">Experiência</span>':p.badge==='eco'?'<span class="mkt-badge mkt-badge-eco">Orgânico</span>':'';
  const testBadge=p.is_test?'<span class="mkt-badge" style="background:rgba(100,100,200,.15);color:#a0a8e0;border:1px solid rgba(100,100,200,.3)">TESTE</span>':'';
  const imgs=p.images&&p.images.length?p.images:[];
  // onerror robusto: o responsive-img embrulha o <img> em <picture>, então
  // localizamos o emoji de fallback pelo container .mkt-card-media.
  const onErr="var m=this.closest('.mkt-card-media');this.style.display='none';var e=m&&m.querySelector('[data-emoji]');if(e)e.style.display='flex'";
  const emojiSpan=`<span data-emoji style="font-size:2.8rem;display:none;align-items:center;justify-content:center;width:100%;height:100%" aria-hidden="true">${p.icon}</span>`;
  let mediaHtml;
  if(imgs[0]){
    // Imagens explícitas (produtos cadastrados via admin/Supabase).
    mediaHtml=`<img src="${imgs[0]}" data-img-idx="0" data-pid="${p.id}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="${onErr}">${emojiSpan}`;
  } else {
    // Produtos-semente: imagem editorial por convenção (images/marketplace/<id>.png),
    // upgradada para WebP responsivo pelo responsive-img.js; emoji como fallback.
    const key='images/marketplace/'+p.id+'.png';
    mediaHtml=`<img data-responsive="${key}" data-pid="${p.id}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="${onErr}">${emojiSpan}`;
  }
  const dots=imgs.length>1?`<div class="mkt-img-dots">${imgs.map((_,i)=>`<span class="mkt-img-dot${i===0?' on':''}" data-i="${i}"></span>`).join('')}</div>`:'';
  return `<div class="mkt-card">
    <div class="mkt-card-media" style="background:${typeColor}18;position:relative;cursor:${imgs.length>1?'pointer':'default'}" onclick="cycleCardImg(this,${p.id})">${mediaHtml}${dots}</div>
    <div class="mkt-card-body" style="cursor:pointer" onclick="openMktDetail(${p.id})">
      <div class="mkt-card-type" style="color:${typeColor}">${p.type} ${badgeHtml} ${testBadge}</div>
      <div class="mkt-card-name">${p.name}</div>
      <div class="mkt-card-seller">${p.seller}</div>
      <div class="mkt-card-desc">${p.desc.substring(0,90)}${p.desc.length>90?'...':''}</div>
      <div class="mkt-card-footer">${mktCardFooter(p,inCart)}</div>
    </div>
  </div>`;
}

/**
 * O rodapé do card muda inteiro na indicação: sai preço, sai carrinho, entra o
 * destino. É deliberado que as duas formas não se pareçam — o visitante precisa
 * saber ANTES de clicar que vai sair do nosso site, e um botão idêntico ao de
 * comprar prometeria o contrário.
 *
 * `rel="sponsored nofollow noopener"`: `sponsored` porque é link remunerado e
 * omitir isso é o que o Google chama de esquema de links; `noopener` porque
 * `target=_blank` sem ele entrega ao destino um `window.opener` que consegue
 * trocar a nossa aba de endereço.
 */
function mktCardFooter(p,inCart){
  if(mktEhIndicacao(p)){
    const href=mktLinkDeIndicacao(p);
    if(!href)return `<div class="mkt-card-price-sub">Indisponível no momento</div>`;
    return `<div style="min-width:0">
        <div class="mkt-card-price-sub">${mktRotuloDeIndicacao(p)}</div>
      </div>
      <a class="mkt-add-btn" href="${href}" target="_blank" rel="sponsored nofollow noopener"
         onclick="event.stopPropagation()"
         style="text-decoration:none;display:inline-flex;align-items:center;white-space:nowrap">Ver na loja ↗</a>`;
  }
  return `<div>
      <div class="mkt-card-price">R$ ${p.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      <span class="mkt-card-price-sub">${p.unit}</span>
    </div>
    <button class="mkt-add-btn ${inCart?'added':''}" onclick="event.stopPropagation();addMktCart(${p.id})">${inCart?'✓ Adicionado':'+ Carrinho'}</button>`;
}

function cycleCardImg(mediaEl, pid){
  const p=MKT_PRODUCTS.find(x=>x.id===pid);
  if(!p||!p.images||p.images.length<2)return;
  const img=mediaEl.querySelector('img');
  if(!img)return;
  const cur=parseInt(img.getAttribute('data-img-idx')||'0');
  const next=(cur+1)%p.images.length;
  img.src=p.images[next];
  img.setAttribute('data-img-idx',next);
  mediaEl.querySelectorAll('.mkt-img-dot').forEach((d,i)=>d.classList.toggle('on',i===next));
}

/**
 * A área de compra do detalhe — a mesma bifurcação do card, e pelo mesmo
 * motivo. Aqui o aviso é explícito: quem vende, quem cobra e quem entrega é o
 * parceiro. Numa reclamação, «eu achei que era de vocês» é a primeira frase, e
 * ela é evitável com uma linha de texto.
 */
function mktDetalheCompra(p,inCart){
  if(mktEhIndicacao(p)){
    const href=mktLinkDeIndicacao(p);
    return `<div style="min-width:0">
        <div style="font-size:.78rem;color:var(--cream2)">${mktRotuloDeIndicacao(p)}</div>
        <span style="font-size:.65rem;color:var(--muted)">A compra, o pagamento e a entrega acontecem no site do parceiro.</span>
      </div>
      ${href
        ? `<a href="${href}" target="_blank" rel="sponsored nofollow noopener" style="padding:10px 20px;background:rgba(200,168,75,.2);border:0.5px solid rgba(200,168,75,.4);border-radius:var(--r-sm);color:var(--gold2);font-size:.8rem;font-family:'Jost',sans-serif;cursor:pointer;text-decoration:none;white-space:nowrap">Ver na loja ↗</a>`
        : `<span style="font-size:.7rem;color:var(--muted)">Indisponível no momento</span>`}`;
  }
  return `<div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--gold2)">R$ ${p.price.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
      <span style="font-size:.65rem;color:var(--muted)">${p.unit} · Pix ou cartão via Mercado Pago</span>
    </div>
    <div style="display:flex;gap:8px">
      <button class="mkt-add-btn ${inCart?'added':''}" id="mktDetailCartBtn" onclick="addMktCartFromDetail(${p.id})" ${p.stock==='out'?'disabled':''} style="padding:10px 20px;font-size:.8rem${p.stock==='out'?';opacity:.45;cursor:not-allowed':''}">${p.stock==='out'?'Esgotado':inCart?'✓ Adicionado':'+ Carrinho'}</button>
      <button onclick="addMktCartFromDetail(${p.id},true)" ${p.stock==='out'?'disabled':''} style="padding:10px 20px;background:rgba(200,168,75,.2);border:0.5px solid rgba(200,168,75,.4);border-radius:var(--r-sm);color:var(--gold2);font-size:.8rem;font-family:'Jost',sans-serif;cursor:pointer${p.stock==='out'?';opacity:.45;cursor:not-allowed':''}">Comprar agora</button>
    </div>`;
}

function openMktDetail(pid){
  const p=MKT_PRODUCTS.find(x=>x.id===pid);
  if(!p||!mktIsVisible(p))return;
  window.ervTrack&&ervTrack('view_item',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:1}]});
  const typeColor=p.cat==='Infusões'?'#4a8a5a':p.cat==='Equipamentos'?'#4a6a9a':p.cat==='Vivências'?'#9a6a3a':p.cat==='Ervas & Acessórios'?'#5a8a3a':'#6a4a9a';
  const imgs=p.images&&p.images.length?p.images:[];
  const inCart=cart.some(c=>c.id===p.id);
  const testBadge=p.is_test?'<span class="mkt-badge" style="background:rgba(100,100,200,.15);color:#a0a8e0;border:1px solid rgba(100,100,200,.3);margin-left:6px">TESTE</span>':'';
  const photoHtml=imgs[0]
    ?`<div style="position:relative;width:100%;border-radius:var(--r-lg);overflow:hidden;margin-bottom:.75rem">
        <div id="mktDetailPhoto" style="width:100%;aspect-ratio:4/3;background:#111">
          <img id="mktDetailImg" src="${imgs[0]}" data-idx="0" alt="${esc(p.name)}" style="width:100%;height:100%;object-fit:cover">
        </div>
        ${imgs.length>1?`<div class="mkt-img-dots">${imgs.map((_,i)=>`<span class="mkt-img-dot${i===0?' on':''}" onclick="switchDetailImg(${i})" style="cursor:pointer"></span>`).join('')}</div>`:''}
      </div>`
    :`<div style="width:100%;aspect-ratio:4/3;background:${typeColor}18;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-size:5rem;margin-bottom:.75rem">${p.icon}</div>`;
  const existing=document.getElementById('mktDetailOverlay');
  if(existing)existing.remove();
  const overlay=document.createElement('div');
  overlay.id='mktDetailOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center;padding:0';
  overlay.innerHTML=`
    <div style="background:var(--bg2);border-radius:var(--r-lg) var(--r-lg) 0 0;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;padding:1.5rem 1.25rem 2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <span style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:${typeColor}">${p.cat}</span>
        <button onclick="document.getElementById('mktDetailOverlay').remove()" aria-label="Fechar detalhes do produto" style="background:none;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer;padding:0 4px">✕</button>
      </div>
      ${photoHtml}
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:400;color:var(--cream);margin:0 0 .3rem">${p.name}${testBadge}${mktStockBadge(p)}</h2>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:.75rem">${p.seller} · ${p.unit}</div>
      <p style="font-size:.82rem;color:var(--cream2);line-height:1.65;margin-bottom:1.25rem">${p.desc}</p>
      ${mktFichaLink(p)}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:1rem;border-top:0.5px solid var(--faint)">
        ${mktDetalheCompra(p,inCart)}
      </div>
      <div id="mktReviews"></div>
      ${mktRelatedHtml(p)}
    </div>`;
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  window._mktDetailPid=pid;
  // Onda 7.2: avaliações (assíncrono; some sozinho se não há dbId)
  if(window.Reviews)Reviews.renderInto('mktReviews',p);
}

function switchDetailImg(idx){
  const p=MKT_PRODUCTS.find(x=>x.id===window._mktDetailPid);
  if(!p||!p.images[idx])return;
  const img=document.getElementById('mktDetailImg');
  if(img){img.src=p.images[idx];img.setAttribute('data-idx',idx);}
  document.querySelectorAll('#mktDetailOverlay .mkt-img-dot').forEach((d,i)=>d.classList.toggle('on',i===idx));
}

function addMktCartFromDetail(pid, checkout=false){
  addMktCart(pid);
  if(checkout){document.getElementById('mktDetailOverlay')?.remove();showSection('checkout');}
  else{
    const btn=document.getElementById('mktDetailCartBtn');
    if(btn){btn.textContent='✓ Adicionado';btn.classList.add('added');}
  }
}

function addMktCart(id){
  const p=MKT_PRODUCTS.find(x=>x.id===id); if(!p||!mktIsVisible(p))return;
  // Indicação não entra no carrinho. A tela nem oferece o botão, mas esta
  // função é global e alcançável — e um item de indicação no carrinho
  // atravessaria o checkout inteiro para ser recusado só na create-order,
  // depois de o visitante ter digitado endereço e escolhido frete.
  if(mktEhIndicacao(p)){toast(`${p.name} é vendido pelo parceiro — abra a loja dele para comprar.`);return;}
  const ex=cart.find(c=>c.id===id);
  if(ex)ex.qty++; else cart.push({...p,qty:1});
  window.ervTrack&&ervTrack('add_to_cart',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:1}]});
  localStorage.setItem('erb_cart',JSON.stringify(cart));
  updateCartCount(); renderMkt(); initMkt();
  toast(`${p.name} adicionado ao carrinho`);
}

// Recompra ("comprar de novo"): re-adiciona ao carrinho os itens de um
// pedido que AINDA existem no catálogo atual (casados por dbId, usando o
// produto/preço vigentes). Itens fora de catálogo voltam em `missing`.
// Toda a lógica de carrinho mora aqui — app.js é o dono de `cart`.
window.recomprarPedido = function(items){
  const added=[], missing=[];
  (items||[]).forEach(function(it){
    const p = MKT_PRODUCTS.find(x=>x.dbId && x.dbId===it.product_id);
    if(!p){ missing.push(it.product_name); return; }
    // Um pedido antigo pode conter produto que DEPOIS passou a indicação —
    // vendemos, e mais tarde passamos a só encaminhar. Recomprar o traria de
    // volta ao carrinho por um caminho que não passa pelo card. Vai para
    // `missing`, que é onde a tela já explica que o item não está mais à venda.
    if(mktEhIndicacao(p)){ missing.push(it.product_name); return; }
    const qty = Math.max(1, Math.min(999, parseInt(it.qty,10)||1));
    const ex = cart.find(c=>c.id===p.id);
    if(ex) ex.qty+=qty; else cart.push({...p,qty});
    added.push(p.name);
    window.ervTrack&&ervTrack('add_to_cart',{currency:'BRL',value:p.price,items:[{item_id:String(p.dbId||p.id),item_name:p.name,price:p.price,quantity:qty}]});
  });
  if(added.length){
    localStorage.setItem('erb_cart',JSON.stringify(cart));
    updateCartCount();
    if(typeof renderMkt==='function' && document.getElementById('mktGrid')) renderMkt();
    openCart();
  }
  return { added, missing };
};

// ════════════════════════════════════════
// ��─ CHÁS DO MUNDO ──
// ════════════════════════════════════════
// Coordinates calibrated to the real map image (1330x840)
// cx/cy are fractions 0..1 of image width/height
const MUNDO_REGIONS=[
  {id:'china',   name:'China',        flag:'����🇳',cx:.755,cy:.315,color:'#c8382a',subtitle:'Berço do chá — 5000 anos de história',producao:'3.200.000 ton/ano',exportacao:'500.000 ton/ano',area:'3.200.000 ha',tipos:['Verde','Branco','Amarelo','Oolong','Preto','Pu-erh'],desc:'A China produz todos os seis tipos de chá verdadeiro. Única com essa distinção. Cada província tem identidade própria: Fujian para brancos e oolongs, Yunnan para Pu-erh, Zhejiang para Longjing.',chas:[{n:'Longjing (Dragon Well)',reg:'Zhejiang',tipo:'Verde',badge:'#4a7a3a',d:'O chá verde mais famoso. Folhas planas, sabor de castanha tostada.'},{n:'Tie Guan Yin',reg:'Anxi, Fujian',tipo:'Oolong',badge:'#2d5a7a',d:'Deusa da Misericórdia. Floral, cremoso. Ícone dos oolongs.'},{n:'Da Hong Pao',reg:'Wuyi, Fujian',tipo:'Oolong',badge:'#2d5a7a',d:'Manto Vermelho. Entre os mais caros do mundo.'},{n:'Keemun',reg:'Anhui',tipo:'Preto',badge:'#3a1a0a',d:'Notas de vinho e chocolate. Base do English Breakfast original.'},{n:'Pu-erh Sheng',reg:'Yunnan',tipo:'Escuro',badge:'#2a1a0a',d:'Envelhece como vinho. Mercado de investimento.'},{n:'Junshan Yinzhen',reg:'Hunan',tipo:'Amarelo',badge:'#a87a2a',d:'O chá amarelo mais raro. Produção < 500kg/ano.'}],ervas:[{n:'Chrysanthemum (Ju Hua)',d:'Flor seca usada em infusões. Refrescante, anti-inflamatória. Parte da MTC há séculos.'},{n:'Goji Berry (Gou Qi Zi)',d:'Baya adaptogênica. Longevidade, visão, imunidade. Usada em tônicos e blends.'},{n:'Ginseng (Ren Shen)',d:'O adaptógeno por excelência. Energia, foco, vitalidade. Símbolo da medicina tradicional.'},{n:'Osmanthus (Gui Hua)',d:'Flor perfumada para aromatizar tés. Notas de pêssego e damasco.'}],culinaria:'Chá é parte da vida cotidiana. Dim Sum sempre acompanhado de chá. Gongfu Cha é arte e filosofia.',brasil:'Comunidade chinesa em SP traz chás premium. Liberdade concentra lojas especializadas.'},
  {id:'japao',   name:'Japão',        flag:'🇯🇵',cx:.840,cy:.295,color:'#c8304a',subtitle:'A perfeição do chá verde — a Via do Chá',producao:'86.000 ton/ano',exportacao:'6.200 ton/ano',area:'44.000 ha',tipos:['Verde (80+ estilos)','Matcha'],desc:'O Japão transformou o chá verde em arte e filosofia. Mais de 80 estilos. Matcha virou fenômeno global. A cerimônia Chanoyu é patrimônio cultural imaterial.',chas:[{n:'Matcha',reg:'Uji, Kyoto',tipo:'Verde em pó',badge:'#2d5a2a',d:'Pó de tencha cultivada à sombra. 2.5mg de L-teanina por xícara.'},{n:'Gyokuro',reg:'Uji, Kyoto',tipo:'Verde premium',badge:'#2d5a2a',d:'Cultivado à sombra 20 dias. Sabor umami profundo.'},{n:'Sencha',reg:'Shizuoka',tipo:'Verde',badge:'#4a7a3a',d:'80% da produção japonesa. O chá cotidiano.'},{n:'Hojicha',reg:'Kyoto',tipo:'Verde torrado',badge:'#5a3a1a',d:'Sencha torrado. Baixa cafeína. Ideal à noite.'}],ervas:[{n:'Kuzu (Kudzu)',d:'Raiz medicinal. Usada em pós e infusões para digestão e ressaca.'},{n:'Beni Shoga',d:'Gengibre em conserva. Digestivo, anti-inflamatório.'},{n:'Sakura (Flor de Cerejeira)',d:'Petalas salgadas usadas em chás e sakura-yu. Ritual sazonal.'}],culinaria:'Matcha em sorvetes, confeitaria, cosméticos. Matcha latte virou fenômeno global.',brasil:'Maior comunidade japonesa fora do Japão em SP.'},
  {id:'india',   name:'Índia',        flag:'🇮🇳',cx:.640,cy:.385,color:'#e07820',subtitle:'Do Assam ao Darjeeling — a outra grande potência',producao:'1.390.000 ton/ano',exportacao:'250.000 ton/ano',area:'637.000 ha',tipos:['Preto','Verde','Oolong','Branco'],desc:'Segunda maior produtora mundial. Assam e Darjeeling definem o chá preto global. Darjeeling tem GI protegida — o Champagne dos chás.',chas:[{n:'Darjeeling First Flush',reg:'Darjeeling',tipo:'Preto/Oolong',badge:'#3a1a0a',d:'Floral, muscatel, leve. O mais imitado do mundo.'},{n:'Assam CTC',reg:'Vale do Assam',tipo:'Preto CTC',badge:'#5a2a0a',d:'Base do chá de saquinho global. Forte, maltado.'},{n:'Masala Chai',reg:'Todo país',tipo:'Blend cultural',badge:'#6a3a1a',d:'Ritual de 1.4 bilhões de pessoas diariamente.'}],ervas:[{n:'Tulsi (Manjericão Sagrado)',d:'Adaptógeno revered no Ayurveda. Anti-estresse, imunidade, clareza mental.'},{n:'Ashwagandha',d:'O ginseng indiano. Adaptógeno poderoso para estresse e vitalidade.'},{n:'Neem',d:'Antibacteriano tradicional. Amargo e potente — detox profundo.'},{n:'Cardamomo',d:'Elaichi — especiaria-erva ubíqua em chai. Digestiva, refrescante, aromática.'}],culinaria:'Chai é identidade nacional. Dhabas em cada esquina.',brasil:'Assam e Darjeeling chegam via importadoras. Masala Chai muito popular.'},
  {id:'srilanka',name:'Sri Lanka',    flag:'🇱🇰',cx:.660,cy:.430,color:'#c8a030',subtitle:'Ceylon Tea — o mais puro do mundo',producao:'300.000 ton/ano',exportacao:'290.000 ton/ano',area:'222.000 ha',tipos:['Preto','Verde','Branco'],desc:'Exporta 97% do que produz. Ceylon é sinônimo de qualidade global.',chas:[{n:'Ceylon UVA',reg:'Uva Province',tipo:'Preto',badge:'#3a1a0a',d:'Aromático, mentolado, adstringente.'},{n:'Nuwara Eliya',reg:'1800m',tipo:'Preto delicado',badge:'#4a1a1a',d:'Floral, quase cor-de-rosa. Champagne of Ceylon.'}],culinaria:'Chá gelado consumo nacional. Exporta para 80+ países.',brasil:'Base histórica do saquinho brasileiro.'},
  {id:'taiwan',  name:'Taiwan',       flag:'🇹🇼',cx:.800,cy:.360,color:'#3a8a5a',subtitle:'A ilha dos High Mountain Oolongs',producao:'14.000 ton/ano',exportacao:'3.000 ton/ano',area:'13.000 ha',tipos:['Oolong','Verde','Preto'],desc:'Taiwan redefiniu o oolong. Ali Shan e Da Yu Ling a mais de 2000m produzem oolongs cremosos inimitáveis.',chas:[{n:'Ali Shan Oolong',reg:'Alishan (1400-1800m)',tipo:'Oolong High Mountain',badge:'#2d5a7a',d:'Floral, leite, creme.'},{n:'Oriental Beauty',reg:'Hsinchu',tipo:'Oolong especial',badge:'#7a5a2a',d:'Picadas de inseto criam terpenos únicos. Mel, pêssego, moscatel.'}],culinaria:'Bubble Tea inventado em Taiwan em 1986.',brasil:'Bubble tea proliferou nas cidades brasileiras.'},
  {id:'kenya',   name:'Quênia',       flag:'🇰🇪',cx:.565,cy:.495,color:'#2a7a2a',subtitle:'Terceiro maior exportador — CTC africano',producao:'570.000 ton/ano',exportacao:'525.000 ton/ano',area:'230.000 ha',tipos:['Preto CTC','Verde','Branco'],desc:'O Quênia tornou-se em 60 anos o terceiro maior produtor. Solo vulcânico, altitude 1500-2700m.',chas:[{n:'Kenya CTC',reg:'Highlands centrais',tipo:'Preto CTC',badge:'#3a1a0a',d:'Forte, cor vinho intenso. Base do English Breakfast moderno.'}],culinaria:'Chai com leite fervido é bebida nacional.',brasil:'Presente nos blends de saquinhos importados.'},
  {id:'turquia', name:'Turquia',      flag:'🇹🇷',cx:.570,cy:.275,color:'#c83030',subtitle:'Çay — maior consumidor per capita do mundo',producao:'280.000 ton/ano',exportacao:'5.000 ton/ano',area:'76.000 ha',tipos:['Preto'],desc:'Turcos consomem 3.5 kg/pessoa/ano. O Çay é servido em copo de tulipa de vidro.',chas:[{n:'Rize Çay',reg:'Rize, Mar Negro',tipo:'Preto',badge:'#3a1a0a',d:'Forte e vermelho-escuro. Chaleira dupla çaydanlık.'}],culinaria:'Oferecido em toda reunião. Recusar é descortesia.',brasil:'Influência crescente com restaurantes turcos.'},
  {id:'marrocos',name:'Marrocos',     flag:'🇲🇦',cx:.490,cy:.305,color:'#c87820',subtitle:'Atay — o ritual berber de hospitalidade',producao:'0 (não produz)',exportacao:'—',area:'—',tipos:['Verde (importado) + Hortelã'],desc:'Não produz mas transformou o ritual em arte. Gunpowder com hortelã e açúcar, derramado de altura.',chas:[{n:'Atay',reg:'Todo Marrocos',tipo:'Verde + hortelã',badge:'#4a7a3a',d:'Três copos: o 1° amargo como vida, o 2° doce como amor, o 3° suave como morte.'}],ervas:[{n:'Hortelã Nana (Mentha spicata)',d:'A rainha marroquina. Fresca, vibrante, define o Atay. Cultivada em todo o país.'},{n:'Verbena',d:'Lemon verbena — calmante, digestiva. Blendada com hortelã nas regiões do norte.'},{n:'Flor de Laranjeira',d:'Perfumada e sedante. Comum em infusões do sul marroquino.'}],culinaria:'Ritual de hospitalidade. Recusar 3 copos é insulto.',brasil:'Tendência em restaurantes árabes.'},
  {id:'uk',      name:'Reino Unido',  flag:'🇬🇧',cx:.483,cy:.195,color:'#3a3a8a',subtitle:'A nação do chá — blends e o Afternoon Tea',producao:'0 (não produz)',exportacao:'—',area:'—',tipos:['Blends de importação'],desc:'100 milhões de xícaras por dia. Criou os grandes blends globais.',chas:[{n:'English Breakfast',reg:'Blend britânico',tipo:'Blend preto',badge:'#3a1a0a',d:'Assam + Ceylon + Kenya. O mais consumido do mundo.'},{n:'Earl Grey',reg:'Blend c/ bergamota',tipo:'Aromatizado',badge:'#3a3a7a',d:'Chá preto com óleo de bergamota. Criado em 1830.'}],culinaria:'Afternoon Tea com scones. Leite primeiro ou depois — debate nacional sério.',brasil:'Marcas inglesas em supermercados. Afternoon Tea em hotéis.'},
  {id:'russia',  name:'Rússia',       flag:'🇷🇺',cx:.660,cy:.185,color:'#8a2a2a',subtitle:'Samovar — a alma do inverno russo',producao:'700 ton/ano',exportacao:'—',area:'1.500 ha',tipos:['Preto (importado)','Krasnodar'],desc:'Popularizou o chá na Europa via Rota do Chá. O samovar é ícone cultural.',chas:[{n:'Russian Caravan',reg:'Blend histórico',tipo:'Blend defumado',badge:'#4a2a1a',d:'Levemente defumado — recria sabor das fogueiras das caravanas.'}],culinaria:'Chá com geleia (varenje). Samovar com concentrado diluído a gosto.',brasil:'Russian Caravan em lojas especializadas.'},
  {id:'brasil',  name:'Brasil',       flag:'🇧🇷',cx:.300,cy:.555,color:'#2a8a2a',subtitle:'Produtor emergente — do mate ao Camellia',producao:'4.200 ton/ano',exportacao:'200 ton/ano',area:'3.500 ha',tipos:['Preto','Verde','Erva-mate'],desc:'Produção iniciada por imigrantes japoneses em 1935. Maior polo em Registro (SP). O Brasil é também o país com maior biodiversidade de ervas medicinais do mundo.',chas:[{n:'Chá Preto de Registro',reg:'Vale do Ribeira, SP',tipo:'Preto',badge:'#3a1a0a',d:'Desde 1935. Solo ácido, clima subtropical.'},{n:'Erva-Mate',reg:'Sul do Brasil',tipo:'Mate',badge:'#2d5a2a',d:'O chá mais consumido no Brasil. Chimarrão, tereré e mate gelado.'}],ervas:[{n:'Erva-Mate (Ilex paraguariensis)',d:'O chá nacional. Mais cafeína que o verde. Chimarrão, tereré, mate gelado.'},{n:'Hibisco (Hibiscus sabdariffa)',d:'Flor vermelha ácida. Rico em antocianinas, anti-hipertensivo, refrescante.'},{n:'Capim-Limão (Cymbopogon citratus)',d:'Aromático, calmante, digestivo. Toque cítrico único. Cultivado em todo o país.'},{n:'Erva-Cidreira (Lippia alba)',d:'Ansiolítico natural. Calmante suave, digestivo, cicatrizante.'},{n:'Camomila (Matricaria chamomilla)',d:'Sedativa leve, anti-inflamatória. Uma das mais consumidas.'},{n:'Boldo-do-Chile (Peumus boldus)',d:'O protetor hepático. Amargo, potente. Símbolo dos chás medicinais.'}],culinaria:'Chimarrão ritual gaúcho. Tereré cultura mato-grossense.',brasil:'O Brasil é produtor, consumidor e importador simultaneamente.'},
  {id:'georgia', name:'Geórgia',      flag:'🇬🇪',cx:.605,cy:.260,color:'#c84040',subtitle:'O chá esquecido do Cáucaso',producao:'3.000 ton/ano',exportacao:'800 ton/ano',area:'11.000 ha',tipos:['Preto','Verde'],desc:'Principal produtora soviética. Com a dissolução da URSS a produção colapsou. Hoje em revival artesanal.',chas:[{n:'Guria Black',reg:'Guria',tipo:'Preto',badge:'#3a1a0a',d:'Floral, levemente amadeirado. Produção artesanal em revival.'}],ervas:[{n:'Tarragon (Estragon)',d:'Erva aromática icônica da culinária georgiana. Usada também em limonadas.'},{n:'Savory (Satureja)',d:'Tomilho-selvagem local. Infusões digestivas e carnes grelhadas.'}],culinaria:'Chá forte com açúcar. Hospitalidade caucasiana.',brasil:'Praticamente desconhecido no Brasil.'},
  {id:'argentina',name:'Argentina',   flag:'🇦🇷',cx:.270,cy:.650,color:'#5a9a3a',subtitle:'Terra do chimarrão — yerba mate como identidade',producao:'300.000 ton/ano (mate)',exportacao:'120.000 ton/ano',area:'200.000 ha',tipos:['Erva-Mate','Blends aromáticos'],desc:'A Argentina é o maior produtor e exportador mundial de erva-mate. Missiones, no nordeste, concentra quase toda a produção. O chimarrão é mais que bebida — é identidade cultural e símbolo de partilha.',chas:[{n:'Yerba Mate Clásica',reg:'Missiones',tipo:'Mate puro',badge:'#2d5a2a',d:'Verde, amargo, encorpado. A base do chimarrão argentino.'},{n:'Mate Compuesto',reg:'Todo país',tipo:'Blend c/ ervas',badge:'#3a7a2a',d:'Yerba com ervas adicionadas: menta, boldo, poejo. Suaviza o amargor.'},{n:'Tereré',reg:'Corrientes, Chaco',tipo:'Mate gelado',badge:'#1a5a3a',d:'Compartilhado em grupos. Com agua fría e ervas frescas.'}],ervas:[{n:'Poejo (Mentha pulegium)',d:'Digestiva potente. Adicionada ao mate para suavizar e aromatizar.'},{n:'Cedrón (Lemon Verbena)',d:'Aloysia citrodora. Calmante, digestiva, sabor suave de limão.'},{n:'Burrito (Aloysia polystachya)',d:'Única no cone sul. Perfumada, digestiva, anti-inflamatória.'},{n:'Menta (Mentha x piperita)',d:'Amplamente cultivada. Refresca o mate e infusões quentes.'}],culinaria:'Chimarrão em cuia de cabaça com bomba de metal. Compartilhado em rodas.',brasil:'Chimarrão gaúcho tem raiz cultural compartilhada. Tereré idêntico ao mato-grossense.'},
  {id:'sudafrica',name:'África do Sul',flag:'🇿🇦',cx:.540,cy:.600,color:'#c87020',subtitle:'Rooibos e Honeybush — tesouros únicos da Fynbos',producao:'15.000 ton/ano (rooibos)',exportacao:'12.000 ton/ano',area:'32.000 ha',tipos:['Rooibos','Honeybush','Buchu'],desc:'A África do Sul tem dois chás que não existem em mais nenhum lugar do mundo: o Rooibos (Aspalathus linearis) e o Honeybush (Cyclopia spp.). Ambos são sem cafeína e ricos em antioxidantes únicos.',chas:[{n:'Rooibos (Chá Vermelho)',reg:'Cederberg, W. Cape',tipo:'Tisana sem cafeína',badge:'#c84820',d:'O "chá vermelho" africano. Sem cafeína, rico em aspalathina. Vermelho rubí.'},{n:'Rooibos Verde',reg:'Cederberg',tipo:'Rooibos não oxidado',badge:'#7a8a3a',d:'Menos processado. Mais suave, mais antioxidantes. Raro e premium.'},{n:'Honeybush',reg:'Langkloof, E. Cape',tipo:'Tisana mel',badge:'#a87820',d:'Cyclopia — notas naturais de mel e baunilha. Sem açúcar adicionado.'}],ervas:[{n:'Rooibos (Aspalathus linearis)',d:'Único no mundo. Sem cafeína, anti-alérgico, rico em aspalathina. Cultivado só no Cederberg.'},{n:'Honeybush (Cyclopia spp.)',d:'Parente do rooibos. Mel natural sem adição. Oito espécies, cada com perfil único.'},{n:'Buchu (Agathosma betulina)',d:'Erva sagrada khoi. Cicatrizante, antibacteriana, antiséptica. Exportada ao mundo.'},{n:'Devil\'s Claw (Harpagophytum)',d:'Raíz anti-inflamatória poderosa. Artrite, dores musculares. Savana sul-africana.'}],culinaria:'Rooibos com leite, gelado, em culinária. Honeybush em sobremesas.',brasil:'Rooibos popular em lojas de produtos naturais. Sem cafeína — favorito noturno.'},
  {id:'egito',   name:'Egito/Oriente Médio',flag:'🌍',cx:.545,cy:.340,color:'#c84a20',subtitle:'Karkade — o hibisco sagrado do Nilo',producao:'Hibisco, ervas medicinais',exportacao:'Hibisco seco, olíbano',area:'—',tipos:['Hibisco (Karkade)','Ervas medicinais'],desc:'O Egito e o Oriente Médio têm tradição milenar de infusões. O Karkade (hibisco) é consumido quente e gelado em todo o Oriente Médio e Norte da África — rico em antocianinas e anti-hipertensivo.',chas:[{n:'Karkade (Hibisco)',reg:'Egito e Sudão',tipo:'Floral/ácida',badge:'#c83040',d:'Vermelho-vivo, ácido, anti-hipertensivo. Servido quente e gelado.'},{n:'Chai de Especiarias',reg:'Todo Oriente Médio',tipo:'Blend',badge:'#8a4a10',d:'Cardamomo, canela, cravo, gengibre. Cada país com sua versão.'},{n:'Sage (Sálvia)',reg:'Líbano, Síria',tipo:'Herbal',badge:'#4a7a3a',d:'Maramiya — sálvia medicinal. Muito consumida nas regiões montanhosas.'}],ervas:[{n:'Hibisco (Hibiscus sabdariffa)',d:'Karkade egípcio. Anti-hipertensivo, rico em vitamina C e antocianinas.'},{n:'Sálvia (Salvia officinalis)',d:'Maramiya árabe. Antibacteriana, digestiva, hormonal. Sagrada na medicina árabe.'},{n:'Olíbano (Boswellia sacra)',d:'Incenso/resina anti-inflamatória. Infusões no Omã e Yemen.'},{n:'Rosas de Damasco',d:'Rosa damascena. Água de rosas em bebidas e sobremesas árabes.'}],culinaria:'Karkade quente no inverno, gelado no verão com açúcar. Onipresente.',brasil:'Hibisco nacional. O chá mais consumido no Brasil depois do mate.'},
];

let mundoView='mapa', mundoRegionActive=null, mundoListFilter='Todos';

function initMundo(){
  setMundoView('mapa', document.getElementById('btnMapa'));
}

function setMundoView(v,btn){
  mundoView=v;
  document.querySelectorAll('.mundo-view-btn').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  document.getElementById('mundoMapView').style.display=v==='mapa'?'block':'none';
  document.getElementById('mundoListView').style.display=v==='lista'?'block':'none';
  document.getElementById('mundoBrasilView').style.display=v==='brasil'?'block':'none';
  if(v==='mapa') drawMundoMap();
  if(v==='lista'){buildMundoListFilter();renderMundoList();}
  if(v==='brasil'){ renderBrasilContent(); if(typeof trackAction==='function') trackAction('visit-brasil'); }
}

function drawMundoMap(){
  const svg=document.getElementById('mundoDotsLayer'); if(!svg)return;
  const NS='http://www.w3.org/2000/svg';
  // Clear previous dots
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  function mk(tag,attrs){
    const el=document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    return el;
  }

  // viewBox is 1330x840 matching the real map image dimensions
  const VW=1330, VH=840;

  MUNDO_REGIONS.forEach(r=>{
    const px=r.cx*VW, py=r.cy*VH;
    const isSel=mundoRegionActive===r.id;
    const dr=isSel?18:13;

    const g=document.createElementNS(NS,'g');
    g.style.cursor='pointer';

    // Pulse ring for selected
    if(isSel){
      g.appendChild(mk('circle',{cx:px,cy:py,r:dr+10,fill:r.color,opacity:'0.2'}));
      g.appendChild(mk('circle',{cx:px,cy:py,r:dr+5,fill:r.color,opacity:'0.15'}));
    }
    // Drop shadow
    g.appendChild(mk('circle',{cx:px,cy:py+2,r:dr+2,fill:'rgba(0,0,0,0.35)'}));
    // Main dot
    g.appendChild(mk('circle',{cx:px,cy:py,r:dr,fill:isSel?lightenW(r.color,.38):r.color}));
    // White highlight
    g.appendChild(mk('circle',{cx:px-dr*.3,cy:py-dr*.3,r:dr*.38,fill:'rgba(255,255,255,0.3)'}));
    // Flag emoji
    const ft=document.createElementNS(NS,'text');
    ft.setAttribute('x',px); ft.setAttribute('y',py+1);
    ft.setAttribute('text-anchor','middle');
    ft.setAttribute('dominant-baseline','middle');
    ft.setAttribute('font-size',isSel?16:12);
    ft.setAttribute('style','pointer-events:none;user-select:none');
    ft.textContent=r.flag;
    g.appendChild(ft);

    // Name label when selected
    if(isSel){
      const lw=r.name.length*7+16;
      g.appendChild(mk('rect',{x:px-lw/2,y:py+dr+4,width:lw,height:18,rx:4,fill:'rgba(0,0,0,0.85)'}));
      const lt=document.createElementNS(NS,'text');
      lt.setAttribute('x',px); lt.setAttribute('y',py+dr+13);
      lt.setAttribute('text-anchor','middle');
      lt.setAttribute('dominant-baseline','middle');
      lt.setAttribute('font-size',10);
      lt.setAttribute('font-family','Jost,sans-serif');
      lt.setAttribute('fill','#e6c96e');
      lt.setAttribute('font-weight','500');
      lt.setAttribute('style','pointer-events:none;user-select:none');
      lt.textContent=r.name;
      g.appendChild(lt);
    }

    // Events
    g.addEventListener('click',()=>selectMapRegion(r.id));
    g.addEventListener('mouseenter',e=>mapDotHover(r.id,e));
    g.addEventListener('mouseleave',mapDotLeave);
    g.addEventListener('touchstart',e=>{e.preventDefault();selectMapRegion(r.id);},{passive:false});

    svg.appendChild(g);
  });

  // Legend
  const leg=document.getElementById('mapLegend'); if(!leg)return;
  leg.innerHTML='<div style="font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.5rem;width:100%">Clique em um ponto do mapa ou na legenda</div>'+
    MUNDO_REGIONS.map(r=>`
      <div class="mundo-legend-item" style="cursor:pointer;padding:3px 8px;border-radius:5px;${mundoRegionActive===r.id?'background:rgba(200,168,75,.1)':''}"
           onclick="selectMapRegion('${r.id}')">
        <div class="mundo-legend-dot" style="background:${r.color};${mundoRegionActive===r.id?'box-shadow:0 0 0 2px '+r.color+'66':''}"></div>
        <span style="color:${mundoRegionActive===r.id?'var(--gold2)':'inherit'}">${r.flag} ${r.name}</span>
      </div>`).join('');
}

function mapDotHover(id,e){
  const reg=MUNDO_REGIONS.find(r=>r.id===id); if(!reg)return;
  const tt=document.getElementById('mapTooltip'); if(!tt)return;
  const wrap=document.getElementById('mundoSvgWrap'); if(!wrap)return;
  const rect=wrap.getBoundingClientRect();
  const clientX=e?e.clientX:0, clientY=e?e.clientY:0;
  tt.style.display='block';
  tt.style.left=Math.min(clientX-rect.left+14, rect.width-230)+'px';
  tt.style.top=Math.max(clientY-rect.top-40, 4)+'px';
  tt.innerHTML='<strong>'+esc(reg.flag)+' '+esc(reg.name)+'</strong><br><span style="color:var(--muted);font-size:.7rem">'+esc(reg.subtitle)+'</span>';
}

function mapDotLeave(){
  const tt=document.getElementById('mapTooltip'); if(tt) tt.style.display='none';
}

function selectMapRegion(id){
  mundoRegionActive=mundoRegionActive===id?null:id;
  if(id && typeof trackAction==='function') trackAction('visit-region', id);
  drawMundoMap();
  const reg=mundoRegionActive?MUNDO_REGIONS.find(r=>r.id===mundoRegionActive):null;
  const el=document.getElementById('regionDetail'); if(!el)return;
  if(!reg){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML=`
    <div class="mrd-header">
      <div class="mrd-flag">${reg.flag}</div>
      <div><div class="mrd-title">${esc(reg.name)}</div><div class="mrd-subtitle">${esc(reg.subtitle)}</div></div>
    </div>
    <p style="font-size:.82rem;color:var(--cream2);line-height:1.7;margin-bottom:1rem">${esc(reg.desc)}</p>
    <div class="mrd-grid">
      <div class="mrd-card"><div class="mrd-card-label">Produção anual</div><div class="mrd-card-val">${esc(reg.producao)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Exportação</div><div class="mrd-card-val">${esc(reg.exportacao)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Área cultivada</div><div class="mrd-card-val">${esc(reg.area)}</div></div>
      <div class="mrd-card"><div class="mrd-card-label">Tipos produzidos</div><div class="mrd-card-val">${reg.tipos.map(t=>esc(t)).join(' · ')}</div></div>
    </div>
    <div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem">Chás principais</div>
    <div style="background:var(--bg2);border:0.5px solid var(--faint);border-radius:var(--r-lg);overflow:hidden;margin-bottom:1rem">
      ${reg.chas.map(c=>`<div class="mrd-cha-row" style="padding:.65rem 1rem">
        <div style="flex:1">
          <div class="mrd-cha-name">${esc(c.n)} <span class="mrd-cha-badge" style="background:${c.badge}22;border:0.5px solid ${c.badge}44;color:${c.badge}">${esc(c.tipo)}</span></div>
          <div class="mrd-cha-desc">${esc(c.d)}</div>
          ${c.reg?`<div style="font-size:.65rem;color:var(--muted);margin-top:2px;display:inline-flex;align-items:center;gap:4px">${svgIcon('pin')} ${esc(c.reg)}</div>`:''}
        </div>
      </div>`).join('')}
    </div>
    ${reg.ervas?`<div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem">Ervas & Plantas Locais</div>
    <div class="mrd-ervas-grid" style="margin-bottom:1rem">${reg.ervas.map(e=>`<div class="mrd-erva-item"><div class="mrd-erva-name" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('leaf')} ${esc(e.n)}</div><div class="mrd-erva-desc">${esc(e.d)}</div></div>`).join('')}</div>`:''}
    <div class="mrd-grid">
      <div class="mrd-card"><div class="mrd-card-label">Cultura & culinária</div><div class="mrd-card-val">${esc(reg.culinaria)}</div></div>
      <div class="mrd-card" style="border-left:2px solid #2a8a2a"><div class="mrd-card-label" style="color:#4a8a4a">🇧🇷 Conexão com o Brasil</div><div class="mrd-card-val">${esc(reg.brasil)}</div></div>
    </div>`;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function buildMundoListFilter(){
  const el=document.getElementById('listFilter'); if(!el)return;
  el.innerHTML='';
  const regionMap={china:'Ásia',japao:'Ásia',india:'Ásia',srilanka:'Ásia',taiwan:'Ásia',georgia:'Ásia',kenya:'África',turquia:'Ásia',marrocos:'África',russia:'Europa',uk:'Europa',brasil:'Américas',argentina:'Américas',sudafrica:'África',egito:'África'};
  ['Todos','Ásia','Europa','África','Américas'].forEach(r=>{
    const b=document.createElement('button');
    b.className='mfl-btn'+(mundoListFilter===r?' on':'');
    b.textContent=r;
    b.onclick=()=>{mundoListFilter=r;buildMundoListFilter();renderMundoList();};
    el.appendChild(b);
  });
}

function renderMundoList(){
  const regionMap={china:'Ásia',japao:'Ásia',india:'Ásia',srilanka:'Ásia',taiwan:'Ásia',georgia:'Ásia',kenya:'África',turquia:'Ásia',marrocos:'África',russia:'Europa',uk:'Europa',brasil:'Américas',argentina:'Américas',sudafrica:'África',egito:'África'};
  const list=MUNDO_REGIONS.filter(r=>mundoListFilter==='Todos'||regionMap[r.id]===mundoListFilter);
  const el=document.getElementById('mundoListContent'); if(!el)return;
  el.innerHTML=list.map(r=>`
    <div class="mundo-country-block">
      <div class="mcb-header" id="mch_${r.id}" onclick="toggleCountry('${r.id}')">
        <div class="mcb-flag">${r.flag}</div>
        <div style="flex:1"><div class="mcb-name">${esc(r.name)}</div><div class="mcb-prod">${esc(r.producao)} · ${r.tipos.slice(0,3).map(t=>esc(t)).join(', ')}</div></div>
        <div class="mcb-arrow" id="mca_${r.id}">▾</div>
      </div>
      <div class="mcb-body" id="mcb_${r.id}">
        <p style="font-size:.82rem;color:var(--cream2);line-height:1.7;margin-bottom:.75rem">${esc(r.desc)}</p>
        <div style="font-size:.6rem;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);margin-bottom:.4rem">Chás & Infusões</div>
        ${r.chas.map(c=>`<div class="mrd-cha-row"><div style="flex:1">
          <div class="mrd-cha-name">${esc(c.n)} <span class="mrd-cha-badge" style="background:${c.badge}22;border:0.5px solid ${c.badge}44;color:${c.badge}">${esc(c.tipo)}</span></div>
          <div class="mrd-cha-desc">${esc(c.d)}</div>
          ${c.reg?`<div style="font-size:.65rem;color:var(--muted);margin-top:2px;display:inline-flex;align-items:center;gap:4px">${svgIcon('pin')} ${esc(c.reg)}</div>`:''}
        </div></div>`).join('')}
        ${r.ervas?`<div style="font-size:.6rem;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);margin:.75rem 0 .4rem">Ervas & Plantas Locais</div>
        <div class="mrd-ervas-grid">${r.ervas.map(e=>`<div class="mrd-erva-item"><div class="mrd-erva-name" style="display:inline-flex;align-items:center;gap:5px">${svgIcon('leaf')} ${esc(e.n)}</div><div class="mrd-erva-desc">${esc(e.d)}</div></div>`).join('')}</div>`:''}
        <div style="margin-top:.75rem;padding:.75rem;background:rgba(42,138,42,.06);border:0.5px solid rgba(42,138,42,.2);border-radius:var(--r-md);font-size:.75rem;color:var(--cream2)">
          <span style="color:#4a8a4a;font-size:.62rem;letter-spacing:.08em;text-transform:uppercase">🇧🇷 Conexão com o Brasil</span><br>${esc(r.brasil)}
        </div>
      </div>
    </div>`).join('');
}

function toggleCountry(id){
  const body=document.getElementById('mcb_'+id),hdr=document.getElementById('mch_'+id),arrow=document.getElementById('mca_'+id);
  if(!body)return;
  const open=body.classList.contains('open');
  body.classList.toggle('open',!open); hdr.classList.toggle('open',!open); if(arrow)arrow.classList.toggle('open',!open);
}

function renderBrasilContent(){
  const el=document.getElementById('brasilContent'); if(!el)return;
  el.innerHTML=`
    <div class="brasil-hero">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:var(--gold2);font-weight:300;margin-bottom:.5rem">🇧🇷 O Brasil e o chá verdadeiro</div>
      <div style="font-size:.82rem;color:var(--cream2);line-height:1.7">O Brasil tem uma relação paradoxal com o chá: é um dos maiores consumidores de "chás" (na maior parte tisanas de ervas), mas quase desconhece sua própria produção de Camellia sinensis. A história começa com imigrantes japoneses em 1935 no Vale do Ribeira e continua crescendo silenciosamente.</div>
      <div class="brasil-stat-grid">
        <div class="brasil-stat"><div class="brasil-stat-val">1935</div><div class="brasil-stat-key">Início produção Camellia</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">4.200 t</div><div class="brasil-stat-key">Produção anual estimada</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">3.500 ha</div><div class="brasil-stat-key">Área cultivada</div></div>
        <div class="brasil-stat"><div class="brasil-stat-val">6°</div><div class="brasil-stat-key">Maior consumidor mundial</div></div>
      </div>
    </div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin-bottom:.75rem;font-weight:300">Polos produtores</div>
    ${[{name:'Vale do Ribeira — Registro, SP',icon:'🌱',loc:'Registro e região',desc:'O maior e mais antigo polo. Fundado por imigrantes japoneses em 1935. Solo ácido e clima subtropical. Produz principalmente chá preto e verde. Cooperativa Chá de Registro.',tipos:'Preto, Verde'},{name:'Serra Gaúcha — RS',icon:'🍇',loc:'Bento Gonçalves, Gramado',desc:'Experimentos com Camellia sinensis em altitude (800-900m). Pequenas propriedades artesanais incipientes.',tipos:'Verde, Preto (experimental)'},{name:'Região Serrana — RJ',icon:'⛰',loc:'Petrópolis, Nova Friburgo',desc:'Projetos piloto em altitude (800-1200m). Clima favorável com névoa frequente — similar a regiões asiáticas.',tipos:'Verde (experimental)'},{name:'Minas Gerais — UFV',icon:'🎓',loc:'Viçosa, MG',desc:'Pesquisas da UFV com variedades adaptadas. Zona da Mata tem potencial para chás de qualidade.',tipos:'Pesquisa acadêmica'}].map(r=>`<div class="brasil-region"><div class="brasil-region-name">${r.icon} ${r.name}</div><div class="brasil-region-loc">📍 ${r.loc}</div><div class="brasil-region-desc">${r.desc}</div><div style="margin-top:.3rem;font-size:.7rem;color:var(--gold)">Tipos: ${r.tipos}</div></div>`).join('')}
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin:.5rem 0 .75rem;font-weight:300">Comparativo: Brasil vs. Grandes Produtores</div>
    <div class="compare-table-wrap"><table class="cha-compare-table" style="min-width:480px">
      <tr><th>Aspecto</th><th>🇧🇷 Registro, SP</th><th>🇮🇳 Darjeeling</th><th>🇯🇵 Uji</th></tr>
      <tr><td>Altitude</td><td>30-100m</td><td>800-2200m</td><td>200-600m</td></tr>
      <tr><td>Perfil</td><td>Encorpado, terroso</td><td>Floral, muscatel</td><td>Umami, gramíneo</td></tr>
      <tr><td>Preço (100g)</td><td>R$ 30-80</td><td>R$ 80-400</td><td>R$ 80-600</td></tr>
      <tr><td>Disponibilidade</td><td>Local/regional</td><td>Importação</td><td>Importação</td></tr>
      <tr><td>Identidade</td><td>Em construção</td><td>Consolidada (DOP)</td><td>Consolidada</td></tr>
    </table></div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--gold2);margin:1rem 0 .75rem;font-weight:300">A Erva-Mate — o chá brasileiro por excelência</div>
    <div class="brasil-hero" style="background:rgba(45,90,42,.1);border-color:rgba(45,90,42,.25)">
      <div style="font-size:.82rem;color:var(--cream2);line-height:1.7">Ilex paraguariensis — não é Camellia sinensis, mas é o "chá" mais consumido no Brasil. Tem mais cafeína que muitos chás verdes. O chimarrão, o tereré e o mate gelado são expressões de uma cultura única.</div>
      <div style="margin-top:.75rem;display:flex;flex-wrap:wrap;gap:8px">
        ${[{n:'Chimarrão',r:'Rio Grande do Sul',c:'Quente, cuia e bomba'},{n:'Tereré',r:'MS, MT, Paraguai',c:'Gelado com ervas'},{n:'Mate Gelado',r:'São Paulo',c:'Industrializado'},{n:'Mate Torrado',r:'Todo Brasil',c:'Defumado, em saquinho'}].map(m=>`<div style="background:rgba(45,90,42,.1);border:0.5px solid rgba(45,90,42,.2);border-radius:var(--r-md);padding:.5rem .75rem"><div style="font-size:.8rem;font-weight:400;color:var(--cream)">${m.n}</div><div style="font-size:.68rem;color:#4a8a4a">${m.r}</div><div style="font-size:.68rem;color:var(--muted)">${m.c}</div></div>`).join('')}
      </div>
    </div>`;
}

// ── SOBRE ──
function renderSobre(){
  const el=document.getElementById('sobreContent'); if(!el)return;
  el.innerHTML=`
    <div class="sobre-wrap">
      <div class="sobre-hero-wrap">
        <img data-responsive="images/hero/hero-maos.png" alt="Ritual do chá" class="sobre-hero-photo"
          loading="lazy" onerror="this.style.display='none'">
      </div>

      <div class="sobre-body">
        <div class="sobre-tag">Manifesto</div>
        <div class="sobre-titulo">Transformamos ervas em rituais.</div>
        <div class="sobre-texto">Vivemos em um mundo acelerado, desconectado dos ciclos naturais. O corpo pede pausa. A mente pede clareza. A vida pede presença.</div>
        <div class="sobre-texto">O Ervatório nasce do resgate desse equilíbrio. Acreditamos que o cuidado começa no simples — na água aquecida, na folha escolhida, no tempo respeitado.</div>
        <div class="sobre-destaque">"Cada erva carrega uma história. Cada infusão, um ritual. Cada momento, uma oportunidade de reconexão."</div>
        <div class="sobre-texto">Unimos tradição e ciência. Brasil e mundo. Natureza e precisão. Selecionamos, estudamos e apresentamos ervas com propósito — não como produto, mas como experiência.</div>

        <div class="sobre-tag" style="margin-top:2rem">Nossos pilares</div>
        <div class="sobre-pilares">
          ${[
            {i:'🌿',n:'Natural',d:'Fitoterapia real, com base científica e tradição'},
            {i:'🧠',n:'Inteligente',d:'Cada erva documentada com rigor técnico e acessibilidade'},
            {i:'🕊️',n:'Sensorial',d:'Experiência completa — aroma, preparo, momento, ritual'},
            {i:'🇧🇷',n:'Brasileiro',d:'Biodiversidade única do Cerrado, Mata Atlântica e Amazônia'},
          ].map(p=>`
            <div class="sobre-pilar">
              <div style="font-size:1.4rem;margin-bottom:.5rem">${p.i}</div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--gold2);margin-bottom:.25rem">${p.n}</div>
              <div style="font-size:.75rem;color:var(--cream2);line-height:1.6">${p.d}</div>
            </div>
          `).join('')}
        </div>

        <div class="sobre-tag" style="margin-top:2rem">Nossas linhas</div>
        <div class="sobre-linhas">
          ${[
            {n:'Essencial',d:'Ervas brasileiras puras, curadoria de origem e qualidade',c:'#2d5a3a',bg:'rgba(45,90,58,.1)'},
            {n:'Global',d:'Matcha, oolong, rooibos — o melhor do mundo em curadoria',c:'#2d4a6b',bg:'rgba(45,74,107,.1)'},
            {n:'Funcional',d:'Blends com objetivo claro — sono, foco, digestão, imunidade',c:'#6b4a1a',bg:'rgba(107,74,26,.1)'},
            {n:'Ritual',d:'Kits completos com erva, acessório e guia de preparo',c:'#5a2d6b',bg:'rgba(90,45,107,.1)'},
          ].map(l=>`
            <div class="sobre-linha" style="background:${l.bg};border-left:3px solid ${l.c}">
              <div style="font-size:.85rem;font-weight:400;color:var(--cream);margin-bottom:.2rem">${l.n}</div>
              <div style="font-size:.72rem;color:var(--cream2);line-height:1.5">${l.d}</div>
            </div>
          `).join('')}
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:1.5rem">
          <button class="add-blend-btn" onclick="goPage('search')" style="flex:1;min-width:140px">Explorar o catálogo</button>
          <button class="add-blend-btn" onclick="goPage('roda')" style="flex:1;min-width:140px;background:rgba(200,168,75,.15)">🎡 Roda dos Chás</button>
        </div>

        <div class="sobre-tag" style="margin-top:2rem">Contato</div>
        <div class="sobre-texto">
          Dúvidas, parcerias ou suporte? Fale com a gente:
          <a href="mailto:contato@ervatorio.com.br" style="color:var(--gold2);text-decoration:none">contato@ervatorio.com.br</a>
        </div>
      </div>
    </div>`;
}

// ── INIT ──
if(typeof initI18n==='function') initI18n();
if(typeof updateSEO==='function') updateSEO('search');
buildFilters();
renderHerbs();
drawWheel();
buildWizard();
renderTray();
updateCartCount();
renderPerfil();
