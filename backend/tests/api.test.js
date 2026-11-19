import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import { createApp } from '../src/app.js'
import prisma from '../src/db.js'
import {
  avaliarBonusAcerto,
  avaliarResultadoErro,
  calcularSegundosTotais,
  calcularTempoServidor,
} from '../src/utils/gameRules.js'
import {
  CONSELHEIROS_REFERENCIA,
  formatarFalaComReferencia,
  selecionarMensagemAprovacao,
} from '../src/utils/dialogosConselho.js'
import { maskEmail } from '../src/utils/securityLogger.js'

const RUN_TAG = `autotest.${Date.now()}`
const createdEmails = []

const CSRF_HEADERS = {
  'X-Requested-With': 'fetch',
}

function jsonHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...CSRF_HEADERS,
    ...extra,
  }
}

function makeTestEmail(label) {
  const email = `${RUN_TAG}.${label}@falavinha.com.br`
  createdEmails.push(email)
  return email
}

async function registerPlayer({
  nome,
  email,
  senha,
  unidade = 'Londrina',
  setor = 'TI',
  genero = 'masculino',
}) {
  const res = await fetch(`${baseUrl}/auth/cadastrar`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ nome, email, senha, unidade, setor, genero }),
  })
  const setCookie = res.headers.get('set-cookie')
  const cookie = setCookie ? setCookie.split(';')[0] : null
  const data = await res.json()
  return { res, data, cookie, setCookie }
}

let server
let baseUrl

