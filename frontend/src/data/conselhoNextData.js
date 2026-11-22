import quadrinho1Img from '../assets/quadrinhos/quadrinho-1.jpg'
import quadrinho2Img from '../assets/quadrinhos/quadrinho-2.jpg'
import quadrinho3Img from '../assets/quadrinhos/quadrinho-3.jpg'

/**
 * Referências de nome falado e gênero gramatical de cada conselheiro
 * para montagem natural das falas cruzadas no Tribunal.
 */
export const COUNCIL_SPEAKER_REFS = {
  1: { nome: 'Sapo', genero: 'm' },
  2: { nome: 'Ramon', genero: 'm' },
  3: { nome: 'Vanessa', genero: 'f' },
  4: { nome: 'Jhonny', genero: 'm' },
  5: { nome: 'Juarez', genero: 'm' },
  6: { nome: 'Ricardo', genero: 'm' },
  7: { nome: 'Ed', genero: 'm' },
}

/**
 * Falas personalizadas de erro para cada um dos 7 conselheiros:
 * - error1: 1º erro no ciclo
 * - error2: 2º erro no ciclo
 * - blocked: 3º erro no ciclo (reprovação + bloqueio de 20s)
 */
export const MEMBER_ERROR_DIALOGUES = {
  1: {
    error1:
      'Opa, passou longe! Puxa aí na memória onde a Falavinha está presente e tenta de novo.',
    error2:
      'Ainda não, hein... Pensa bem nos nossos endereços físicos. Última chance antes de eu fechar a porta!',
    blocked:
      'Aí não dá, né? Dá uma volta pelo Tribunal, respira fundo e volta aqui daqui a 20 segundos!',
  },
  2: {
    error1:
      'Hmm, essa não bate com a nossa cultura. Releia com calma e pense no que realmente nos move aqui dentro.',
    error2:
      'Ainda não é essa... Foco na solução, não no chute! Mais um erro e você vai precisar de uma pausa.',
    blocked:
      'Poxa, assim fica difícil defender! Vou te dar 20 segundos para repensar nossos pilares antes de tentar de novo.',
  },
  3: {
    error1:
      'Calma, não é bem por aí! Respira e pensa no propósito que a gente vive no dia a dia. Você sabe essa!',
    error2:
      'Ainda não! Eu confio em você, mas olha bem as opções — mais um erro e vou ter que pausar a sua tentativa.',
    blocked:
      'Ai, doeu em mim, mas tive que reprovar! Dá uma espairecida de 20 segundos e volta com tudo, combinado?',
  },
  4: {
    error1:
      'Eita, tá faltando aparecer nas integrações, hein? Pensa bem no evento que fecha todo mês com a equipe!',
    error2:
      'Ainda não! Como assim você esqueceu desse clássico da última quarta-feira do mês? Cuidado com o 3º erro!',
    blocked:
      'Reprovado! Vai ficar 20 segundos pensando no que anda perdendo na última semana do mês... Depois volta aqui!',
  },
  5: {
    error1:
      'Opa, deu divergência no espelho aí! Esse não é o nosso sistema de ponto. Tenta de novo!',
    error2:
      'De novo não! Tô começando a achar que você anda esquecendo de bater o ponto... Atenção máxima na próxima!',
    blocked:
      'Bateu errado pela terceira vez! Bloqueio de 20 segundos — aproveita para ficar DE OLHO NO PONTO!!',
  },
  6: {
    error1:
      'Erro 404 nessa resposta! Esse aí não é o nosso ERP. Dá uma revisada e manda de novo.',
    error2:
      'Travou o sistema? Ainda não é esse! Pensa na ferramenta que conecta todos os setores. Próximo erro dá tela azul!',
    blocked:
      'Sistema indisponível por 20 segundos! Aproveita o reboot para lembrar qual é o melhor ERP do mercado.',
  },
  7: {
    error1:
      'Hmm, esse visual não passa na recepção, não! Lembra das lições do PEAH e tenta novamente.',
    error2:
      'Ainda fora do padrão! Olha a seriedade da nossa imagem — mais um deslize e você vai precisar de um tempo para ajustar o look!',
    blocked:
      'Reprovado no quesito apresentação! 20 segundos fora da sala para revisar o PEAH e praticar o ECS antes de voltar.',
  },
}

/**
 * Falas cruzadas de erro citando um conselheiro que JÁ aprovou o jogador na partida.
 */
