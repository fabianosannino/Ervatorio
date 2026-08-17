# Congelar o Mercado Pago — decisão de 17/08

**Decisão do dono:** o pagamento do Ervatório será **Stripe**. O Mercado Pago
não é prioridade e não recebe mais desenvolvimento.

Este documento diz o que fazer com o código que existe, e por que a resposta
não é apagá-lo nem deixá-lo «pronto».

---

## A pergunta que foi feita

Três opções estavam na mesa: **zerar** o MP, **parar** o desenvolvimento, ou
**deixá-lo pronto**.

**Zerar é caro e não paga nada.** São três funções (`create-order`,
`create-payment-preference`, `mp-webhook`), um módulo compartilhado
(`_shared/mercadopago.ts`) e dois runbooks. Remover tudo é trabalho de horas
cujo único benefício seria menos código para ler — e desfazer, se a decisão
mudar, é reescrever. Ninguém paga tarifa por código parado.

**Deixá-lo «pronto» é o pior dos três**, e por um motivo aprendido esta semana
no FengShui Studio: «pronto, faltando só o teste de sandbox» é exatamente o
estado que mantém um item em toda lista de pendências, para sempre, sendo
cobrado de quem não vai fazê-lo. A dívida de assinatura HMAC está nesse estado
desde 16/07 — «aguardando validação em sandbox» —, e o passo que falta é um
clique num painel que a decisão de hoje torna inútil.

**Congelar** é o que fica: o código permanece, a dívida fecha, e o estado é
declarado para que ninguém o reabra por engano.

---

## O que fica congelado

- As três funções e o módulo compartilhado **permanecem no repositório**, como
  estão. Não são apagados.
- **`payments_enabled` continua desligado.** Conferido em 17/08 na produção:
  `site_settings.payments_enabled = false` desde 02/08. Nenhum dinheiro passa
  pelo MP hoje e nenhum passará.
- **A dívida de `WEBHOOK_SIGNATURE_DEBT.md` fecha como *não será corrigida
  enquanto congelado*.** As 34 variantes de manifest testadas, as hipóteses não
  eliminadas e as quatro camadas de mitigação continuam registradas lá — o valor
  daquele documento é o diagnóstico, e ele não perde validade. O que muda é que
  ele deixa de pedir uma ação.
- **Ninguém precisa disparar «Simular notificação» no sandbox.** Era o único
  passo pendente, e existia para descobrir qual variante de assinatura o MP usa.
  Sem MP, não há variante a fixar.

**Para reabrir**, basta uma coisa: a decisão de usar o MP voltar. Aí o roteiro é
o que já está escrito no `WEBHOOK_SIGNATURE_DEBT.md`, do ponto onde parou.

---

## O caminho da Stripe, quando for a hora

Não é este PR e não é para agora. Fica registrado porque a informação útil se
perde: **a Veridia já resolveu exatamente este problema**, e a solução é
portável.

- `lib/cobranca/assinatura-do-evento.ts` — conferência de assinatura da Stripe,
  HMAC-SHA256 sobre `timestamp.payload`, sem SDK. Documentada e testada.
- `lib/loja/stripe.ts` — chamada à API por `fetch` form-encoded, sem SDK, com
  `import "server-only"`. `npm audit` continua em zero.

A diferença que importa para quem viveu a dívida do MP: **a Stripe documenta o
que assina** — `timestamp` e corpo bruto, concatenados com ponto. Não há 34
variantes a adivinhar. Foi por isso que a Veridia saiu do zero e chegou a
webhook conferido sem nenhum episódio parecido.

Os pontos que precisam de decisão quando o porte acontecer, e que não são
mecânicos: quem escreve `pago` (na Veridia é **só** o webhook, nunca a tela de
sucesso), e o que fazer com `create-payment-preference`, que é conceito de MP
sem equivalente direto — na Stripe o análogo é a Checkout Session.

---

## O que é mais urgente que isto

Ao conferir o estado para escrever este documento, apareceu algo maior:
**a produção do Ervatório está atrás do repositório.**

| | repositório | produção |
|---|---|---|
| migrações | até `20260816140000` | até `20260802032253` |
| Edge Functions | 16/08 | **27/07** |

Quatro migrações estão no repositório e **não** foram aplicadas:

| migração | o que não está no ar |
|---|---|
| `20260815220000` | RBAC por capacidade — `admin_capabilities` e `tem_capacidade` |
| `20260815230000` | interruptores — e a tabela `interruptores` de fato não existe |
| `20260816120000` | indicação, `modo_de_venda` e `cliques_de_indicacao` |
| `20260816140000` | `pedido_eventos` *append-only* e a projeção de `status` |

**Isso não é urgência de incidente**: as proteções antigas continuam valendo, e
com pagamento desligado não há dinheiro em risco. Mas significa que quem hoje
tem `is_admin` no Ervatório tem **tudo** — a separação entre despachar pedido e
apagar a base de usuários existe no repositório e não no banco. É a mesma
diferença que o FengShui e a Solarisis já têm aplicada, e o Ervatório não.

**E nada disso depende do Mercado Pago.** Aplicar as quatro migrações e
reimplantar as funções é trabalho de pagamento nenhum: é a segurança do painel
e a integridade do pedido, que valem com Stripe, com MP ou sem pagamento algum.

Ordem sugerida, se for para fazer: `20260815220000` primeiro (é a que fecha o
privilégio), depois as outras três em ordem numérica. Cada uma tem teste em
`supabase/tests/`, e eles aplicam a migração num Postgres descartável antes de
tocar em produção.
