// ============================================================
// GET /indicacao?produto=<uuid> — o clique que vai para a loja do parceiro
// ============================================================
//
// ## Por que passar por aqui em vez de linkar direto
//
// Porque a comissão é cobrada sobre o que encaminhamos, e sem medida «quanto
// você nos deve» vira negociação sobre memória. Um `<a href>` direto seria mais
// simples e não deixaria número nenhum.
//
// O que se mede é VOLUME, não pessoa: `cliques_de_indicacao` guarda o produto e
// a hora, e nada mais.
//
// ## O destino nunca vem do cliente
//
// O parâmetro é o **id do produto**; a URL sai do nosso cadastro. Aceitar a URL
// na query transformaria isto num **redirecionador aberto** — o presente que um
// phisher pede: um link que começa no nosso domínio, com o nosso certificado,
// e termina onde ele quiser. O e-mail chega dizendo `ervatorio.com.br/...` e a
// vítima acaba numa página de login clonada.
//
// Mesmo vindo do cadastro o link é conferido de novo, pela mesma regra que o
// `CHECK` do banco aplica (`link_de_indicacao_seguro`). Duas conferências
// parecem redundância até uma das duas ser contornada: a do banco não vale para
// linha escrita antes desta migration, e a daqui não vale se alguém escrever
// direto na tabela com service_role.
//
// ## Por que é uma Edge Function e não um `<a>` com onclick
//
// Porque medir no navegador é medir só quem deixa o script rodar, e o clique
// que interessa é justamente o que converte — o de quem vai comprar. Além
// disso, um `fetch` de medição disparado junto do `window.open` compete com a
// navegação e perde: a página troca, o request morre no meio.
import { adminClient } from '../_shared/auth.ts';
import { interruptorLigado } from '../_shared/interruptores.ts';
import { clientIp, rateLimitAllow } from '../_shared/ratelimit.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOJA = (Deno.env.get('SITE_URL') || 'https://ervatorio.com.br') + '/#loja';

/**
 * A mesma regra do `CHECK` do banco. Mantida em duas linguagens de propósito —
 * ver o cabeçalho —, e é por isso que ela é simples: uma regra que precisa
 * existir duas vezes precisa caber na cabeça, senão as duas cópias divergem e
 * quem fica valendo é a mais permissiva.
 */
function linkSeguro(link: string | null): link is string {
  if (!link || !/^https:\/\//i.test(link)) return false;
  if (/\s/.test(link)) return false;
  // Nada de credencial embutida: `https://ervatorio.com.br@evil.tld` é lido
  // pelo olho como o nosso domínio e pelo navegador como `evil.tld`.
  const autoridade = link.slice(8).split('/')[0];
  return !autoridade.includes('@');
}

/**
 * Recusa única: o visitante volta para a loja, não vê erro cru.
 *
 * Todo caminho de recusa termina aqui de propósito. Distinguir «produto não
 * existe» de «produto não é indicação» de «link inválido» na resposta HTTP
 * seria dizer a um estranho o que há no nosso catálogo, item por item, com um
 * laço de repetição.
 */
function paraALoja(): Response {
  return Response.redirect(LOJA, 302);
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') return paraALoja();

  // Rate limit por IP: isto grava uma linha por chamada, e sem teto alguém
  // inflaria a contagem que fatura o parceiro. É por IP porque não há sessão —
  // e não haver sessão é a decisão de privacidade desta rota, não um descuido.
  if (!(await rateLimitAllow(`indicacao:ip:${clientIp(req)}`, { windowSeconds: 60, max: 60 }))) {
    // 429 e não redirecionamento: quem bate no teto é script, e script não
    // precisa de página bonita.
    return new Response(JSON.stringify({ error: 'Muitas requisições.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // O interruptor decide se a vitrine de indicação está no ar. Desligado, o
  // link não deve encaminhar nada — senão desligar a vitrine deixaria de fora
  // justamente os links já compartilhados, que são os que continuam sendo
  // clicados. `interruptorLigado` falha fechada.
  if (!(await interruptorLigado('indicacao'))) return paraALoja();

  const produtoId = new URL(req.url).searchParams.get('produto');
  if (!produtoId || !UUID_RE.test(produtoId)) return paraALoja();

  const db = adminClient();
  const { data: produto, error } = await db
    .from('admin_products')
    .select('id, modo_de_venda, link_externo, active')
    .eq('id', produtoId)
    .maybeSingle();

  if (error) {
    console.error('[indicacao] consulta falhou:', error.message);
    return paraALoja();
  }

  // Inexistente, inativo, ou vendido por nós: nenhum deles tem para onde
  // encaminhar.
  if (!produto || produto.active === false || produto.modo_de_venda !== 'indicacao') {
    return paraALoja();
  }

  if (!linkSeguro(produto.link_externo)) {
    // Publicado com link que não dá para encaminhar. É erro de cadastro e
    // precisa aparecer no log — senão vira um card que não leva a lugar nenhum
    // e ninguém descobre, porque o sintoma é um redirecionamento silencioso de
    // volta para a loja.
    console.error('[indicacao] produto com link inválido:', produto.id);
    return paraALoja();
  }

  // A medição vem ANTES do encaminhamento, mas não o bloqueia: se a escrita
  // falhar, o visitante ainda vai para a loja do parceiro. Perder um clique da
  // contagem é barato; travar a compra dele porque o nosso contador falhou,
  // não. É best-effort declarado, não descuido — daí o log.
  const { error: erroDoClique } = await db
    .from('cliques_de_indicacao')
    .insert({ produto_id: produto.id });

  if (erroDoClique) {
    console.warn('[indicacao] clique não registrado:', produto.id, erroDoClique.message);
  }

  return Response.redirect(produto.link_externo, 302);
});