export const CROSS_TALK_ERROR_APPROVED = [
  'Como é que {o_a} {nome} deixou você passar?! Tenta de novo!',
  'Impossível você ter sido aprovado {pelo_pela} {nome} respondendo isso...',
  'Vou ter que chamar {o_a} {nome} aqui para perguntar que prova fácil foi essa que você fez lá!',
  'Sério isso? {O_A} {nome} te aprovou e você escorrega logo na minha cadeira?',
  'Acho que {o_a} {nome} pegou leve demais com você, hein... Presta mais atenção!',
  'Se {o_a} {nome} visse essa resposta agora, ia pedir o voto de volta na hora!',
]

export const CROSS_TALK_BLOCKED_APPROVED =
  'Não acredito que {o_a} {nome} te deu o voto! Vai descansar 20 segundos e volta mais ligado.'

/**
 * Falas cruzadas de erro citando um conselheiro que AINDA falta enfrentar.
 */
export const CROSS_TALK_ERROR_PENDING = [
  'Se já está suando aqui, imagina quando sentar na frente {do_da} {nome}...',
  'Desse jeito {o_a} {nome} nem vai deixar você terminar a frase! Concentra!',
  'Olha o tempo correndo... Você ainda precisa encarar {o_a} {nome}, então foca aqui!',
]

/**
 * Falas cruzadas opcionais de saudação ao abrir uma cadeira.
 */
export const CROSS_TALK_GREETING_APPROVED = [
  'Vi que você já garantiu o voto {do_da} {nome}... vamos ver se aqui vai ser fácil assim!',
  'Fiquei sabendo que você se saiu bem com {o_a} {nome}. Quero ver agora na minha área!',
]

export const FINAL_MEMBER_GREETING =
  'Só falto eu para fechar o Conselho! Não vai escorregar logo na linha de chegada, né?'

/**
 * Fallback genérico de falas de erro (caso um membroId não esteja mapeado).
 */
export const ERROR_DIALOGUES = [
  'Vamos tentar de novo, preste mais atenção.',
  'Ainda não é isso. Pense nos nossos processos.',
  'Você está chutando? Lembre-se que o tempo e as penalidades estão correndo!',
  'Concentre-se! Você consegue fazer melhor que isso.',
  'Atenção máxima antes de responder novamente!',
]

function pickRandom(list) {
  if (!Array.isArray(list) || list.length === 0) return null
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * Escolhe o conselheiro alvo de uma fala cruzada em estilo "baralho sem reposição":
 * - Prioriza exclusivamente conselheiros que ainda não foram citados na partida.
 * - Reinicia o ciclo quando todos já apareceram, evitando repetir o último citado.
 * - Balanceia proporcionalmente entre aprovados e pendentes para não repetir sempre o 1º aprovado.
 */
function pickCrossTalkTarget({
  othersCompleted = [],
  othersRemaining = [],
  citedMemberIds = [],
}) {
  const cleanCited = Array.isArray(citedMemberIds)
    ? citedMemberIds.map(Number).filter((id) => Boolean(COUNCIL_SPEAKER_REFS[id]))
    : []
  const citedSet = new Set(cleanCited)
  const lastCitedId = cleanCited.length > 0 ? cleanCited[cleanCited.length - 1] : null

  const unmentionedCompleted = othersCompleted.filter((id) => !citedSet.has(id))
  const unmentionedRemaining = othersRemaining.filter((id) => !citedSet.has(id))

  let poolCompleted = unmentionedCompleted
  let poolRemaining = unmentionedRemaining

  if (poolCompleted.length === 0 && poolRemaining.length === 0) {
    const completedNoLast = othersCompleted.filter((id) => id !== lastCitedId)
    const remainingNoLast = othersRemaining.filter((id) => id !== lastCitedId)
    if (completedNoLast.length > 0 || remainingNoLast.length > 0) {
      poolCompleted = completedNoLast
      poolRemaining = remainingNoLast
    } else {
      poolCompleted = othersCompleted
      poolRemaining = othersRemaining
    }
  }

  if (poolCompleted.length === 0 && poolRemaining.length === 0) {
    return null
  }

  let useApproved = false
  if (poolCompleted.length > 0 && poolRemaining.length === 0) {
    useApproved = true
  } else if (poolCompleted.length > 0 && poolRemaining.length > 0) {
    const approvedWeight = poolCompleted.length * 1.25
    const remainingWeight = poolRemaining.length
    useApproved = Math.random() < approvedWeight / (approvedWeight + remainingWeight)
  }

  const refId = useApproved ? pickRandom(poolCompleted) : pickRandom(poolRemaining)
  if (!refId) return null

  return { refId, useApproved }
}

/**
 * Estima a duração da digitação do typewriter (speed = 22ms + pausas de pontuação).
 */
export function estimateSpeechTypingMs(text, speed = 22) {
  const normalized = String(text || '')
  let total = 0
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]
    const nextCh = normalized[i + 1]
    if (/[.!?]/.test(ch)) {
      total += nextCh && /[.!?]/.test(nextCh) ? speed * 1.4 : Math.max(speed * 10, 250)
    } else if (/[,;:—–]/.test(ch)) {
      total += Math.max(speed * 5, 125)
    } else {
      total += speed
    }
  }
  return Math.ceil(total)
}

