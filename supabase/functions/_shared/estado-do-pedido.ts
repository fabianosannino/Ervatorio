// ============================================================
// O estado do pedido sai dos fatos, não da coluna
// ============================================================
//
// ## O defeito que isto desfaz
//
// `orders.status` era sobrescrito por três caminhos independentes —
// `create-order`, `mp-webhook` e o `update` direto de `js/admin-orders.js`, que
// roda no NAVEGADOR. Nenhum deles sabia o que os outros tinham escrito, e a
// coluna só guardava o último.
//
// A idempotência do webhook era feita à mão:
//
//     if (order.status === newStatus) return noop
//
// E ela não cobre o caso que importa. Um `paid` atrasado do Mercado Pago —
// reentrega depois de instabilidade, notificação duplicada, redelivery no
// painel do gateway — que chega DEPOIS de um `refunded`: os dois valores são
// diferentes, o noop não pega, e o pedido volta a «pago» com o dinheiro já
// devolvido.
//
// ## A régua
//
// A ordem abaixo é de IRREVERSIBILIDADE, não cronológica. O estado corrente é o
// MAIOR já alcançado, e é isso que faz entrega fora de ordem deixar de
// corromper — sem ninguém precisar garantir a ordem, e sem trava de
// deduplicação em escritor nenhum.
//
// A mesma lista existe em `estados_do_pedido()` no banco (migration
// 20260816140000). Duas cópias de uma regra divergem com o tempo, e a que
// diverge para o lado permissivo é a que fica valendo — por isso o teste SQL
// compara as duas.

/** Do mais fraco ao mais forte. Índice = precedência. */
export const ESTADOS_DO_PEDIDO = [
  "pending",
  // Logo acima de `pending`: é a falha do pagamento, e um pagamento posterior
  // que dê certo deve passar por cima dela.
  "failed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  // Os dois no topo: desfecho negativo que chega atrasado deve prevalecer. É o
  // erro barato — um pedido cancelado que aparece como entregue faz despachar
  // mercadoria; um entregue que aparece como cancelado faz alguém conferir.
  "cancelled",
  "refunded",
] as const;

export type EstadoDoPedido = (typeof ESTADOS_DO_PEDIDO)[number];

export type FatoDoPedido = { estado: string };

function forca(estado: string): number {
  return (ESTADOS_DO_PEDIDO as readonly string[]).indexOf(estado);
}

/**
 * O estado corrente: o maior já alcançado.
 *
 * Sem fato nenhum devolve `pending`. Lista vazia significa **leitura
 * incompleta**, não pedido novo — e `pending` é o único estado que não afirma
 * nada sobre dinheiro. Errar para ele faz alguém conferir; errar para `paid`
 * faz despachar sem ter recebido.
 *
 * Estado que a régua não conhece é descartado em vez de derrubar o cálculo: é
 * o que acontece com uma versão antiga da função lendo um estado que a nova
 * gravou, durante um deploy.
 */
export function estadoDoPedido(fatos: readonly FatoDoPedido[]): EstadoDoPedido {
  let melhor: EstadoDoPedido = "pending";

  for (const fato of fatos) {
    if (forca(fato.estado) > forca(melhor)) melhor = fato.estado as EstadoDoPedido;
  }

  return melhor;
}

/**
 * Este fato muda alguma coisa?
 *
 * Usado pelo webhook para decidir se vale disparar e-mail e devolver estoque —
 * as duas coisas que **não** são idempotentes por si. Gravar o fato é sempre
 * seguro (a precedência o ignora se for menor); mandar o e-mail duas vezes,
 * não.
 */
export function fatoAvanca(atual: string, novo: string): boolean {
  return forca(novo) > forca(atual);
}

/**
 * A data que o gateway informou, quando ela é utilizável.
 *
 * O que chega é texto do provedor, e pode vir ausente, nulo ou malformado.
 * `new Date("lixo")` não lança: produz `Invalid Date`, que vira `null` no
 * banco ou `NaN` em qualquer conta adiante — e o sintoma aparece longe da
 * causa.
 *
 * Data no futuro também é recusada: é relógio errado de alguém, e aceitar uma
 * contaminaria o extrato. A folga de cinco minutos cobre a diferença normal
 * entre servidores.
 */
export function dataDoGateway(bruta: unknown): string | undefined {
  if (typeof bruta !== "string") return undefined;
  const data = new Date(bruta);
  if (Number.isNaN(data.getTime())) return undefined;
  if (data.getTime() > Date.now() + 5 * 60 * 1000) return undefined;
  return data.toISOString();
}
