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
 * - blocked: 3º erro no ciclo (reprovação + bloqueio de 10s)
 */
export const MEMBER_ERROR_DIALOGUES = {
  1: {
    error1:
      'Opa, passou longe! Puxa aí na memória onde a Falavinha está presente e tenta de novo.',
    error2:
      'Ainda não, hein... Pensa bem nos nossos endereços físicos. Última chance antes de eu fechar a porta!',
    blocked:
      'Aí não dá, né? Dá uma volta pelo Tribunal, respira fundo e volta aqui daqui a 10 segundos!',
  },
  2: {
    error1:
      'Hmm, essa não bate com a nossa cultura. Releia com calma e pense no que realmente nos move aqui dentro.',
    error2:
      'Ainda não é essa... Foco na solução, não no chute! Mais um erro e você vai precisar de uma pausa.',
    blocked:
      'Poxa, assim fica difícil defender! Vou te dar 10 segundos para repensar nossos pilares antes de tentar de novo.',
  },
  3: {
    error1:
      'Calma, não é bem por aí! Respira e pensa no propósito que a gente vive no dia a dia. Você sabe essa!',
    error2:
      'Ainda não! Eu confio em você, mas olha bem as opções — mais um erro e vou ter que pausar a sua tentativa.',
    blocked:
      'Ai, doeu em mim, mas tive que reprovar! Dá uma espairecida de 10 segundos e volta com tudo, combinado?',
  },
  4: {
    error1:
      'Eita, tá faltando aparecer nas integrações, hein? Pensa bem no evento que fecha todo mês com a equipe!',
    error2:
      'Ainda não! Como assim você esqueceu desse clássico da última quarta-feira do mês? Cuidado com o 3º erro!',
    blocked:
      'Reprovado! Vai ficar 10 segundos pensando no que anda perdendo na última semana do mês... Depois volta aqui!',
  },
  5: {
    error1:
      'Opa, deu divergência no espelho aí! Esse não é o nosso sistema de ponto. Tenta de novo!',
    error2:
      'De novo não! Tô começando a achar que você anda esquecendo de bater o ponto... Atenção máxima na próxima!',
    blocked:
      'Bateu errado pela terceira vez! Bloqueio de 10 segundos — aproveita para ficar DE OLHO NO PONTO!!',
  },
  6: {
    error1:
      'Erro 404 nessa resposta! Esse aí não é o nosso ERP. Dá uma revisada e manda de novo.',
    error2:
      'Travou o sistema? Ainda não é esse! Pensa na ferramenta que conecta todos os setores. Próximo erro dá tela azul!',
    blocked:
      'Sistema indisponível por 10 segundos! Aproveita o reboot para lembrar qual é o melhor ERP do mercado.',
  },
  7: {
    error1:
      'Hmm, esse visual não passa na recepção, não! Lembra das lições do PEAH e tenta novamente.',
    error2:
      'Ainda fora do padrão! Olha a seriedade da nossa imagem — mais um deslize e você vai precisar de um tempo para ajustar o look!',
    blocked:
      'Reprovado no quesito apresentação! 10 segundos fora da sala para revisar o PEAH e praticar o ECS antes de voltar.',
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
  'Não acredito que {o_a} {nome} te deu o voto! Vai descansar 10 segundos e volta mais ligado.'

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
 * - Se o jogador já passou por outros conselheiros, tem 25% de chance de abrir com fala cruzada.
 * - Caso contrário, exibe a saudação oficial daquele conselheiro.
 */
export function pickOpeningGreeting({
  memberId,
  defaultGreeting = '',
  completedMemberIds = [],
  totalMembers = 7,
}) {
  const othersCompleted = completedMemberIds
    .map(Number)
    .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))

  if (totalMembers > 1 && othersCompleted.length >= totalMembers - 1) {
    return FINAL_MEMBER_GREETING
  }

  if (othersCompleted.length > 0 && Math.random() < 0.25) {
    const refId = pickRandom(othersCompleted)
    const template = pickRandom(CROSS_TALK_GREETING_APPROVED)
    if (refId && template) {
      return formatCrossTalkSpeech(template, COUNCIL_SPEAKER_REFS[refId])
    }
  }

  return defaultGreeting
}

/**
 * Escolhe a fala de erro dinâmica do conselheiro:
 * - Combina falas personalizadas por conselheiro + nível do erro (1º, 2º ou 3º bloqueio)
 *   com falas cruzadas que citam conselheiros reais já aprovados ou ainda pendentes.
 */