export function formatCrossTalkSpeech(template, ref) {
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

export function getErrorDialogue(errorCount) {
  if (!errorCount || errorCount <= 0) return null
  const idx = Math.min(errorCount - 1, ERROR_DIALOGUES.length - 1)
  return ERROR_DIALOGUES[idx]
}

/**
 * Escolhe a saudação ao abrir um conselheiro:
 * - Se for o 7º e último conselheiro restante, dispara a frase especial de reta final.
 * - Se o jogador já passou por outros conselheiros e permitido, tem 15% de chance de abrir
 *   com fala cruzada citando preferencialmente alguém ainda não mencionado na partida.
 * - Caso contrário, exibe a saudação educacional oficial daquele conselheiro.
 */
export function pickOpeningGreeting({
  memberId,
  defaultGreeting = '',
  completedMemberIds = [],
  citedMemberIds = [],
  allowCrossTalk = true,
  totalMembers = 7,
}) {
  const othersCompleted = Array.from(
    new Set(
      completedMemberIds
        .map(Number)
        .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))
    )
  )

  if (totalMembers > 1 && othersCompleted.length >= totalMembers - 1) {
    return { text: FINAL_MEMBER_GREETING, citedMemberId: null, usedCrossTalk: false }
  }

  if (allowCrossTalk && othersCompleted.length > 0 && Math.random() < 0.15) {
    const target = pickCrossTalkTarget({
      othersCompleted,
      othersRemaining: [],
      citedMemberIds,
    })
    const template = pickRandom(CROSS_TALK_GREETING_APPROVED)
    if (target?.refId && template) {
      return {
        text: formatCrossTalkSpeech(template, COUNCIL_SPEAKER_REFS[target.refId]),
        citedMemberId: target.refId,
        usedCrossTalk: true,
      }
    }
  }

  return { text: defaultGreeting, citedMemberId: null, usedCrossTalk: false }
}

/**
 * Escolhe a fala de erro dinâmica do conselheiro:
 * - Prioriza as falas personalizadas/educativas do próprio conselheiro (~80%).
 * - Em uma minoria controlada (~20% quando permitido na cadeira), usa fala cruzada
 *   sem repetir o mesmo conselheiro em sequência.
 */
export function pickErrorDialogue({
  memberId,
  errorNumber = 1,
  isBlocked = false,
  completedMemberIds = [],
  remainingMemberIds = [],
  citedMemberIds = [],
  lastSpeech = '',
  allowCrossTalk = true,
}) {
  const othersCompleted = Array.from(
    new Set(
      completedMemberIds
        .map(Number)
        .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))
    )
  )
  const othersRemaining = Array.from(
    new Set(
      remainingMemberIds
        .map(Number)
        .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))
    )
  )

  const memberSet = MEMBER_ERROR_DIALOGUES[memberId]

  if (isBlocked) {
    if (allowCrossTalk && othersCompleted.length > 0 && Math.random() < 0.2) {
      const target = pickCrossTalkTarget({
        othersCompleted,
        othersRemaining: [],
        citedMemberIds,
      })
      if (target?.refId) {
        return {
          text: formatCrossTalkSpeech(
            CROSS_TALK_BLOCKED_APPROVED,
            COUNCIL_SPEAKER_REFS[target.refId]
          ),
          citedMemberId: target.refId,
          usedCrossTalk: true,
        }
      }
    }
    return {
      text: memberSet?.blocked || getErrorDialogue(3),
      citedMemberId: null,
      usedCrossTalk: false,
    }
  }

  const canCrossTalk =
    allowCrossTalk && (othersCompleted.length > 0 || othersRemaining.length > 0)

  if (canCrossTalk && Math.random() < 0.2) {
    const target = pickCrossTalkTarget({
      othersCompleted,
      othersRemaining,
      citedMemberIds,
    })

    if (target?.refId) {
      const templates = target.useApproved
        ? CROSS_TALK_ERROR_APPROVED
        : CROSS_TALK_ERROR_PENDING
      const candidates = templates
        .map((tpl) => formatCrossTalkSpeech(tpl, COUNCIL_SPEAKER_REFS[target.refId]))
        .filter((line) => line !== lastSpeech)

      const chosen = pickRandom(candidates.length > 0 ? candidates : templates)
      if (chosen) {
        return {
          text: chosen.includes('{')
            ? formatCrossTalkSpeech(chosen, COUNCIL_SPEAKER_REFS[target.refId])
            : chosen,
          citedMemberId: target.refId,
          usedCrossTalk: true,
        }
      }
    }
  }

  if (memberSet) {
    return {
      text: errorNumber >= 2 ? memberSet.error2 : memberSet.error1,
      citedMemberId: null,
      usedCrossTalk: false,
    }
  }

  return {
    text: getErrorDialogue(errorNumber),
    citedMemberId: null,
    usedCrossTalk: false,
  }
}

