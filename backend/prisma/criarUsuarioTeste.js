import bcrypt from 'bcrypt'
import prisma from '../src/db.js'

const TEST_EMAIL = (process.env.TEST_USER_EMAIL || 'avaliacao@falavinha.com.br')
  .trim()
  .toLowerCase()
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Falavinha@Teste2026'
const TEST_NAME = process.env.TEST_USER_NAME || 'Usuário Avaliação'
const TEST_UNIT = process.env.TEST_USER_UNIT || 'Bacacheri'
const TEST_SECTOR = process.env.TEST_USER_SECTOR || 'TI'
const TEST_GENDER = process.env.TEST_USER_GENDER || 'masculino'

async function main() {
  const remover = process.argv.includes('--remover')

  if (remover) {
    const deleted = await prisma.jogador.deleteMany({
      where: { email: TEST_EMAIL },
    })
    console.log(`✅ Usuário de teste removido (${deleted.count} registro(s)): ${TEST_EMAIL}`)
    return
  }

  const senhaHash = await bcrypt.hash(TEST_PASSWORD, 10)
  const agora = new Date()

  const jogador = await prisma.jogador.upsert({
    where: { email: TEST_EMAIL },
    update: {
      nome: TEST_NAME,
      unidade: TEST_UNIT,
      setor: TEST_SECTOR,
      genero: TEST_GENDER,
      senha: senhaHash,
      emailVerificado: true,
      emailVerificadoEm: agora,
    },
    create: {
      nome: TEST_NAME,
      email: TEST_EMAIL,
      unidade: TEST_UNIT,
      setor: TEST_SECTOR,
      genero: TEST_GENDER,
      senha: senhaHash,
      emailVerificado: true,
      emailVerificadoEm: agora,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      unidade: true,
      setor: true,
      emailVerificado: true,
    },
  })

  console.log('✅ Usuário de teste pronto para avaliação:')
  console.log(`   - E-mail: ${jogador.email}`)
  console.log(`   - Senha:  ${TEST_PASSWORD}`)
  console.log(`   - Nome:   ${jogador.nome} (${jogador.unidade} / ${jogador.setor})`)
  console.log(`   - Status: emailVerificado=${jogador.emailVerificado}`)
}

main()
  .catch((err) => {
    console.error('❌ Erro ao gerenciar usuário de teste:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
