/**
 * Referências de nome falado e gênero gramatical de cada conselheiro
 * para montagem natural das falas cruzadas no servidor.
 */
export const CONSELHEIROS_REFERENCIA = {
  1: { nome: 'Sapo', genero: 'm' },
  2: { nome: 'Ramon', genero: 'm' },
  3: { nome: 'Vanessa', genero: 'f' },
  4: { nome: 'Jhonny', genero: 'm' },
  5: { nome: 'Juarez', genero: 'm' },
  6: { nome: 'Ricardo', genero: 'm' },
  7: { nome: 'Ed', genero: 'm' },
}

/**
 * Variações educativas/positivas de aprovação por conselheiro (mantidas exclusivamente no backend
 * para nunca vazar o gabarito no bundle do frontend).
 */
export const VARIACOES_APROVACAO_POR_MEMBRO = {
  1: {
    padrao: [
      'Resposta exata! Temos 3 unidades físicas: Bacacheri, Alphaville e Araucária. Sendo assim, você tem o meu voto de aprovação.',
      'Acertou em cheio! Bacacheri, Alphaville e Araucária — nossas 3 casas. Por mim, está aprovado!',
    ],
    primeiraTentativa:
      'Nem piscou! Exatamente 3 unidades: Bacacheri, Alphaville e Araucária. Aprovadíssimo!',
  },
  2: {
    padrao: [
      'Excelente! Energia para transformar é um dos nossos valores essenciais — junto com velocidade com precisão, compromisso total com o cliente, pessoas que fazem a diferença, tecnologia como alicerce e foco na solução, e não no problema. Definitivamente aprovado!',
      'Mandou muito bem! Energia para transformar está no nosso DNA, ao lado de velocidade com precisão, compromisso total com o cliente, pessoas que fazem a diferença, tecnologia como alicerce e foco na solução. Aprovado!',
    ],
    primeiraTentativa:
      'Na ponta da língua mesmo! Energia para transformar resume o nosso jeito de trabalhar — sempre com precisão, tecnologia, foco na solução e compromisso total com o cliente. Aprovado!',
  },
  3: {
    padrao: [
      'Isso mesmo! Ser Next é gerar mais resultados todos os dias. Você tem a minha aprovação — te espero na próxima reunião do Conexão Next!',
      'Sabia que você acertaria! Ser Next é exatamente isso: gerar mais resultados de verdade. Aprovado, nos vemos no próximo Conexão Next!',
    ],
    primeiraTentativa:
      'Que segurança! Gerar mais resultados é a essência de ser Next. Meu voto é seu — até o próximo Conexão Next!',
  },
  4: {
    padrao: [
      'Acertou! O Dia da Pizza é tradição garantida na última quarta-feira do mês. Aprovado, seguimos crescendo juntos!',
      'Essa ninguém esquece, né? Dia da Pizza na última quarta-feira do mês é sagrado por aqui. Aprovado — seguimos crescendo juntos!',
    ],
    primeiraTentativa:
      'Na lata! Chegou a última quarta-feira do mês, já sabe: é Dia da Pizza! Tem o meu voto, seguimos crescendo juntos!',
  },
  5: {
    padrao: [
      'Pontofopag confirmado! Registro em dia é um compromisso essencial — e lembre-se de ficar sempre DE OLHO NO PONTO!! Meu voto é favorável!',
      'Isso aí, Pontofopag! Quem não esquece o sistema também não esquece de registrar a jornada, né? Fica sempre DE OLHO NO PONTO!! Aprovado!',
    ],
    primeiraTentativa:
      'Certíssimo! Pontofopag na ponta da língua. Continua assim, sempre DE OLHO NO PONTO!! Aprovado!',
  },
  6: {
    padrao: [
      'Exato! O CIGAM é a nossa referência como o melhor ERP do mercado. Ele funciona como o "cérebro" da empresa, reunindo e organizando em um só lugar todos os setores. Dou minha aprovação!',
      'Resposta de quem entende! O CIGAM é o "cérebro" que conecta e organiza toda a operação da empresa. Aprovado sem erro de sistema!',
    ],
    primeiraTentativa:
      'Zero bugs! CIGAM na cabeça — literalmente o "cérebro" da gestão corporativa, integrando todos os setores. Aprovado!',
  },
  7: {
    padrao: [
      'Exatamente isso! O dress code da Falavinha Next é o Social! Você tem a minha aprovação no Conselho — e lembre-se de sempre praticar o ECS!',
      'Impecável! Padrão Social na veia, como manda o PEAH. Aprovado no Conselho — e nunca deixe de praticar o ECS!',
    ],
    primeiraTentativa:
      'Elegante e certeiro! Dress code Social confirmado. Meu voto é seu — continue sempre praticando o ECS!',
  },
}

