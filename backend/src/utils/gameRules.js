export const PENALIDADE_ERRO_SIMPLES = 5
export const PENALIDADE_ERRO_REPROVACAO = 10
export const LIMITE_ERROS_CICLO = 3
export const DURACAO_BLOQUEIO_SEGUNDOS = 20
export const COMBO_TAMANHO = 3
export const BONUS_COMBO_SEGUNDOS = 5
export const BONUS_INVICTO_SEGUNDOS = 10
export const TEMPO_MINIMO_OFICIAL = 1
export const TEMPO_SUSPEITO_CONCLUSAO_SEGUNDOS = 5
// Intervalo mínimo obrigatório após uma aprovação (compatível com o mínimo real de 2,5s da interface)
export const COOLDOWN_APOS_APROVACAO_MS = 2000
// Limites determinísticos da pausa server-side durante a fala final de aprovação + modal 3D de avanço
export const MINIMO_LEITURA_APROVACAO_MS = 2500
export const RESPIRO_POS_FALA_APROVACAO_MS = 1000
export const MAXIMO_LEITURA_APROVACAO_MS = 12000
export const FOLGA_MODAL_AVANCO_3D_MS = 4500
export const MAXIMO_PAUSA_APROVACAO_TOTAL_MS =
  MAXIMO_LEITURA_APROVACAO_MS + FOLGA_MODAL_AVANCO_3D_MS

export function calcularSegundosTotais({
  segundosReais = 0,
  segundosPenalidade = 0,
  segundosBonus = 0,
}) {
  return Math.max(
    TEMPO_MINIMO_OFICIAL,
    Math.floor(segundosReais) + Math.floor(segundosPenalidade) - Math.floor(segundosBonus)
  )
}

/**
 * Estima a duração determinística da fala de aprovação usando exatamente a mesma cadência
 * do efeito typewriter do frontend (speed = 22ms + pausas de pontuação) + respiro final de 1s,
 * respeitando o piso de 2,5s e o teto anti-cheat de 12s.
 */
export function estimarDuracaoLeituraAprovacaoMs(texto, speed = 22) {
  const normalized = String(texto || '')
  let duracaoFalaMs = 0

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]
    const nextCh = normalized[i + 1]

    if (/[.!?]/.test(ch)) {
      if (nextCh && /[.!?]/.test(nextCh)) {
        duracaoFalaMs += speed * 1.4
      } else {
        duracaoFalaMs += Math.max(speed * 10, 250)
      }
    } else if (/[,;:—–]/.test(ch)) {
      duracaoFalaMs += Math.max(speed * 5, 125)
    } else {
      duracaoFalaMs += speed
    }
  }

  const totalEstimado = Math.ceil(duracaoFalaMs) + RESPIRO_POS_FALA_APROVACAO_MS
  return Math.min(
    MAXIMO_LEITURA_APROVACAO_MS,
    Math.max(MINIMO_LEITURA_APROVACAO_MS, totalEstimado)
  )
}

/**
 * Calcula o teto da pausa de aprovação somando uma folga determinística para
 * a animação do modal 3D de avanço no labirinto (mantendo teto anti-cheat).
 */
export function calcularLimitePausaAprovacaoMs(duracaoLeituraMs = MINIMO_LEITURA_APROVACAO_MS) {
  const baseLeitura = Math.max(MINIMO_LEITURA_APROVACAO_MS, Number(duracaoLeituraMs) || 0)
  return Math.min(MAXIMO_PAUSA_APROVACAO_TOTAL_MS, baseLeitura + FOLGA_MODAL_AVANCO_3D_MS)
}

/**
 * Retorna quantos milissegundos da pausa ativa de aprovação devem ser descontados até `now`,
 * sempre limitado ao teto server-side `pausaMaximaAte` (impede congelar o cronômetro).
 */
export function calcularPausaAtivaMs(partida, now = new Date()) {
  if (!partida?.pausadoDesde || !partida?.pausaMaximaAte) {
    return 0
  }

  const inicioPausaMs = new Date(partida.pausadoDesde).getTime()
  const limitePausaMs = new Date(partida.pausaMaximaAte).getTime()
  if (!Number.isFinite(inicioPausaMs) || !Number.isFinite(limitePausaMs)) {
    return 0
  }

  const fimEfetivoMs = Math.min(now.getTime(), limitePausaMs)
  return Math.max(0, fimEfetivoMs - inicioPausaMs)
}

