import { PrismaClient } from '@prisma/client'
import { DESAFIOS_CONSELHO } from '../src/data/desafiosSeed.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando o seed dos 7 desafios do Conselho Next...')

  for (const item of DESAFIOS_CONSELHO) {
    const { opcoes, ...desafioData } = item

    // Upsert do desafio principal
    const desafio = await prisma.desafio.upsert({
      where: { id: desafioData.id },
      update: {
        codigo: desafioData.codigo,
        nome: desafioData.nome,
        cargo: desafioData.cargo,
        rotuloCurto: desafioData.rotuloCurto,
        posicaoMesa: desafioData.posicaoMesa,
        gradienteAvatar: desafioData.gradienteAvatar,
        corBorda: desafioData.corBorda,
        corBrilho: desafioData.corBrilho,
        corBadge: desafioData.corBadge,
        tipo: desafioData.tipo,
        saudacao: desafioData.saudacao,
        pergunta: desafioData.pergunta,
        mensagemAprovacao: desafioData.mensagemAprovacao,
      },
      create: {
        id: desafioData.id,
        codigo: desafioData.codigo,
        nome: desafioData.nome,
        cargo: desafioData.cargo,
        rotuloCurto: desafioData.rotuloCurto,
        posicaoMesa: desafioData.posicaoMesa,
        gradienteAvatar: desafioData.gradienteAvatar,
        corBorda: desafioData.corBorda,
        corBrilho: desafioData.corBrilho,
        corBadge: desafioData.corBadge,
        tipo: desafioData.tipo,
        saudacao: desafioData.saudacao,
        pergunta: desafioData.pergunta,
        mensagemAprovacao: desafioData.mensagemAprovacao,
      },
    })

    // Upsert das 4 alternativas de cada desafio
    for (const opt of opcoes) {
      await prisma.opcaoDesafio.upsert({
        where: {
          desafioId_opcaoId: {
            desafioId: desafio.id,
            opcaoId: opt.opcaoId,
          },
        },
        update: {
          rotulo: opt.rotulo,
          texto: opt.texto,
          correta: opt.correta,
        },
        create: {
          desafioId: desafio.id,
          opcaoId: opt.opcaoId,
          rotulo: opt.rotulo,
          texto: opt.texto,
          correta: opt.correta,
        },
      })
    }

    console.log(`  ✓ Desafio ${desafio.id} (${desafio.nome}) e suas 4 alternativas sincronizadas.`)
  }

  const totalDesafios = await prisma.desafio.count()
  const totalOpcoes = await prisma.opcaoDesafio.count()

  console.log(`\n✅ Seed finalizado com sucesso!`)
  console.log(`   - Desafios inseridos/atualizados: ${totalDesafios}`)
  console.log(`   - Alternativas cadastradas: ${totalOpcoes}\n`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

