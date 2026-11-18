import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'
import {
  avaliarBonusAcerto,
  avaliarResultadoErro,
  calcularSegundosTotais,
  calcularTempoSeguro,
} from '../src/utils/gameRules.js'

const RUN_TAG = `autotest.${Date.now()}`
const createdEmails = []

function makeTestEmail(label) {
  const email = `${RUN_TAG}.${label}@falavinha.com.br`
  createdEmails.push(email)
  return email
}

async function registerPlayer({ nome, email, senha, unidade = 'Londrina', setor = 'TI / Inovação', genero = 'masculino' }) {
  const res = await fetch(`${baseUrl}/auth/cadastrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, unidade, setor, genero }),
  })
  const setCookie = res.headers.get('set-cookie')
  const cookie = setCookie ? setCookie.split(';')[0] : null
  const data = await res.json()
  return { res, data, cookie, setCookie }
}

let server
let baseUrl

describe('Escape Room Falavinha v2 — API & Regras de Negócio', () => {
  before(async () => {
    const app = createApp()
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve)
    })
    const { port } = server.address()
    baseUrl = `http://127.0.0.1:${port}/api`

    const totalDesafios = await prisma.desafio.count()
    assert.equal(totalDesafios, 7, 'Banco precisa estar com os 7 desafios semeados')
  })

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    if (createdEmails.length > 0) {
      await prisma.jogador.deleteMany({
        where: { email: { in: createdEmails } },
      })
    }
    await prisma.$disconnect()
  })

  test('Hardening Express: headers do helmet, rate-limit e limite de payload JSON', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.ok(res.headers.get('ratelimit'))

    const bigBody = JSON.stringify({ nome: 'A'.repeat(60 * 1024) })
    const bigRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bigBody,
    })
    assert.equal(bigRes.status, 413)
  })

  test('Cadastro: valida @falavinha.com.br, senha >= 8, unidade/setor oficiais e hash bcrypt', async () => {
    const ext = await registerPlayer({
      nome: 'Externo',
      email: 'externo@gmail.com',
      senha: 'SenhaForte123',
    })
    assert.equal(ext.res.status, 400)

    const shortPass = await registerPlayer({
      nome: 'Curta',
      email: makeTestEmail('short'),
      senha: '1234567',
    })
    assert.equal(shortPass.res.status, 400)

    const badSector = await registerPlayer({
      nome: 'Setor Ruim',
      email: makeTestEmail('badsector'),
      senha: 'SenhaForte123',
      setor: 'Setor Inventado',
    })
    assert.equal(badSector.res.status, 400)

    const validEmail = makeTestEmail('valid1')
    const ok = await registerPlayer({
      nome: 'Colaborador Válido',
      email: validEmail,
      senha: 'SenhaForte123',
    })
    assert.equal(ok.res.status, 201)
    assert.ok(ok.setCookie?.toLowerCase().includes('httponly'))

    const dbUser = await prisma.jogador.findUnique({ where: { email: validEmail } })
    assert.ok(dbUser.senha.startsWith('$2'))
    assert.notEqual(dbUser.senha, 'SenhaForte123')
  })

  test('Login, restauração de sessão (/auth/me) e logout', async () => {
    const email = makeTestEmail('session')
    await registerPlayer({ nome: 'Sessao User', email, senha: 'MinhaSenha99' })

    const wrong = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: 'Errada999' }),
    })
    assert.equal(wrong.status, 401)

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha: 'MinhaSenha99' }),
    })
    assert.equal(loginRes.status, 200)
    const cookie = loginRes.headers.get('set-cookie').split(';')[0]

    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: cookie },
    })
    assert.equal(meRes.status, 200)
    const meData = await meRes.json()
    assert.equal(meData.jogador.email, email)

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    })
    assert.equal(logoutRes.status, 200)
    assert.ok(logoutRes.headers.get('set-cookie')?.includes('Max-Age=0') || logoutRes.headers.get('set-cookie')?.includes('Expires='))
  })

  test('Anti-IDOR e validação de UUID nas rotas de partidas', async () => {
    const noAuth = await fetch(`${baseUrl}/partidas/iniciar`, { method: 'POST' })
    assert.equal(noAuth.status, 401)

    const userA = await registerPlayer({ nome: 'User A', email: makeTestEmail('idora'), senha: 'SenhaUserA1' })
    const userB = await registerPlayer({ nome: 'User B', email: makeTestEmail('idorb'), senha: 'SenhaUserB1' })

    const startA = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: { Cookie: userA.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const { partida: partidaA } = await startA.json()

    // UUID inválido
    const badUuid = await fetch(`${baseUrl}/partidas/nao-eh-uuid`, {
      headers: { Cookie: userA.cookie },
    })
    assert.equal(badUuid.status, 400)

    // User B não acessa partida nem histórico de User A
    const getOther = await fetch(`${baseUrl}/partidas/${partidaA.id}`, {
      headers: { Cookie: userB.cookie },
    })
    assert.equal(getOther.status, 403)

    const valOther = await fetch(`${baseUrl}/partidas/${partidaA.id}/validar`, {
      method: 'POST',
      headers: { Cookie: userB.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'c', segundosReais: 5 }),
    })
    assert.equal(valOther.status, 403)

    const histOther = await fetch(`${baseUrl}/partidas/jogador/${userA.data.jogador.id}/historico`, {
      headers: { Cookie: userB.cookie },
    })
    assert.equal(histOther.status, 403)

    // Forjar jogadorId no body de /iniciar não afeta User A
    const startB = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: { Cookie: userB.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jogadorId: userA.data.jogador.id, forceNew: true }),
    })
    const { partida: partidaB } = await startB.json()
    assert.equal(partidaB.jogadorId, userB.data.jogador.id)
  })

  test('Ciclo de erros (+5s, +5s, +10s), bloqueio de 10s, reset e anti-dupla-penalidade', async () => {
    const user = await registerPlayer({ nome: 'Erro User', email: makeTestEmail('erros'), senha: 'SenhaErros1' })
    const startRes = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const { partida } = await startRes.json()

    await fetch(`${baseUrl}/partidas/${partida.id}/iniciar-cronometro`, {
      method: 'POST',
      headers: { Cookie: user.cookie },
    })

    // 1º erro (+5s)
    const e1 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'a', segundosReais: 3 }),
    })
    const d1 = await e1.json()
    assert.equal(d1.acertou, false)
    assert.equal(d1.penalidade, 5)
    assert.equal(d1.reprovado, false)

    // Repetir opção 'a' deve dar 400 sem aplicar +5s
    const dup = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'a', segundosReais: 4 }),
    })
    assert.equal(dup.status, 400)

    // 2º erro (+5s)
    const e2 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'b', segundosReais: 5 }),
    })
    const d2 = await e2.json()
    assert.equal(d2.penalidade, 5)
    assert.equal(d2.reprovado, false)

    // 3º erro (+10s, total +20s, bloqueio 10s e reset das opções)
    const e3 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'd', segundosReais: 6 }),
    })
    const d3 = await e3.json()
    assert.equal(d3.penalidade, 10)
    assert.equal(d3.reprovado, true)
    assert.equal(d3.bloqueioSegundos, 10)
    assert.equal(d3.opcoesResetadas, true)
    assert.equal(d3.partida.segundosPenalidade, 20)
    assert.equal(d3.partida.opcoesDesabilitadas.length, 0)

    // Durante bloqueio de 10s, tentar responder mesmo conselheiro -> 423
    const locked = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 1, opcaoId: 'c', segundosReais: 7 }),
    })
    assert.equal(locked.status, 423)

    // Enquanto bloqueado no 1, consegue responder normalmente outro conselheiro (ex.: 2)
    const other = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: { Cookie: user.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId: 2, opcaoId: 'a', segundosReais: 8 }),
    })
    assert.equal(other.status, 200)
    const dOther = await other.json()
    assert.equal(dOther.acertou, true)
  })

  test('Regras puras de bônus, erro e anti-cheat de cronômetro', () => {
    assert.deepEqual(avaliarResultadoErro({ errosAnterioresNoCiclo: 2 }), {
      reprovado: true,
      penalidade: 10,
      bloqueioSegundos: 10,
    })

    const combo = avaliarBonusAcerto({
      comboAtual: 2,
      acertouDePrimeira: true,
      jogoConcluido: false,
      totalErrosPartida: 0,
    })
    assert.equal(combo.comboAtivado, true)
    assert.equal(combo.bonusCombo, 5)

    assert.equal(
      calcularSegundosTotais({ segundosReais: 10, segundosPenalidade: 0, segundosBonus: 20 }),
      1
    )

    const now = new Date()
    const started15sAgo = new Date(now.getTime() - 15000)
    const tempoSeguro = calcularTempoSeguro({
      partida: { segundosReais: 0, ultimoSyncEm: started15sAgo },
      clientSeconds: 1,
      now,
    })
    assert.ok(tempoSeguro >= 13, `Esperava tempoSeguro >= 13, obteve ${tempoSeguro}`)
  })

  test('Combo + Invicto, Ranking Geral sem e-mail e Quórum mínimo por setor', async () => {
    const setorUnico = 'Operações / Suporte'
    const users = []
    for (let i = 1; i <= 3; i += 1) {
      const u = await registerPlayer({
        nome: `Invicto ${i}`,
        email: makeTestEmail(`invicto${i}`),
        senha: 'SenhaInvicta1',
        setor: setorUnico,
      })
      users.push(u)
    }

    const gabarito = [
      [1, 'c'],
      [2, 'a'],
      [3, 'd'],
      [4, 'c'],
      [5, 'b'],
      [6, 'c'],
      [7, 'a'],
    ]

    for (let idx = 0; idx < users.length; idx += 1) {
      const u = users[idx]
      const start = await fetch(`${baseUrl}/partidas/iniciar`, {
        method: 'POST',
        headers: { Cookie: u.cookie, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const { partida } = await start.json()

      let finalPayload
      for (const [m, o] of gabarito) {
        const res = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
          method: 'POST',
          headers: { Cookie: u.cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify({ membroId: m, opcaoId: o, segundosReais: 40 + idx * 5 }),
        })
        finalPayload = await res.json()
      }

      assert.equal(finalPayload.jogoConcluido, true)
      assert.equal(finalPayload.invicto, true)
      assert.equal(finalPayload.bonusInvicto, 10)
      assert.equal(finalPayload.segundosBonus, 20)
    }

    const rankRes = await fetch(`${baseUrl}/ranking`)
    assert.equal(rankRes.status, 200)
    const ranking = await rankRes.json()
    const achado = ranking.find((r) => r.nome === 'Invicto 1')
    assert.ok(achado)
    assert.equal('email' in achado, false)
    assert.equal(achado.invicto, true)
    assert.equal(achado.bonusSeconds, 20)

    const setoresRes = await fetch(`${baseUrl}/ranking/setores`)
    assert.equal(setoresRes.status, 200)
    const setores = await setoresRes.json()
    const op = setores.find((s) => s.setor === setorUnico)
    assert.ok(op)
    assert.equal(op.qualificado, true)
    assert.ok(op.participantesConcluidos >= 3)
  })
})