/**
 * Consolida a janela de pausa atualmente aberta na partida (se existir),
 * somando o trecho efetivamente pausado (limitado por `pausaMaximaAte`) em `pausaMsAcumulados`.
 */
export function consolidarPausaServidor({ partida, now = new Date() }) {
  const baseAcumulada = Math.max(0, Number(partida?.pausaMsAcumulados) || 0)
  const tinhaPausa = Boolean(partida?.pausadoDesde && partida?.pausaMaximaAte)
  const pausaConcluidaMs = tinhaPausa ? calcularPausaAtivaMs(partida, now) : 0

  return {
    tinhaPausa,
    pausaConcluidaMs,
    pausaMsAcumulados: baseAcumulada + pausaConcluidaMs,
  }
}

/**
 * Calcula o tempo real 100% no servidor (anti-cheat):
 * - Ignora completamente qualquer contagem enviada pelo cliente.
 * - Baseia-se exclusivamente no intervalo entre `cronometroIniciadoEm` e `now`,
 *   descontando apenas pausas oficiais de leitura de aprovação autorizadas e limitadas pelo servidor.
 * - Nunca retrocede abaixo do `segundosReais` já persistido na partida.
 */
export function calcularTempoServidor({ partida, now = new Date() }) {
  const baseAtual = Math.max(0, Number(partida?.segundosReais) || 0)

  if (!partida?.cronometroIniciadoEm) {
    return baseAtual
  }

  const inicioMs = new Date(partida.cronometroIniciadoEm).getTime()
  if (!Number.isFinite(inicioMs)) {
    return baseAtual
  }

  const pausasAcumuladasMs = Math.max(0, Number(partida?.pausaMsAcumulados) || 0)
  const pausaAtivaMs = calcularPausaAtivaMs(partida, now)
  const tempoAtivoMs = Math.max(0, now.getTime() - inicioMs - pausasAcumuladasMs - pausaAtivaMs)
  const decorrido = Math.floor(tempoAtivoMs / 1000)
  return Math.max(baseAtual, decorrido)
}

/**
 * Avalia a punição de um erro no ciclo atual do conselheiro:
 * - 1º e 2º erros: +5s sem bloqueio
 * - 3º erro: +10s (totalizando +20s no ciclo), reprovação e bloqueio de 20s com reset das opções
 */
export function avaliarResultadoErro({ errosAnterioresNoCiclo = 0 }) {
  if (errosAnterioresNoCiclo >= LIMITE_ERROS_CICLO - 1) {
    return {
      reprovado: true,
      penalidade: PENALIDADE_ERRO_REPROVACAO,
      bloqueioSegundos: DURACAO_BLOQUEIO_SEGUNDOS,
    }
  }

  return {
    reprovado: false,
    penalidade: PENALIDADE_ERRO_SIMPLES,
    bloqueioSegundos: 0,
  }
}

/**
 * Avalia bônus ao acertar um conselheiro:
 * - 3 acertos seguidos de primeira: -5s (combo)
 * - Concluir todos sem nenhum erro na partida: -10s extras (invicto)
 */
export function avaliarBonusAcerto({
  comboAtual = 0,
  acertouDePrimeira = false,
  jogoConcluido = false,
  totalErrosPartida = 0,
}) {
  let novoComboAtual = acertouDePrimeira ? comboAtual + 1 : 0
  let bonusCombo = 0
  let comboAtivado = false
  let incrementTotalCombos = 0

  if (novoComboAtual >= COMBO_TAMANHO) {
    comboAtivado = true
    bonusCombo = BONUS_COMBO_SEGUNDOS
    novoComboAtual = 0
    incrementTotalCombos = 1
  }

  const invicto = Boolean(jogoConcluido && totalErrosPartida === 0)
  const bonusInvicto = invicto ? BONUS_INVICTO_SEGUNDOS : 0

  return {
    novoComboAtual,
    comboAtivado,
    bonusCombo,
    incrementTotalCombos,
    invicto,
    bonusInvicto,
    bonusTotalAplicado: bonusCombo + bonusInvicto,
  }
}