export const UNITS_LIST = [
  'Curitiba - Matriz',
  'Londrina',
  'Maringá',
  'Ponta Grossa',
  'Cascavel',
  'Remoto / Outra',
]

export const DEPARTMENTS_LIST = [
  'Tributário',
  'Contábil',
  'Financeiro',
  'Recursos Humanos',
  'TI / Inovação',
  'Comercial / Vendas',
  'Operações / Suporte',
  'Diretoria / Gestão',
]

export const COMIC_PANELS = [
  {
    id: 1,
    image: quadrinho1Img,
    step: 'CENA 01 · A SALA DA PRESIDÊNCIA',
    title: 'A Ideia do CEO',
    narration:
      'Na sua sala corporativa, o CEO observa os indicadores de final de ano e tem uma epifania...',
    speech:
      '“Precisamos de um exame prático e definitivo para avaliar nossos liderados sob pressão!”',
    layout: {
      narrationStyle: { top: '2.4%', left: '3%', width: '82%' },
      speechStyle: { bottom: '2.6%', left: '3%', width: '71%' },
      speechTail: 'top-right',
    },
  },
  {
    id: 2,
    image: quadrinho2Img,
    step: 'CENA 02 · A CONVOCAÇÃO',
    title: 'A Ligação Direta',
    narration:
      'Sem perder um segundo, ele aciona o ramal confidencial que conecta os 7 conselheiros da empresa.',
    speech:
      '“Convoquem os 7 conselheiros na Sala de Avaliação. Ninguém sai de lá sem conquistar os 7 selos da bancada.”',
    layout: {
      narrationStyle: { top: '2.2%', left: '3%', width: '82%' },
      speechStyle: { top: '14.8%', left: '12%', right: '12%' },
      speechTail: 'bottom-center',
    },
  },
  {
    id: 3,
    image: quadrinho3Img,
    step: 'CENA 03 · O CHAMADO',
    title: 'O Convite ao Conselho',
    narration:
      'O telefone desliga. O convite é disparado: você foi convidado para o Conselho Next.',
    speech:
      '“O cronômetro já está rodando. Vamos descobrir quem realmente conhece a Falavinha Next.”',
    layout: {
      narrationStyle: { top: '2.2%', left: '3%', width: '84%' },
      speechStyle: { bottom: '2.2%', left: '3%', right: '3%' },
      speechTail: 'none',
    },
  },
]

export const CEO_TRIBUNAL_BRIEFING = {
  name: 'Jhonny',
  title: 'CEO · Presidente do Conselho',
  message:
    'Seja bem-vindo ao Conselho Next! Logo adiante, estarão os 7 conselheiros que decidiram fazer parte dessa sua avaliação. Você poderá conversar com eles na ordem que preferir... mas não se engane: todos estarão de olho nas suas respostas, e isso vai decidir o seu futuro por aqui. Cada aprovação garante 1 selo oficial daquele conselheiro — e você só poderá sair do Conselho quando conquistar os 7 selos, avançando passo a passo no labirinto até alcançar a sala do cliente. O seu desempenho será medido pelo tempo total de prova — e, atenção, cada erro somará +5s ao relógio. Se errar 3 vezes na mesma cadeira, você levará +10s, precisará refazer a questão e aquele conselheiro só voltará a te receber depois de 20s. Mas calma, nem tudo é notícia ruim... Acertar 3 conselheiros seguidos de primeira garante -5s de bônus, e fechar o Conselho invicto rende mais -10s extras! Agora é por sua própria conta e risco: abra o labirinto e comece o desafio.',
}