export const FALAS_CRUZADAS_APROVACAO_APROVADOS = [
  'Agora entendi por que {o_a} {nome} te aprovou! Mandou muito bem!',
  '{O_A} {nome} tinha razão: você realmente veio preparado. Aprovado!',
  'Passou {pelo_pela} {nome} e agora passou por mim também. Tá voando!',
  'Primeiro {o_a} {nome}, agora eu... desse jeito você fecha o Conselho rapidinho!',
  'Não é à toa que {o_a} {nome} já te deu o voto. Mandou bem demais!',
]

export const FALAS_CRUZADAS_APROVACAO_PENDENTES = [
  'Comigo foi tranquilo — quero ver manter esse ritmo com {o_a} {nome}!',
  'Meu voto está garantido! Agora vai lá mostrar esse mesmo preparo {pro_pra} {nome}.',
  'Aprovado! Já vou avisar {o_a} {nome} que você está chegando com tudo.',
]

function sortearItem(lista, rng = Math.random) {
  if (!Array.isArray(lista) || lista.length === 0) return null
  const idx = Math.floor(rng() * lista.length)
  return lista[Math.min(idx, lista.length - 1)]
}

export function formatarFalaComReferencia(template, ref) {
  if (!template || !ref) return template || ''
  const isFem = ref.genero === 'f'
  return template
    .replaceAll('{o_a}', isFem ? 'a' : 'o')
    .replaceAll('{O_A}', isFem ? 'A' : 'O')
    .replaceAll('{pelo_pela}', isFem ? 'pela' : 'pelo')
    .replaceAll('{do_da}', isFem ? 'da' : 'do')
    .replaceAll('{pro_pra}', isFem ? 'pra' : 'pro')
    .replaceAll('{nome}', ref.nome)
}

/**
 * Seleciona dinamicamente a mensagem de aprovação exibida após o acerto:
 * - Alterna entre uma das variações educativas do próprio conselheiro (~60%)
 *   ou uma fala cruzada positiva referenciando outro conselheiro real da partida (~40%).
 */
export function selecionarMensagemAprovacao({
  membroId,
  mensagemPadrao = '',
  acertouDePrimeira = false,
  membrosJaAprovados = [],
  membrosRestantes = [],
  rng = Math.random,
}) {
  const aprovadosValidos = membrosJaAprovados
    .map(Number)
    .filter((id) => id !== membroId && Boolean(CONSELHEIROS_REFERENCIA[id]))
  const restantesValidos = membrosRestantes
    .map(Number)
    .filter((id) => id !== membroId && Boolean(CONSELHEIROS_REFERENCIA[id]))

  const podeUsarCruzada = aprovadosValidos.length > 0 || restantesValidos.length > 0

  if (podeUsarCruzada && rng() < 0.4) {
    const usarAprovados =
      aprovadosValidos.length > 0 && (restantesValidos.length === 0 || rng() < 0.65)

    const alvoId = usarAprovados
      ? sortearItem(aprovadosValidos, rng)
      : sortearItem(restantesValidos, rng)
    const template = usarAprovados
      ? sortearItem(FALAS_CRUZADAS_APROVACAO_APROVADOS, rng)
      : sortearItem(FALAS_CRUZADAS_APROVACAO_PENDENTES, rng)

    if (alvoId && template) {
      return formatarFalaComReferencia(template, CONSELHEIROS_REFERENCIA[alvoId])
    }
  }

  const config = VARIACOES_APROVACAO_POR_MEMBRO[membroId]
  if (config) {
    const pool = [...config.padrao]
    if (acertouDePrimeira && config.primeiraTentativa) {
      pool.push(config.primeiraTentativa)
    }
    const escolhida = sortearItem(pool, rng)
    if (escolhida) return escolhida
  }

  return mensagemPadrao || 'Você tem o meu voto de aprovação no Conselho Next!'
}
