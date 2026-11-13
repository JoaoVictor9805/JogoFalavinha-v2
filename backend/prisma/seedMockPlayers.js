import prisma from '../src/db.js'

const MOCK_PLAYERS = [
  {
    nome: 'Mariana Silveira',
    email: 'mariana.silveira@falavinha.com.br',
    unidade: 'Curitiba - Matriz',
    setor: 'Contábil',
    realSeconds: 78,
    penaltySeconds: 5,
    totalErrors: 1,
  },
  {
    nome: 'Lucas Takahashi',
    email: 'lucas.takahashi@falavinha.com.br',
    unidade: 'Londrina',
    setor: 'TI / Inovação',
    realSeconds: 84,
    penaltySeconds: 0,
    totalErrors: 0,
  },
  {
    nome: 'Beatriz Almeida',
    email: 'beatriz.almeida@falavinha.com.br',
    unidade: 'Maringá',
    setor: 'Contábil',
    realSeconds: 92,
    penaltySeconds: 5,
    totalErrors: 1,
  },
  {
    nome: 'Gabriel Santos',
    email: 'gabriel.santos@falavinha.com.br',
    unidade: 'Curitiba - Matriz',
    setor: 'Tributário',
    realSeconds: 95,
    penaltySeconds: 10,
    totalErrors: 2,
  },
  {
    nome: 'Camila Fernandes',
    email: 'camila.fernandes@falavinha.com.br',
    unidade: 'Ponta Grossa',
    setor: 'Recursos Humanos',
    realSeconds: 102,
    penaltySeconds: 5,
    totalErrors: 1,
  },
  {
    nome: 'Rodrigo Medeiros',
    email: 'rodrigo.medeiros@falavinha.com.br',
    unidade: 'Cascavel',
    setor: 'Contábil',
    realSeconds: 110,
    penaltySeconds: 15,
    totalErrors: 3,
  },
  {
    nome: 'Juliana Costa',
    email: 'juliana.costa@falavinha.com.br',
    unidade: 'Curitiba - Matriz',
    setor: 'Financeiro',
    realSeconds: 115,
    penaltySeconds: 10,
    totalErrors: 2,
  },
  {
    nome: 'Felipe Antunes',
    email: 'felipe.antunes@falavinha.com.br',
    unidade: 'Londrina',
    setor: 'Tributário',
    realSeconds: 120,
    penaltySeconds: 5,
    totalErrors: 1,
  },
  {
    nome: 'Aline Nogueira',
    email: 'aline.nogueira@falavinha.com.br',
    unidade: 'Maringá',
    setor: 'TI / Inovação',
    realSeconds: 125,
    penaltySeconds: 10,
    totalErrors: 2,
  },
  {
    nome: 'Thiago Barcellos',
    email: 'thiago.barcellos@falavinha.com.br',
    unidade: 'Curitiba - Matriz',
    setor: 'Contábil',
    realSeconds: 132,
    penaltySeconds: 20,
    totalErrors: 4,
  },
  {
    nome: 'Renata Zanin',
    email: 'renata.zanin@falavinha.com.br',
    unidade: 'Ponta Grossa',
    setor: 'Tributário',
    realSeconds: 140,
    penaltySeconds: 15,
    totalErrors: 3,
  },
  {
    nome: 'Marcelo Pires',
    email: 'marcelo.pires@falavinha.com.br',
    unidade: 'Cascavel',
    setor: 'Recursos Humanos',
    realSeconds: 148,
    penaltySeconds: 10,
    totalErrors: 2,
  },
]

async function run() {
  console.log('Inserindo 12 jogadores simulados para teste de paginação...')

  // Limpa apenas as contas temporárias joao.oliveira2..6 criadas em testes rápidos, mantendo a conta oficial joao.oliveira@falavinha.com.br
  await prisma.jogador.deleteMany({
    where: {
      email: {
        in: [
          'joao.oliveira2@falavinha.com.br',
          'joao.oliveira3@falavinha.com.br',
          'joao.oliveira4@falavinha.com.br',
          'joao.oliveira5@falavinha.com.br',
          'joao.oliveira6@falavinha.com.br',
        ],
      },
    },
  })

  for (const item of MOCK_PLAYERS) {
    const jogador = await prisma.jogador.upsert({
      where: { email: item.email },
      update: {
        nome: item.nome,
        unidade: item.unidade,
        setor: item.setor,
      },
      create: {
        nome: item.nome,
        email: item.email,
        unidade: item.unidade,
        setor: item.setor,
        senha: '123',
      },
    })

    // Cria ou atualiza a partida concluída deste jogador
    const total = item.realSeconds + item.penaltySeconds
    const partidaExistente = await prisma.partida.findFirst({
      where: { jogadorId: jogador.id, status: 'CONCLUIDA' },
    })

    if (!partidaExistente) {
      await prisma.partida.create({
        data: {
          jogadorId: jogador.id,
          status: 'CONCLUIDA',
          etapaAtual: 7,
          membrosConcluidos: [1, 2, 3, 4, 5, 6, 7],
          segundosReais: item.realSeconds,
          segundosPenalidade: item.penaltySeconds,
          segundosTotais: total,
          totalErros: item.totalErrors,
          iniciadoEm: new Date(Date.now() - total * 1000),
          finalizadoEm: new Date(),
        },
      })
    }
  }

  const totalJogadores = await prisma.jogador.count()
  const totalPartidas = await prisma.partida.count({ where: { status: 'CONCLUIDA' } })
  console.log(`✅ Inserção concluída! Total no banco: ${totalJogadores} jogadores (${totalPartidas} partidas concluídas).`)

  await prisma.$disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