describe('Escape Room Falavinha v2 — API, Regras de Negócio & Segurança', () => {
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

  test('Hardening Express: helmet, healthcheck com banco, rate-limit, CSRF (LAN ok em dev, externo bloqueado) e 404 sem path', async () => {
    const res = await fetch(`${baseUrl}/health`)
    assert.equal(res.status, 200)
    const healthData = await res.json()
    assert.equal(healthData.database, 'ok')
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.ok(res.headers.get('ratelimit'))

    // 404 não deve refletir req.originalUrl
    const notFound = await fetch(`${baseUrl}/rota-inexistente-seguranca`)
    assert.equal(notFound.status, 404)
    const notFoundData = await notFound.json()
    assert.equal('path' in notFoundData, false)

    // Payload > 50kb -> 413
    const bigBody = JSON.stringify({ nome: 'A'.repeat(60 * 1024) })
    const bigRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: bigBody,
    })
    assert.equal(bigRes.status, 413)

    // CSRF: POST sem X-Requested-With -> 403
    const noCsrf = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@falavinha.com.br', senha: 'Senha123' }),
    })
    assert.equal(noCsrf.status, 403)

    // CSRF: POST com Origin externa não autorizada -> 403
    const badOrigin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders({ Origin: 'https://externo-malicioso.example.com' }),
      body: JSON.stringify({ email: 'a@falavinha.com.br', senha: 'Senha123' }),
    })
    assert.equal(badOrigin.status, 403)

    // Em development, origem de IP privado da LAN com X-Requested-With é aceita (não dá 403)
    const lanOrigin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders({ Origin: 'http://192.168.1.50:5174' }),
      body: JSON.stringify({ email: 'naoexiste.lan@falavinha.com.br', senha: 'Senha123' }),
    })
    assert.equal(lanOrigin.status, 401)
  })

  test('Cadastro: valida @falavinha.com.br, senha 8..72 bytes, unidade/setor, bcrypt e SameSite=Strict', async () => {
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

    const longPass = await registerPlayer({
      nome: 'Longa',
      email: makeTestEmail('long'),
      senha: 'A'.repeat(73),
    })
    assert.equal(longPass.res.status, 400)

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
    assert.ok(ok.setCookie?.toLowerCase().includes('samesite=strict'))

    // Duplicado -> 409
    const dup = await registerPlayer({
      nome: 'Colaborador Duplicado',
      email: validEmail,
      senha: 'SenhaForte123',
    })
    assert.equal(dup.res.status, 409)

    const dbUser = await prisma.jogador.findUnique({ where: { email: validEmail } })
    assert.ok(dbUser.senha.startsWith('$2'))
    assert.notEqual(dbUser.senha, 'SenhaForte123')
  })

  test('Login, restauração de sessão (/auth/me) e revogação real do JWT no logout (tokenVersion)', async () => {
    const email = makeTestEmail('session')
    await registerPlayer({ nome: 'Sessao User', email, senha: 'MinhaSenha99' })

    const wrong = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, senha: 'Errada999' }),
    })
    assert.equal(wrong.status, 401)

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
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
      headers: { Cookie: cookie, ...CSRF_HEADERS },
    })
    assert.equal(logoutRes.status, 200)
    assert.ok(
      logoutRes.headers.get('set-cookie')?.includes('Max-Age=0') ||
        logoutRes.headers.get('set-cookie')?.includes('Expires=')
    )

    // Reutilizar o cookie antigo após logout deve ser rejeitado (revogação real via tokenVersion)
    const revokedMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: cookie },
    })
    assert.equal(revokedMe.status, 401)
  })

  test('Proteção de rotas e sigilo de gabarito em GET /api/desafios', async () => {
    // Sem sessão -> 401
    const unauthDesafios = await fetch(`${baseUrl}/desafios`)
    assert.equal(unauthDesafios.status, 401)

    const unauthRank = await fetch(`${baseUrl}/ranking`)
    assert.equal(unauthRank.status, 401)

    const unauthSetores = await fetch(`${baseUrl}/ranking/setores`)
    assert.equal(unauthSetores.status, 401)

    // Autenticado -> retorna 7 desafios SEM correta e SEM approvalMessage/mensagemAprovacao
    const user = await registerPlayer({
      nome: 'Check Desafios',
      email: makeTestEmail('desafios'),
      senha: 'SenhaDesafios1',
    })
    const authDesafios = await fetch(`${baseUrl}/desafios`, {
      headers: { Cookie: user.cookie },
    })
    assert.equal(authDesafios.status, 200)
    const lista = await authDesafios.json()
    assert.equal(lista.length, 7)
    for (const d of lista) {
      assert.equal('approvalMessage' in d, false, 'approvalMessage não pode vazar em GET /desafios')
      assert.equal('mensagemAprovacao' in d, false)
      for (const opt of d.options) {
        assert.equal('correta' in opt, false)
      }
    }
  })

  test('Anti-IDOR, validação de UUID e reaproveitamento de partida intacta no forceNew', async () => {
    const noAuth = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    })
    assert.equal(noAuth.status, 401)

    const userA = await registerPlayer({
      nome: 'User A',
      email: makeTestEmail('idora'),
      senha: 'SenhaUserA1',
    })
    const userB = await registerPlayer({
      nome: 'User B',
      email: makeTestEmail('idorb'),
      senha: 'SenhaUserB1',
    })

    const startA1 = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: userA.cookie }),
      body: JSON.stringify({ forceNew: true }),
    })
    const { partida: partidaA } = await startA1.json()

    // Chamar forceNew novamente com a partida ainda intacta deve reaproveitar o mesmo ID (sem gerar CANCELADA)
    const startA2 = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: userA.cookie }),
      body: JSON.stringify({ forceNew: true }),
    })
    const { partida: partidaA2 } = await startA2.json()
    assert.equal(partidaA2.id, partidaA.id)

    const canceladasA = await prisma.partida.count({
      where: { jogadorId: userA.data.jogador.id, status: 'CANCELADA' },
    })
    assert.equal(canceladasA, 0)

    // Disparo concorrente simultâneo em /partidas/iniciar deve manter estritamente 1 partida EM_ANDAMENTO
    const [conc1, conc2] = await Promise.all([
      fetch(`${baseUrl}/partidas/iniciar`, {
        method: 'POST',
        headers: jsonHeaders({ Cookie: userA.cookie }),
        body: JSON.stringify({}),
      }).then((r) => r.json()),
      fetch(`${baseUrl}/partidas/iniciar`, {
        method: 'POST',
        headers: jsonHeaders({ Cookie: userA.cookie }),
        body: JSON.stringify({}),
      }).then((r) => r.json()),
    ])
    assert.equal(conc1.partida.id, conc2.partida.id)
    const ativasA = await prisma.partida.count({
      where: { jogadorId: userA.data.jogador.id, status: 'EM_ANDAMENTO' },
    })
    assert.equal(ativasA, 1)

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
      headers: jsonHeaders({ Cookie: userB.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'c' }),
    })
    assert.equal(valOther.status, 403)

    const histOther = await fetch(`${baseUrl}/partidas/jogador/${userA.data.jogador.id}/historico`, {
      headers: { Cookie: userB.cookie },
    })
    assert.equal(histOther.status, 403)

    // Forjar jogadorId no body de /iniciar não afeta User A
    const startB = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: userB.cookie }),
      body: JSON.stringify({ jogadorId: userA.data.jogador.id, forceNew: true }),
    })
    const { partida: partidaB } = await startB.json()
    assert.equal(partidaB.jogadorId, userB.data.jogador.id)
  })

  test('Cronômetro 100% server-side: exige largada e não pausa/zera via F5, /iniciar-cronometro ou sync', async () => {
    const user = await registerPlayer({
      nome: 'Timer AntiCheat',
      email: makeTestEmail('timer'),
      senha: 'SenhaTimer123',
    })
    const startRes = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({}),
    })
    const { partida } = await startRes.json()

    // Tentar validar antes de iniciar cronômetro -> 400
    const beforeStart = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'c', segundosReais: 0 }),
    })
    assert.equal(beforeStart.status, 400)

    // Inicia cronômetro
    const startClock = await fetch(`${baseUrl}/partidas/${partida.id}/iniciar-cronometro`, {
      method: 'POST',
      headers: { Cookie: user.cookie, ...CSRF_HEADERS },
    })
    assert.equal(startClock.status, 200)

    // Simula que o cronômetro iniciou há 25 segundos no servidor
    const vinteCincoSegundosAtras = new Date(Date.now() - 25 * 1000)
    await prisma.partida.update({
      where: { id: partida.id },
      data: { cronometroIniciadoEm: vinteCincoSegundosAtras, ultimoSyncEm: vinteCincoSegundosAtras },
    })

    // Chamar /auth/me (F5) e /iniciar-cronometro novamente NÃO zera o relógio
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: user.cookie } })
    const meData = await meRes.json()
    assert.ok(meData.partidaEmAndamento.segundosReais >= 24)

    const reStartClock = await fetch(`${baseUrl}/partidas/${partida.id}/iniciar-cronometro`, {
      method: 'POST',
      headers: { Cookie: user.cookie, ...CSRF_HEADERS },
    })
    const reStartData = await reStartClock.json()
    assert.equal(
      new Date(reStartData.cronometroIniciadoEm).getTime(),
      vinteCincoSegundosAtras.getTime()
    )

    // Enviar segundosReais: 0 em /sincronizar-tempo e /validar é completamente ignorado
    const syncRes = await fetch(`${baseUrl}/partidas/${partida.id}/sincronizar-tempo`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ segundosReais: 0 }),
    })
    const syncData = await syncRes.json()
    assert.ok(syncData.segundosReais >= 24)

    const valRes = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'c', segundosReais: 1 }),
    })
    assert.equal(valRes.status, 200)
    const valData = await valRes.json()
    assert.equal(valData.acertou, true)
    assert.ok(valData.mensagemAprovacao.length > 0, 'mensagemAprovacao deve vir somente no acerto')
    assert.ok(valData.segundosReais >= 24, `Esperava segundosReais >= 24, obteve ${valData.segundosReais}`)

    // Cooldown de 2s entre aprovações: responder imediatamente outro conselheiro deve dar 429
    const fastNext = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 2, opcaoId: 'a' }),
    })
    assert.equal(fastNext.status, 429)

    // Após >= 2s desde a aprovação anterior, o próximo conselheiro é aceito normalmente
    await prisma.tentativa.updateMany({
      where: { partidaId: partida.id, acertou: true },
      data: { criadoEm: new Date(Date.now() - 3000) },
    })
    const okNext = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 2, opcaoId: 'a' }),
    })
    assert.equal(okNext.status, 200)
  })

  test('Ciclo de erros (+5s, +5s, +10s), bloqueio de 10s, reset e anti-dupla-penalidade', async () => {
    const user = await registerPlayer({
      nome: 'Erro User',
      email: makeTestEmail('erros'),
      senha: 'SenhaErros1',
    })
    const startRes = await fetch(`${baseUrl}/partidas/iniciar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({}),
    })
    const { partida } = await startRes.json()

    await fetch(`${baseUrl}/partidas/${partida.id}/iniciar-cronometro`, {
      method: 'POST',
      headers: { Cookie: user.cookie, ...CSRF_HEADERS },
    })

    // 1º erro (+5s)
    const e1 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'a' }),
    })
    const d1 = await e1.json()
    assert.equal(d1.acertou, false)
    assert.equal(d1.penalidade, 5)
    assert.equal(d1.reprovado, false)

    // Repetir opção 'a' deve dar 400 sem aplicar +5s
    const dup = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'a' }),
    })
    assert.equal(dup.status, 400)

    // 2º erro (+5s)
    const e2 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'b' }),
    })
    const d2 = await e2.json()
    assert.equal(d2.penalidade, 5)
    assert.equal(d2.reprovado, false)

    // 3º erro (+10s, total +20s, bloqueio 10s e reset das opções)
    const e3 = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'd' }),
    })
    const d3 = await e3.json()
    assert.equal(d3.penalidade, 10)
    assert.equal(d3.reprovado, true)
    assert.equal(d3.bloqueioSegundos, 10)
    assert.equal(d3.opcoesResetadas, true)
    assert.equal(d3.partida.segundosPenalidade, 20)
    assert.equal(d3.partida.opcoesDesabilitadas.length, 0)
    assert.equal(
      d3.partida.tentativas.filter((t) => t.desafioId === 1).length,
      3,
      'Histórico de erros acumulados do conselheiro deve ser preservado mesmo após reset do ciclo'
    )

    // Durante bloqueio de 10s, tentar responder mesmo conselheiro -> 423
    const locked = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 1, opcaoId: 'c' }),
    })
    assert.equal(locked.status, 423)

    // Enquanto bloqueado no 1, consegue responder normalmente outro conselheiro (ex.: 2)
    const other = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
      method: 'POST',
      headers: jsonHeaders({ Cookie: user.cookie }),
      body: JSON.stringify({ membroId: 2, opcaoId: 'a' }),
    })
    assert.equal(other.status, 200)
    const dOther = await other.json()
    assert.equal(dOther.acertou, true)
  })

  test('Regras puras de bônus, erro e cálculo server-side do cronômetro', () => {
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
    const tempoServidor = calcularTempoServidor({
      partida: { segundosReais: 0, cronometroIniciadoEm: started15sAgo },
      now,
    })
    assert.equal(tempoServidor, 15)

    // Mascaramento LGPD de e-mail para logs de auditoria
    assert.equal(maskEmail('joao.oliveira@falavinha.com.br'), 'jo***@falavinha.com.br')
    assert.equal(maskEmail('ab@falavinha.com.br'), 'a***@falavinha.com.br')

    // Falas dinâmicas de aprovação e concordância de gênero nas falas cruzadas (Sapo / Vanessa)
    assert.equal(
      formatarFalaComReferencia(
        'Passou {pelo_pela} {nome} e agora passou por mim também.',
        CONSELHEIROS_REFERENCIA[1]
      ),
      'Passou pelo Sapo e agora passou por mim também.'
    )
    assert.equal(
      formatarFalaComReferencia(
        'Passou {pelo_pela} {nome} e agora passou por mim também.',
        CONSELHEIROS_REFERENCIA[3]
      ),
      'Passou pela Vanessa e agora passou por mim também.'
    )
    const falaCruzada = selecionarMensagemAprovacao({
      membroId: 2,
      acertouDePrimeira: true,
      membrosJaAprovados: [1],
      membrosRestantes: [3, 4],
      rng: () => 0.05,
    })
    assert.ok(falaCruzada.includes('Sapo'), `Esperava referência ao Sapo, obteve: ${falaCruzada}`)
    assert.equal(falaCruzada.includes('{'), false)

    const falaEducativa = selecionarMensagemAprovacao({
      membroId: 1,
      acertouDePrimeira: true,
      membrosJaAprovados: [2],
      membrosRestantes: [3],
      rng: () => 0.9,
    })
    assert.ok(
      falaEducativa.includes('Bacacheri'),
      `Esperava variação educativa do André/Sapo, obteve: ${falaEducativa}`
    )
  })

  test('Combo + Invicto, Ranking protegido sem e-mail/UUIDs de terceiros e Quórum por setor', async () => {
    const setorUnico = 'Inovação'
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
        headers: jsonHeaders({ Cookie: u.cookie }),
        body: JSON.stringify({}),
      })
      const { partida } = await start.json()

      await fetch(`${baseUrl}/partidas/${partida.id}/iniciar-cronometro`, {
        method: 'POST',
        headers: { Cookie: u.cookie, ...CSRF_HEADERS },
      })

      // Ajusta início simulado para diferenciar tempos entre os 3 participantes
      await prisma.partida.update({
        where: { id: partida.id },
        data: { cronometroIniciadoEm: new Date(Date.now() - (40 + idx * 5) * 1000) },
      })

      let finalPayload
      for (const [m, o] of gabarito) {
        // Simula intervalo humano (>= 2s) entre aprovações consecutivas
        await prisma.tentativa.updateMany({
          where: { partidaId: partida.id, acertou: true },
          data: { criadoEm: new Date(Date.now() - 3000) },
        })
        const res = await fetch(`${baseUrl}/partidas/${partida.id}/validar`, {
          method: 'POST',
          headers: jsonHeaders({ Cookie: u.cookie }),
          body: JSON.stringify({ membroId: m, opcaoId: o }),
        })
        assert.equal(res.status, 200)
        finalPayload = await res.json()
      }

      assert.equal(finalPayload.jogoConcluido, true)
      assert.equal(finalPayload.invicto, true)
      assert.equal(finalPayload.bonusInvicto, 10)
      assert.equal(finalPayload.segundosBonus, 20)
    }

    const rankRes = await fetch(`${baseUrl}/ranking`, {
      headers: { Cookie: users[0].cookie },
    })
    assert.equal(rankRes.status, 200)
    const ranking = await rankRes.json()
    const achado1 = ranking.find((r) => r.nome === 'Invicto 1')
    const achado2 = ranking.find((r) => r.nome === 'Invicto 2')
    assert.ok(achado1)
    assert.ok(achado2)
    assert.equal('email' in achado1, false)
    assert.equal('jogadorId' in achado1, false)
    assert.equal('id' in achado1, false)
    assert.equal(achado1.isCurrentUser, true)
    assert.equal(achado2.isCurrentUser, false)
    assert.equal(achado1.invicto, true)
    assert.equal(achado1.bonusSeconds, 20)
    assert.ok(achado1.posicao < achado2.posicao, 'Tempo menor deve ficar à frente no ranking DISTINCT ON')

    const setoresRes = await fetch(`${baseUrl}/ranking/setores`, {
      headers: { Cookie: users[0].cookie },
    })
    assert.equal(setoresRes.status, 200)
    const setores = await setoresRes.json()
    const op = setores.find((s) => s.setor === setorUnico)
    assert.ok(op)
    assert.equal(op.qualificado, true)
    assert.ok(op.participantesConcluidos >= 3)
  })

  test('Rate Limit corporativo (NAT): bloqueia brute-force em 1 e-mail sem bloquear outros colegas no mesmo IP', async () => {
    const emailAlvo = makeTestEmail('bruteforce.alvo')
    const emailColega = makeTestEmail('bruteforce.colega')
    await registerPlayer({ nome: 'Alvo', email: emailAlvo, senha: 'SenhaAlvo123' })
    await registerPlayer({ nome: 'Colega', email: emailColega, senha: 'SenhaColega123' })

    // 10 tentativas erradas no mesmo e-mail passam (retornam 401), a 11ª retorna 429
    for (let i = 0; i < 10; i += 1) {
      const r = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ email: emailAlvo, senha: 'SenhaErrada99' }),
      })
      assert.equal(r.status, 401)
    }

    const blocked = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email: emailAlvo, senha: 'SenhaErrada99' }),
    })
    assert.equal(blocked.status, 429)

    // Colega no mesmo IP consegue logar normalmente
    const colegaRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email: emailColega, senha: 'SenhaColega123' }),
    })
    assert.equal(colegaRes.status, 200)
  })
})
