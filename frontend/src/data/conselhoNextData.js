/**
 * Falas dinâmicas de erro (limite de 5).
 * A cada erro cometido com um membro do Conselho, a fala de reação muda.
 * Se passar do 5º erro, repete a última frase.
 */
export const ERROR_DIALOGUES = [
  'Vamos tentar de novo, preste mais atenção.',
  'Ainda não é isso. Pense nos nossos processos.',
  'Você está chutando? Lembre-se que o tempo e os +5 segundos de penalidade estão correndo!',
  'Concentre-se! Você consegue fazer melhor que isso.',
  'Esta é sua última chance moral, pense bem antes de responder.',
]

export function getErrorDialogue(errorCount) {
  if (!errorCount || errorCount <= 0) return null
  const idx = Math.min(errorCount - 1, ERROR_DIALOGUES.length - 1)
  return ERROR_DIALOGUES[idx]
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
  name: 'CEO · Presidente do Conselho',
  title: 'Abertura da Sessão do Tribunal',
  message:
    'Bem-vindo ao Conselho Next! Diante de você estão as 7 lideranças da empresa, e você pode escolhê-las em qualquer ordem. A cada resposta correta, o Johnny avança uma etapa pelo labirinto 3D rumo à sala do cliente — e você verá cada passo dele no mapa. Mas cuidado: cada erro adiciona +5 segundos ao seu tempo. Clique em avançar para conhecer o labirinto e começar!',
}

/**
 * Base de dados oficial dos 7 membros do Conselho Next.
 * Todas as 7 questões são de múltipla escolha (4 alternativas cada).
 */
export const COUNCIL_MEMBERS = [
  {
    id: 1,
    code: 'M1',
    name: 'Valdir',
    role: 'Cadeira 01 · Estrutura & Unidades',
    shortLabel: 'Unidades',
    seatPosition: 'left-outer',
    avatarGradient: 'from-sky-500 to-blue-900',
    borderAccent: 'border-sky-400',
    glowAccent: 'shadow-sky-500/25',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    type: 'multiple_choice',
    greeting:
      'Vamos começar pelo básico sobre quem somos e onde estamos presentes. Mostre que conhece nossa estrutura!',
    question: 'Quantas unidades físicas temos?',
    options: [
      { id: 'a', label: 'a)', text: '5', isCorrect: false },
      { id: 'b', label: 'b)', text: '2', isCorrect: false },
      { id: 'c', label: 'c)', text: '3', isCorrect: true },
      { id: 'd', label: 'd)', text: '7', isCorrect: false },
    ],
    approvalMessage:
      'Resposta exata! Temos 3 unidades físicas. Você tem o meu voto de aprovação.',
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
    type: 'multiple_choice',
    greeting:
      'Nossos valores guiam cada decisão no dia a dia. Quero ver se você tem os pilares da Falavinha Next na ponta da língua.',
    question: 'Quais desses é um dos nossos valores?',
    options: [
      { id: 'a', label: 'a)', text: 'Energia para transformar', isCorrect: true },
      { id: 'b', label: 'b)', text: 'Comunicação assertiva', isCorrect: false },
      { id: 'c', label: 'c)', text: 'Resultados rápidos', isCorrect: false },
      { id: 'd', label: 'd)', text: 'Coletividade', isCorrect: false },
    ],
    approvalMessage:
      'Excelente! Energia para transformar é um dos nossos valores essenciais. Aprovado!',
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
    type: 'multiple_choice',
    greeting:
      'Mais do que executar tarefas, existe uma mentalidade que define o nosso time. Responda com convicção:',
    question: 'O que é ser Next?',
    options: [
      {
        id: 'a',
        label: 'a)',
        text: 'É responder o cliente no mínimo 2 horas',
        isCorrect: false,
      },
      { id: 'b', label: 'b)', text: 'É chegar atrasado', isCorrect: false },
      { id: 'c', label: 'c)', text: 'É fazer ciências contábeis', isCorrect: false },
      { id: 'd', label: 'd)', text: 'É gerar mais resultados', isCorrect: true },
    ],
    approvalMessage:
      'Isso mesmo! Ser Next é gerar mais resultados todos os dias. Tem a minha aprovação!',
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
    type: 'multiple_choice',
    greeting:
      'Cultura também se fortalece nos momentos de integração da equipe. Vamos ver se você conhece nosso calendário interno.',
    question:
      'Qual o único evento interno da empresa que obrigatoriamente acontece na última semana do mês?',
    options: [
      { id: 'a', label: 'a)', text: 'Festa de final do ano', isCorrect: false },
      { id: 'b', label: 'b)', text: 'Aniversário da empresa', isCorrect: false },
      { id: 'c', label: 'c)', text: 'Dia da Pizza', isCorrect: true },
      { id: 'd', label: 'd)', text: 'Outubro Rosa', isCorrect: false },
    ],
    approvalMessage:
      'Acertou! O Dia da Pizza é tradição garantida na última semana do mês. Aprovado!',
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
    type: 'multiple_choice',
    greeting:
      'Organização começa no registro correto da nossa jornada. Qual ferramenta utilizamos para isso?',
    question: 'Qual o nome do sistema que batemos o ponto?',
    options: [
      { id: 'a', label: 'a)', text: 'Epays', isCorrect: false },
      { id: 'b', label: 'b)', text: 'Pontofopag', isCorrect: true },
      { id: 'c', label: 'c)', text: 'Questor', isCorrect: false },
      { id: 'd', label: 'd)', text: 'Sênior', isCorrect: false },
    ],
    approvalMessage:
      'Pontofopag confirmado! Registro de ponto em dia é compromisso básico. Meu voto é favorável!',
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
    type: 'multiple_choice',
    greeting:
      'Eficiência operacional exige as melhores ferramentas de gestão. Quero saber sua resposta sobre tecnologia:',
    question: 'Qual o melhor ERP do mercado?',
    options: [
      { id: 'a', label: 'a)', text: 'Questor', isCorrect: false },
      { id: 'b', label: 'b)', text: 'Epays', isCorrect: false },
      { id: 'c', label: 'c)', text: 'CIGAM', isCorrect: true },
      { id: 'd', label: 'd)', text: 'PontoMais', isCorrect: false },
    ],
    approvalMessage:
      'Exato! O CIGAM é a nossa referência como o melhor ERP do mercado. Está aprovado!',
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
    type: 'multiple_choice',
    greeting:
      'Nossa postura e apresentação também comunicam a seriedade da Falavinha Next. Para fechar o Conselho:',
    question: 'Qual o dress code correto de um colaborador da Falavinha Next?',
    options: [
      { id: 'a', label: 'a)', text: 'Social', isCorrect: true },
      { id: 'b', label: 'b)', text: 'Casual', isCorrect: false },
      { id: 'c', label: 'c)', text: 'Esporte fino', isCorrect: false },
      { id: 'd', label: 'd)', text: 'Passeio completo', isCorrect: false },
    ],
    approvalMessage:
      'Dress code Social confirmado! Você demonstrou conhecer a essência da Falavinha Next. Tem a minha aprovação no Conselho!',
  },
]

