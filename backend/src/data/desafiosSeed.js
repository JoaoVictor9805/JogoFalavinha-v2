/**
 * Dados oficiais dos 7 membros do Conselho Next para o seed do banco de dados.
 */
export const DESAFIOS_CONSELHO = [
  {
    id: 1,
    codigo: 'M1',
    nome: 'Valdir',
    cargo: 'Cadeira 01 · Estrutura & Unidades',
    rotuloCurto: 'Unidades',
    posicaoMesa: 'left-outer',
    gradienteAvatar: 'from-sky-500 to-blue-900',
    corBorda: 'border-sky-400',
    corBrilho: 'shadow-sky-500/25',
    corBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Vamos começar pelo básico sobre quem somos e onde estamos presentes. Mostre que conhece nossa estrutura!',
    pergunta: 'Quantas unidades físicas temos?',
    mensagemAprovacao:
      'Resposta exata! Temos 3 unidades físicas. Você tem o meu voto de aprovação.',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: '5', correta: false },
      { opcaoId: 'b', rotulo: 'b)', texto: '2', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: '3', correta: true },
      { opcaoId: 'd', rotulo: 'd)', texto: '7', correta: false },
    ],
  },
  {
    id: 2,
    codigo: 'M2',
    nome: 'Ramon',
    cargo: 'Cadeira 02 · Cultura & Valores',
    rotuloCurto: 'Valores',
    posicaoMesa: 'left-mid',
    gradienteAvatar: 'from-teal-500 to-emerald-900',
    corBorda: 'border-teal-400',
    corBrilho: 'shadow-teal-500/25',
    corBadge: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Nossos valores guiam cada decisão no dia a dia. Quero ver se você tem os pilares da Falavinha Next na ponta da língua.',
    pergunta: 'Quais desses é um dos nossos valores?',
    mensagemAprovacao:
      'Excelente! Energia para transformar é um dos nossos valores essenciais. Aprovado!',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: 'Energia para transformar', correta: true },
      { opcaoId: 'b', rotulo: 'b)', texto: 'Comunicação assertiva', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: 'Resultados rápidos', correta: false },
      { opcaoId: 'd', rotulo: 'd)', texto: 'Coletividade', correta: false },
    ],
  },
  {
    id: 3,
    codigo: 'M3',
    nome: 'Vanessa',
    cargo: 'Cadeira 03 · Propósito Next',
    rotuloCurto: 'Ser Next',
    posicaoMesa: 'left-inner',
    gradienteAvatar: 'from-amber-500 to-orange-950',
    corBorda: 'border-amber-400',
    corBrilho: 'shadow-amber-500/25',
    corBadge: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Mais do que executar tarefas, existe uma mentalidade que define o nosso time. Responda com convicção:',
    pergunta: 'O que é ser Next?',
    mensagemAprovacao:
      'Isso mesmo! Ser Next é gerar mais resultados todos os dias. Tem a minha aprovação!',
    opcoes: [
      {
        opcaoId: 'a',
        rotulo: 'a)',
        texto: 'É responder o cliente no mínimo 2 horas',
        correta: false,
      },
      { opcaoId: 'b', rotulo: 'b)', texto: 'É chegar atrasado', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: 'É fazer ciências contábeis', correta: false },
      { opcaoId: 'd', rotulo: 'd)', texto: 'É gerar mais resultados', correta: true },
    ],
  },
  {
    id: 4,
    codigo: 'M4',
    nome: 'Jhonny',
    cargo: 'Cadeira 04 · Endomarketing & Eventos',
    rotuloCurto: 'Eventos',
    posicaoMesa: 'center',
    gradienteAvatar: 'from-purple-500 to-indigo-950',
    corBorda: 'border-purple-400',
    corBrilho: 'shadow-purple-500/25',
    corBadge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Cultura também se fortalece nos momentos de integração da equipe. Vamos ver se você conhece nosso calendário interno.',
    pergunta:
      'Qual o único evento interno da empresa que obrigatoriamente acontece na última semana do mês?',
    mensagemAprovacao:
      'Acertou! O Dia da Pizza é tradição garantida na última semana do mês. Aprovado!',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: 'Festa de final do ano', correta: false },
      { opcaoId: 'b', rotulo: 'b)', texto: 'Aniversário da empresa', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: 'Dia da Pizza', correta: true },
      { opcaoId: 'd', rotulo: 'd)', texto: 'Outubro Rosa', correta: false },
    ],
  },
  {
    id: 5,
    codigo: 'M5',
    nome: 'Juarez',
    cargo: 'Cadeira 05 · Rotina & Ponto',
    rotuloCurto: 'Ponto',
    posicaoMesa: 'right-inner',
    gradienteAvatar: 'from-rose-500 to-red-950',
    corBorda: 'border-rose-400',
    corBrilho: 'shadow-rose-500/25',
    corBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Organização começa no registro correto da nossa jornada. Qual ferramenta utilizamos para isso?',
    pergunta: 'Qual o nome do sistema que batemos o ponto?',
    mensagemAprovacao:
      'Pontofopag confirmado! Registro de ponto em dia é compromisso básico. Meu voto é favorável!',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: 'Epays', correta: false },
      { opcaoId: 'b', rotulo: 'b)', texto: 'Pontofopag', correta: true },
      { opcaoId: 'c', rotulo: 'c)', texto: 'Questor', correta: false },
      { opcaoId: 'd', rotulo: 'd)', texto: 'Sênior', correta: false },
    ],
  },
  {
    id: 6,
    codigo: 'M6',
    nome: 'Ricardo',
    cargo: 'Cadeira 06 · Tecnologia & ERP',
    rotuloCurto: 'ERP',
    posicaoMesa: 'right-mid',
    gradienteAvatar: 'from-cyan-500 to-slate-900',
    corBorda: 'border-cyan-400',
    corBrilho: 'shadow-cyan-500/25',
    corBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Eficiência operacional exige as melhores ferramentas de gestão. Quero saber sua resposta sobre tecnologia:',
    pergunta: 'Qual o melhor ERP do mercado?',
    mensagemAprovacao:
      'Exato! O CIGAM é a nossa referência como o melhor ERP do mercado. Está aprovado!',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: 'Questor', correta: false },
      { opcaoId: 'b', rotulo: 'b)', texto: 'Epays', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: 'CIGAM', correta: true },
      { opcaoId: 'd', rotulo: 'd)', texto: 'PontoMais', correta: false },
    ],
  },
  {
    id: 7,
    codigo: 'M7',
    nome: 'Ed',
    cargo: 'Cadeira 07 · Imagem & Dress Code',
    rotuloCurto: 'Dress Code',
    posicaoMesa: 'right-outer',
    gradienteAvatar: 'from-emerald-500 to-green-950',
    corBorda: 'border-emerald-400',
    corBrilho: 'shadow-emerald-500/25',
    corBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    tipo: 'multiple_choice',
    saudacao:
      'Nossa postura e apresentação também comunicam a seriedade da Falavinha Next. Para fechar o Conselho:',
    pergunta: 'Qual o dress code correto de um colaborador da Falavinha Next?',
    mensagemAprovacao:
      'Dress code Social confirmado! Você demonstrou conhecer a essência da Falavinha Next. Tem a minha aprovação no Conselho!',
    opcoes: [
      { opcaoId: 'a', rotulo: 'a)', texto: 'Social', correta: true },
      { opcaoId: 'b', rotulo: 'b)', texto: 'Casual', correta: false },
      { opcaoId: 'c', rotulo: 'c)', texto: 'Esporte fino', correta: false },
      { opcaoId: 'd', rotulo: 'd)', texto: 'Passeio completo', correta: false },
    ],
  },
]