export function pickErrorDialogue({
  memberId,
  errorNumber = 1,
  isBlocked = false,
  completedMemberIds = [],
  remainingMemberIds = [],
  lastSpeech = '',
  allowCrossTalk = true,
}) {
  const othersCompleted = completedMemberIds
    .map(Number)
    .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))
  const othersRemaining = remainingMemberIds
    .map(Number)
    .filter((id) => id !== memberId && Boolean(COUNCIL_SPEAKER_REFS[id]))

  const memberSet = MEMBER_ERROR_DIALOGUES[memberId]

  if (isBlocked) {
    if (allowCrossTalk && othersCompleted.length > 0 && Math.random() < 0.4) {
      const refId = pickRandom(othersCompleted)
      return formatCrossTalkSpeech(CROSS_TALK_BLOCKED_APPROVED, COUNCIL_SPEAKER_REFS[refId])
    }
    return memberSet?.blocked || getErrorDialogue(3)
  }

  const canCrossTalk =
    allowCrossTalk && (othersCompleted.length > 0 || othersRemaining.length > 0)

  if (canCrossTalk && Math.random() < 0.45) {
    const useApproved =
      othersCompleted.length > 0 && (othersRemaining.length === 0 || Math.random() < 0.72)

    const refId = useApproved ? pickRandom(othersCompleted) : pickRandom(othersRemaining)
    const templates = useApproved ? CROSS_TALK_ERROR_APPROVED : CROSS_TALK_ERROR_PENDING
    const candidates = templates
      .map((tpl) => formatCrossTalkSpeech(tpl, COUNCIL_SPEAKER_REFS[refId]))
      .filter((line) => line !== lastSpeech)

    const chosen = pickRandom(candidates.length > 0 ? candidates : templates)
    if (chosen) {
      return chosen.includes('{')
        ? formatCrossTalkSpeech(chosen, COUNCIL_SPEAKER_REFS[refId])
        : chosen
    }
  }

  if (memberSet) {
    return errorNumber >= 2 ? memberSet.error2 : memberSet.error1
  }

  return getErrorDialogue(errorNumber)
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
    step: 'CENA 01 · A SALA DA PRESIDÊNCIA',
    title: 'A Ideia do CEO',
    bgGradient: 'from-amber-500/20 via-slate-900 to-slate-950',
    accentColor: 'border-amber-400',
    badgeText: '18h45 · Cobertura Falavinha Next',
    narration: 'No alto do prédio corporativo, o CEO observa os indicadores de final de ano e tem uma epifania...',
    speech: '“Precisamos de um exame prático definitivo para avaliar nossos funcionários sob pressão real!”',
  },
  {
    id: 2,
    step: 'CENA 02 · A CONVOCAÇÃO',
    title: 'A Ligação Direta',
    bgGradient: 'from-teal-500/20 via-slate-900 to-slate-950',
    accentColor: 'border-teal-400',
    badgeText: 'Linha Vermelha · Ramal do Conselho',
    narration: 'Sem perder um segundo, ele aciona o ramal confidencial que conecta as 7 lideranças da empresa.',
    speech: '“Convoquem as 7 cabeças na Sala Circular. Ninguém sai sem o veredito unânime da bancada.”',
  },
  {
    id: 3,
    step: 'CENA 03 · O CHAMADO',
    title: 'O Próximo Candidato',
    bgGradient: 'from-sky-500/20 via-slate-900 to-slate-950',
    accentColor: 'border-sky-400',
    badgeText: 'Intimação Imediata',
    narration: 'O telefone desliga. No seu monitor, um alerta pisca: sua presença foi requisitada no Conselho Next.',
    speech: '“O cronômetro já está rodando. Vamos descobrir quem realmente conhece a Falavinha Next.”',
  },
]

export const CEO_TRIBUNAL_BRIEFING = {
  name: 'Jhonny',
  title: 'CEO · Presidente do Conselho',
  message:
    'Seja bem-vindo ao Conselho Next! Logo adiante, estarão os 7 conselheiros que decidiram fazer parte dessa sua avaliação. Você poderá conversar com eles na ordem que preferir... mas não se engane: todos estarão de olho nas suas respostas, e isso vai decidir o seu futuro por aqui. A cada aprovação conquistada, você avançará mais um passo no labirinto até alcançar a sala do cliente. O seu desempenho será medido pelo tempo total de prova — e, atenção, cada erro somará +5s ao relógio. Se errar 3 vezes na mesma cadeira, você levará +10s, precisará refazer a questão e aquele conselheiro só voltará a te receber depois de 10s. Mas calma, nem tudo é notícia ruim... Acertar 3 conselheiros seguidos de primeira garante -5s de bônus, e fechar o Conselho invicto rende mais -10s extras! Agora é por sua própria conta e risco: abra o labirinto e comece o desafio.',
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