/**
 * Veredito final do CEO na tela de encerramento, adaptado ao desempenho da jogada recém-concluída.
 */
export function getCeoFinalVerdict({ totalErrors = 0, playerName = '' } = {}) {
  const firstName = String(playerName || '').trim().split(/\s+/)[0]
  const greeting = firstName ? `${firstName}, ` : ''

  if (totalErrors === 0) {
    return {
      tier: 'invicto',
      badgeLabel: 'INVICTO · 7/7 DE PRIMEIRA',
      speech: `${greeting}impecável! Você passou pelos 7 conselheiros sem cometer um único erro e ainda garantiu o bônus invicto. Esse é exatamente o padrão de excelência que faz a Falavinha Next girar todos os dias!`,
    }
  }

  if (totalErrors <= 3) {
    return {
      tier: 'merito',
      badgeLabel: 'APROVADO COM MÉRITO',
      speech: `${greeting}muito bem! Mesmo sob a pressão do cronômetro, você manteve o foco, corrigiu a rota rápido e conquistou os 7 selos com segurança. Belo desempenho diante do Conselho Next!`,
    }
  }

  return {
    tier: 'limite',
    badgeLabel: 'APROVADO NO LIMITE',
    speech: `${greeting}essa bancada deu trabalho, hein? Teve susto e penalidade pelo caminho, mas o importante é que você não desistiu, ajustou o passo e garantiu os 7 selos. Da próxima vez o tempo cai ainda mais!`,
  }
}

/**
 * Metadados puramente visuais dos 7 membros do Conselho Next (SEM perguntas, opções ou gabarito no bundle).
 * A fonte oficial e única de perguntas e alternativas é `GET /api/desafios` (rota autenticada).
 */
export const COUNCIL_MEMBERS = [
  {
    id: 1,
    code: 'M1',
    name: 'André / Sapo',
    role: 'Cadeira 01 · Estrutura & Unidades',
    shortLabel: 'Unidades',
    seatPosition: 'left-outer',
    avatarGradient: 'from-sky-500 to-blue-900',
    borderAccent: 'border-sky-400',
    glowAccent: 'shadow-sky-500/25',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  },
  {
    id: 2,
    code: 'M2',
    name: 'Ramon',
    role: 'Cadeira 02 · Cultura & Valores',
    shortLabel: 'Valores',
    seatPosition: 'left-mid',
    avatarGradient: 'from-teal-500 to-emerald-900',
    borderAccent: 'border-teal-400',
    glowAccent: 'shadow-teal-500/25',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
  },
  {
    id: 3,
    code: 'M3',
    name: 'Vanessa',
    role: 'Cadeira 03 · Propósito Next',
    shortLabel: 'Ser Next',
    seatPosition: 'left-inner',
    avatarGradient: 'from-amber-500 to-orange-950',
    borderAccent: 'border-amber-400',
    glowAccent: 'shadow-amber-500/25',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  {
    id: 4,
    code: 'M4',
    name: 'Jhonny',
    role: 'Cadeira 04 · Endomarketing & Eventos',
    shortLabel: 'Eventos',
    seatPosition: 'center',
    avatarGradient: 'from-purple-500 to-indigo-950',
    borderAccent: 'border-purple-400',
    glowAccent: 'shadow-purple-500/25',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  },
  {
    id: 5,
    code: 'M5',
    name: 'Juarez',
    role: 'Cadeira 05 · Rotina & Ponto',
    shortLabel: 'Ponto',
    seatPosition: 'right-inner',
    avatarGradient: 'from-rose-500 to-red-950',
    borderAccent: 'border-rose-400',
    glowAccent: 'shadow-rose-500/25',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
  },
  {
    id: 6,
    code: 'M6',
    name: 'Ricardo',
    role: 'Cadeira 06 · Tecnologia & ERP',
    shortLabel: 'ERP',
    seatPosition: 'right-mid',
    avatarGradient: 'from-cyan-500 to-slate-900',
    borderAccent: 'border-cyan-400',
    glowAccent: 'shadow-cyan-500/25',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
  },
  {
    id: 7,
    code: 'M7',
    name: 'Ed',
    role: 'Cadeira 07 · Imagem & Dress Code',
    shortLabel: 'Dress Code',
    seatPosition: 'right-outer',
    avatarGradient: 'from-emerald-500 to-green-950',
    borderAccent: 'border-emerald-400',
    glowAccent: 'shadow-emerald-500/25',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
]
