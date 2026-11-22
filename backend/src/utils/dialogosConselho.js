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

/**
 * Prefixos curtos acoplados ANTES da fala educativa quando o conselheiro comenta
 * alguém que já aprovou o jogador (Caminho A: 100% do conteúdo educativo preservado).
 */
export const PREFIXOS_CRUZADOS_APROVACAO_APROVADOS = [
  'Agora entendi por que {o_a} {nome} te aprovou!',
  '{O_A} {nome} tinha razão: você veio preparado!',
  'Passou {pelo_pela} {nome} e agora passou por mim também!',
  'Não é à toa que {o_a} {nome} já te deu o voto!',
]

/**
 * Sufixos curtos acoplados DEPOIS da fala educativa quando o conselheiro provoca
 * sobre alguém que ainda falta enfrentar (Caminho A: 100% do conteúdo educativo preservado).
 */
export const SUFIXOS_CRUZADOS_APROVACAO_PENDENTES = [
  'Quero ver manter esse ritmo com {o_a} {nome}!',
  'Agora vai mostrar esse mesmo preparo {pro_pra} {nome}!',
  'Já vou avisar {o_a} {nome} que você está chegando com tudo!',
]

// Aliases mantidos para compatibilidade de imports
export const FALAS_CRUZADAS_APROVACAO_APROVADOS = PREFIXOS_CRUZADOS_APROVACAO_APROVADOS
export const FALAS_CRUZADAS_APROVACAO_PENDENTES = SUFIXOS_CRUZADOS_APROVACAO_PENDENTES

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
 * Escolhe o conselheiro alvo de uma fala cruzada em estilo "baralho sem reposição":
 * - Prioriza exclusivamente conselheiros que ainda não foram citados na partida.
 * - Quando todos os disponíveis já foram citados, reinicia o ciclo evitando repetir o último citado.
 * - Balanceia proporcionalmente entre aprovados e pendentes para não concentrar tudo no 1º aprovado.
 */
function escolherAlvoCruzado({
  aprovadosValidos = [],
  restantesValidos = [],
  membrosJaCitados = [],
  rng = Math.random,
}) {
  const citadosLimpos = Array.isArray(membrosJaCitados)
    ? membrosJaCitados.map(Number).filter((id) => Boolean(CONSELHEIROS_REFERENCIA[id]))
    : []
  const citadosSet = new Set(citadosLimpos)
  const ultimoCitadoId = citadosLimpos.length > 0 ? citadosLimpos[citadosLimpos.length - 1] : null

  const aprovadosIneditos = aprovadosValidos.filter((id) => !citadosSet.has(id))
  const restantesIneditos = restantesValidos.filter((id) => !citadosSet.has(id))

  let poolAprovados = aprovadosIneditos
  let poolRestantes = restantesIneditos

  if (poolAprovados.length === 0 && poolRestantes.length === 0) {
    const aprovadosSemUltimo = aprovadosValidos.filter((id) => id !== ultimoCitadoId)
    const restantesSemUltimo = restantesValidos.filter((id) => id !== ultimoCitadoId)

    if (aprovadosSemUltimo.length > 0 || restantesSemUltimo.length > 0) {
      poolAprovados = aprovadosSemUltimo
      poolRestantes = restantesSemUltimo
    } else {
      poolAprovados = aprovadosValidos
      poolRestantes = restantesValidos
    }
  }

  if (poolAprovados.length === 0 && poolRestantes.length === 0) {
    return null
  }

  let usarAprovados = false
  if (poolAprovados.length > 0 && poolRestantes.length === 0) {
    usarAprovados = true
  } else if (poolAprovados.length > 0 && poolRestantes.length > 0) {
    const pesoAprovados = poolAprovados.length * 1.25
    const pesoRestantes = poolRestantes.length
    usarAprovados = rng() < pesoAprovados / (pesoAprovados + pesoRestantes)
  }

  const alvoId = usarAprovados
    ? sortearItem(poolAprovados, rng)
    : sortearItem(poolRestantes, rng)

  if (!alvoId) return null
  return {
    alvoId,
    tipo: usarAprovados ? 'aprovado' : 'pendente',
  }
}

/**
 * Gera a mensagem de aprovação (Caminho A):
 * - 100% das aprovações preservam a variação educativa do próprio conselheiro.
 * - Em uma minoria das aprovações (~25%, respeitando `evitarCruzada`), acopla um
 *   prefixo/sufixo cruzado curto citando um conselheiro ainda não mencionado na partida.
 */
export function gerarMensagemAprovacao({
  membroId,
  mensagemPadrao = '',
  acertouDePrimeira = false,
  membrosJaAprovados = [],
  membrosRestantes = [],
  membrosJaCitados = [],
  evitarCruzada = false,
  rng = Math.random,
}) {
  const config = VARIACOES_APROVACAO_POR_MEMBRO[membroId]
  let mensagemEducacional = mensagemPadrao || 'Você tem o meu voto de aprovação no Conselho Next!'

  if (config) {
    const pool = [...config.padrao]
    if (acertouDePrimeira && config.primeiraTentativa) {
      pool.push(config.primeiraTentativa)
    }
    const escolhida = sortearItem(pool, rng)
    if (escolhida) {
      mensagemEducacional = escolhida
    }
  }

  if (evitarCruzada) {
    return {
      mensagem: mensagemEducacional,
      citouMembroId: null,
      usouCruzada: false,
    }
  }

  const aprovadosValidos = Array.from(
    new Set(
      membrosJaAprovados
        .map(Number)
        .filter((id) => id !== membroId && Boolean(CONSELHEIROS_REFERENCIA[id]))
    )
  )
  const restantesValidos = Array.from(
    new Set(
      membrosRestantes
        .map(Number)
        .filter((id) => id !== membroId && Boolean(CONSELHEIROS_REFERENCIA[id]))
    )
  )

  const podeUsarCruzada = aprovadosValidos.length > 0 || restantesValidos.length > 0

  if (podeUsarCruzada && rng() < 0.25) {
    const escolha = escolherAlvoCruzado({
      aprovadosValidos,
      restantesValidos,
      membrosJaCitados,
      rng,
    })

    if (escolha) {
      const ref = CONSELHEIROS_REFERENCIA[escolha.alvoId]
      const template =
        escolha.tipo === 'aprovado'
          ? sortearItem(PREFIXOS_CRUZADOS_APROVACAO_APROVADOS, rng)
          : sortearItem(SUFIXOS_CRUZADOS_APROVACAO_PENDENTES, rng)

      if (ref && template) {
        const trechoCruzado = formatarFalaComReferencia(template, ref)
        const mensagemCombinada =
          escolha.tipo === 'aprovado'
            ? `${trechoCruzado} ${mensagemEducacional}`
            : `${mensagemEducacional} ${trechoCruzado}`

        return {
          mensagem: mensagemCombinada,
          citouMembroId: escolha.alvoId,
          usouCruzada: true,
        }
      }
    }
  }

  return {
    mensagem: mensagemEducacional,
    citouMembroId: null,
    usouCruzada: false,
  }
}

/**
 * Wrapper simples que retorna apenas o texto final da mensagem de aprovação.
 */
export function selecionarMensagemAprovacao(params) {
  return gerarMensagemAprovacao(params).mensagem
}
