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
 * 4 questões de múltipla escolha (1, 2, 4, 6) e 3 inputs de texto (3, 5, 7).
 */
export const COUNCIL_MEMBERS = [
  {
    id: 1,
    code: 'M1',
    name: 'Valdir',
    role: 'Cadeira 01 · Diretoria Tributária',
    shortLabel: 'Tributário',
    seatPosition: 'left-outer',
    avatarGradient: 'from-sky-500 to-blue-900',
    borderAccent: 'border-sky-400',
    glowAccent: 'shadow-sky-500/25',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    type: 'multiple_choice',
    greeting:
      'Vamos direto ao ponto. Quando um cliente procura eficiência fiscal, você precisa saber exatamente quem acionar.',
    question:
      'Um cliente ligou buscando novas estratégias para pagar menos impostos. Para qual departamento você encaminha?',
    options: [
      { id: 'a', label: 'a)', text: 'TRIBUTÁRIO', isCorrect: true },
      { id: 'b', label: 'b)', text: 'Contábil', isCorrect: false },
      { id: 'c', label: 'c)', text: 'Financeiro', isCorrect: false },
    ],
    approvalMessage:
      'Resposta exata! Estratégias de redução legal de impostos pertencem ao Tributário. Você tem o meu voto de aprovação.',
  },
  {
    id: 2,
    code: 'M2',
    name: 'Ramon',
    role: 'Cadeira 02 · Liderança de Comunicação',
    shortLabel: 'Comunicação',
    seatPosition: 'left-mid',
    avatarGradient: 'from-teal-500 to-emerald-900',
    borderAccent: 'border-teal-400',
    glowAccent: 'shadow-teal-500/25',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    type: 'multiple_choice',
    greeting:
      'A primeira impressão da empresa acontece no primeiro segundo da ligação. Demonstre que conhece nosso padrão.',
    question:
      'Quando atendemos o telefone, como um colaborador Falavinha Next deve responder?',
    options: [
      { id: 'a', label: 'a)', text: 'Boa tarde! Como posso ajudar?', isCorrect: false },
      { id: 'b', label: 'b)', text: 'Alô, quem fala?', isCorrect: false },
      {
        id: 'c',
        label: 'c)',
        text: 'FALAVINHA NEXT, BOM DIA/TARDE, (SEU NOME)',
        isCorrect: true,
      },
    ],
    approvalMessage:
      'Excelente! Identificar a Falavinha Next, cumprimentar e apresentar seu nome é a nossa marca registrada. Aprovado!',
  },
  {
    id: 3,
    code: 'M3',
    name: 'Vanessa',
    role: 'Cadeira 03 · Guardião Financeiro',
    shortLabel: 'Enigma',
    seatPosition: 'left-inner',
    avatarGradient: 'from-amber-500 to-orange-950',
    borderAccent: 'border-amber-400',
    glowAccent: 'shadow-amber-500/25',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    type: 'text_input',
    inputType: 'Enigma Corporativo',
    placeholder: 'Digite o nome da pessoa...',
    greeting:
      'Mais do que processos, valorizamos quem constrói nossa rotina todos os dias. Decifre este enigma:',
    question:
      'Minha voz chega antes de mim, mas ultimamente meus passos estão demorando... Se o assunto é dinheiro, pode me chamar! Faço as contas, confiro os números e não deixo nenhum centavo escapar. Quem sou eu?',
    correctAnswer: 'FLAVYO',
    caseSensitive: false,
    approvalMessage:
      'Isso mesmo, o Flavyo! Você conhece muito bem quem não deixa nenhum centavo escapar. Tem a minha aprovação!',
  },
  {
    id: 4,
    code: 'M4',
    name: 'Jhonny',
    role: 'Cadeira 04 · Compromisso & Prazos',
    shortLabel: 'Prazos',
    seatPosition: 'center',
    avatarGradient: 'from-purple-500 to-indigo-950',
    borderAccent: 'border-purple-400',
    glowAccent: 'shadow-purple-500/25',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    type: 'multiple_choice',
    greeting:
      'Na Falavinha Next, nossa palavra vale ouro. Como você age quando um imprevisto interno ameaça o prazo prometido?',
    question:
      'Você prometeu retorno hoje, mas quem tinha a informação não respondeu e o dia está terminando. O que fazer?',
    options: [
      { id: 'a', label: 'a)', text: 'Informa que continua acompanhando.', isCorrect: false },
      {
        id: 'b',
        label: 'b)',
        text: 'Cobra novamente a pessoa e espera um pouco mais.',
        isCorrect: false,
      },
      {
        id: 'c',
        label: 'c)',
        text: 'ENTRA EM CONTATO, RECONHECE O ATRASO E COMBINA NOVO PRAZO',
        isCorrect: true,
      },
    ],
    approvalMessage:
      'Postura de dono! Assumir o compromisso, informar com transparência e alinhar novo prazo honra nossa cultura. Aprovado!',
  },
  {
    id: 5,
    code: 'M5',
    name: 'Juarez',
    role: 'Cadeira 05 · Segurança Documental',
    shortLabel: 'Senha',
    seatPosition: 'right-inner',
    avatarGradient: 'from-rose-500 to-red-950',
    borderAccent: 'border-rose-400',
    glowAccent: 'shadow-rose-500/25',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    type: 'text_input',
    inputType: 'Credencial de Segurança',
    placeholder: 'Digite a senha...',
    greeting:
      'Diante de mim há um dossiê confidencial. Apenas quem detém a senha correta recebe meu aval.',
    question: 'O documento do cliente está bloqueado. Qual é a senha?',
    correctAnswer: '1977',
    caseSensitive: false,
    approvalMessage:
      'Senha 1977 validada! O documento do cliente foi desbloqueado com sucesso. Meu voto é favorável!',
  },
  {
    id: 6,
    code: 'M6',
    name: 'Ricardo',
    role: 'Cadeira 06 · Gestão de Atendimento',
    shortLabel: 'Atendimento',
    seatPosition: 'right-mid',
    avatarGradient: 'from-cyan-500 to-slate-900',
    borderAccent: 'border-cyan-400',
    glowAccent: 'shadow-cyan-500/25',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    type: 'multiple_choice',
    greeting:
      'Clientes irritados testam nossa empatia e maturidade profissional. Quero ver como você conduz uma situação crítica.',
    question:
      'Um cliente liga irritado, certo de que a empresa cometeu um erro, mas o erro foi no preenchimento dele. Como você conduziria esse atendimento?',
    options: [
      {
        id: 'a',
        label: 'a)',
        text: 'Explica com calma onde ocorreu o erro.',
        isCorrect: false,
      },
      {
        id: 'b',
        label: 'b)',
        text: 'DEIXA QUE ELE FALE, PROCURA COMPREENDER O INCÔMODO E SÓ DEPOIS EXPLICA',
        isCorrect: true,
      },
      {
        id: 'c',
        label: 'c)',
        text: 'Vai direto para a solução independente do erro.',
        isCorrect: false,
      },
    ],
    approvalMessage:
      'Conduta impecável! Ouvir e compreender o incômodo antes de explicar transforma conflito em confiança. Está aprovado!',
  },
  {
    id: 7,
    code: 'M7',
    name: 'Ed',
    role: 'Cadeira 07 · Metodologia PEAH',
    shortLabel: 'Código PEAH',
    seatPosition: 'right-outer',
    avatarGradient: 'from-emerald-500 to-green-950',
    borderAccent: 'border-emerald-400',
    glowAccent: 'shadow-emerald-500/25',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    type: 'text_input',
    inputType: 'Código Chave',
    placeholder: 'Digite a sigla...',
    greeting:
      'Minha cadeira guarda a síntese do nosso método de excelência. Informe o código que resume essa chave.',
    question: 'Precisamos da sigla chave do PEAH.',
    correctAnswer: 'ECS',
    caseSensitive: false,
    approvalMessage:
      'Sigla ECS confirmada! Você provou conhecer os pilares do PEAH. Tem a minha aprovação no Conselho!',
  },
]

