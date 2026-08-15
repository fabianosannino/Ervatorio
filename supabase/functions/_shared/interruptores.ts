// ============================================================
// Interruptores — a conferência do lado do servidor
// ============================================================
// O Ervatório já tinha um interruptor de pagamentos, e ele valia **só no
// navegador**: `js/checkout.js` lê `window.SITE_SETTINGS.payments_enabled` e
// nenhuma Edge Function conferia. Quem virasse a variável no devtools chamava
// `create-order` e `create-payment-preference` do mesmo jeito.
//
// É a mesma forma do MFA que só existia no cliente — um gate do lado de quem
// está sendo checado. Aqui a pergunta é feita ao banco, pelo servidor.
//
// A tela em js/admin.js continua existindo e continua útil: ela esconde o que
// não adianta clicar. Mas quem recusa é isto.
import { adminClient } from './auth.ts';
import { jsonResponse } from './cors.ts';

/**
 * O interruptor está ligado?
 *
 * Falha FECHADA: se a consulta não responde, devolvemos `false`. O modo de
 * falha importa — uma instabilidade do banco não pode virar "pode cobrar".
 * É o oposto da escolha que o admin do Ervatório fez com o MFA, onde o
 * `catch` devolvia `true` e qualquer erro abria o painel.
 */
export async function interruptorLigado(chave: string): Promise<boolean> {
  try {
    const { data, error } = await adminClient()
      .from('interruptores')
      .select('ligado')
      .eq('chave', chave)
      .maybeSingle();

    if (error) {
      console.error('[interruptores] consulta falhou, fechando:', chave, error.message);
      return false;
    }
    return data?.ligado === true;
  } catch (e) {
    console.error('[interruptores] erro ao consultar, fechando:', chave, e);
    return false;
  }
}

/**
 * Recusa a requisição quando a capacidade está desligada.
 *
 * Devolve a `Response` pronta, ou `null` quando pode seguir — a mesma forma de
 * `handleCors`, para que a rota fique com um `if` só.
 *
 * O 503 é deliberado: não é erro de quem chamou (400) nem falta de permissão
 * (403). A capacidade existe e está temporariamente fora do ar por decisão de
 * quem opera a loja, e é isso que o status diz.
 */
export async function exigirLigado(chave: string): Promise<Response | null> {
  if (await interruptorLigado(chave)) return null;
  return jsonResponse(
    { error: 'Esta operação está temporariamente indisponível.', capacidade: chave },
    503
  );
}
